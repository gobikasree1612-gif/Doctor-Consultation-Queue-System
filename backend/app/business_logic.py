import re
import uuid
from datetime import datetime

class BusinessRuleError(Exception):
    def __init__(self, message, status_code=400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code

def validate_quantity(quantity):
    """
    BR1 - Quantity
    Must be a whole number from 1 through 5.
    Reject: 0, negative numbers, values above 5, decimal values, empty/non-numeric.
    """
    if quantity is None or quantity == '':
        raise BusinessRuleError("Quantity is required.", 400)
    
    # Check if it's a float or decimal in float representation like 2.5
    if isinstance(quantity, float):
        if not quantity.is_integer():
            raise BusinessRuleError("Quantity must be a whole integer without decimals.", 400)
        quantity = int(quantity)

    # Check string representation if passed as string
    if isinstance(quantity, str):
        if not re.match(r'^\d+$', quantity.strip()):
            raise BusinessRuleError("Quantity must be a valid whole number.", 400)
        quantity = int(quantity.strip())

    if not isinstance(quantity, int):
        raise BusinessRuleError("Quantity must be a valid whole number.", 400)

    if quantity < 1 or quantity > 5:
        raise BusinessRuleError("Quantity must be between 1 and 5.", 400)

    return quantity

def validate_customer_details(name, phone, consultation_date, identity_reference):
    """
    BR5 - Required Details
    Validation:
    - Name cannot be blank.
    - Phone must contain exactly 10 digits.
    - Date must be valid and required.
    - Identity/reference must be present and valid.
    """
    if not name or not str(name).strip():
        raise BusinessRuleError("Full name is required and cannot be blank.", 400)
    
    if not phone or not re.match(r'^\d{10}$', str(phone).strip()):
        raise BusinessRuleError("Phone number must contain exactly 10 digits.", 400)

    if not consultation_date or not str(consultation_date).strip():
        raise BusinessRuleError("Consultation date is required.", 400)

    if not identity_reference or not str(identity_reference).strip():
        raise BusinessRuleError("Identity / Reference ID is required.", 400)

    return {
        'name': str(name).strip(),
        'phone': str(phone).strip(),
        'consultation_date': str(consultation_date).strip(),
        'identity_reference': str(identity_reference).strip()
    }

def calculate_pricing(rate, quantity):
    """
    BR4 - Total Calculation
    base_amount = current_rate * quantity
    booking_charge = 50 if base_amount < 1000 else 0
    grand_total = base_amount + booking_charge
    """
    base_amount = rate * quantity
    booking_charge = 50 if base_amount < 1000 else 0
    grand_total = base_amount + booking_charge
    return {
        'base_amount': base_amount,
        'booking_charge': booking_charge,
        'grand_total': grand_total
    }

def create_booking_transaction(conn, user_id, username, slot_id, quantity, customer_details):
    """
    BR2, BR3, BR4, BR5, BR6, BR7 - Atomic Booking Confirmation
    """
    valid_qty = validate_quantity(quantity)
    details = validate_customer_details(
        customer_details.get('name'),
        customer_details.get('phone'),
        customer_details.get('consultation_date'),
        customer_details.get('identity_reference')
    )

    cursor = conn.cursor()
    cursor.execute("BEGIN IMMEDIATE;")

    try:
        # Recheck slot availability and active state from latest DB state
        cursor.execute("SELECT * FROM consultation_slots WHERE id = ?", (slot_id,))
        slot = cursor.fetchone()

        if not slot:
            raise BusinessRuleError("Selected consultation slot does not exist.", 404)

        if not slot['is_active']:
            raise BusinessRuleError("Selected consultation slot is currently inactive.", 400)

        if slot['available_capacity'] < valid_qty:
            raise BusinessRuleError(
                f"Insufficient availability. Requested {valid_qty}, but only {slot['available_capacity']} slots remaining.",
                400
            )

        # Calculate amounts
        current_rate = slot['rate']
        pricing = calculate_pricing(current_rate, valid_qty)

        # Generate unique booking code
        booking_code = f"BK-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        # Insert booking
        cursor.execute('''
            INSERT INTO bookings (
                booking_code, user_id, slot_id, saved_slot_name, saved_schedule, saved_category,
                customer_name, phone, consultation_date, identity_reference, quantity,
                saved_rate, base_amount, booking_charge, grand_total, status, is_capacity_restored,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', 0, ?, ?)
        ''', (
            booking_code, user_id, slot['id'], slot['name'], slot['schedule'], slot['category'],
            details['name'], details['phone'], details['consultation_date'], details['identity_reference'],
            valid_qty, current_rate, pricing['base_amount'], pricing['booking_charge'], pricing['grand_total'],
            now_str, now_str
        ))

        booking_id = cursor.lastrowid

        # Reduce available capacity
        cursor.execute('''
            UPDATE consultation_slots
            SET available_capacity = available_capacity - ?
            WHERE id = ?
        ''', (valid_qty, slot['id']))

        # Record status history
        cursor.execute('''
            INSERT INTO status_history (booking_id, old_status, new_status, changed_by, timestamp, note)
            VALUES (?, NULL, 'CONFIRMED', ?, ?, ?)
        ''', (booking_id, username, now_str, 'Booking created successfully'))

        conn.commit()

        # Fetch inserted booking
        cursor.execute("SELECT * FROM bookings WHERE id = ?", (booking_id,))
        return dict(cursor.fetchone())

    except Exception as e:
        conn.rollback()
        if isinstance(e, BusinessRuleError):
            raise e
        raise BusinessRuleError(f"Booking confirmation failed: {str(e)}", 500)

def cancel_booking_transaction(conn, booking_id, user):
    """
    BR9 - Cancellation
    User can cancel only their own booking while status is CONFIRMED.
    Restores capacity exactly once. Atomic transaction.
    """
    cursor = conn.cursor()
    cursor.execute("BEGIN IMMEDIATE;")

    try:
        cursor.execute("SELECT * FROM bookings WHERE id = ?", (booking_id,))
        booking = cursor.fetchone()

        if not booking:
            raise BusinessRuleError("Booking not found.", 404)

        # Access control: user must own booking or be admin
        if user['role'] != 'admin' and booking['user_id'] != user['id']:
            raise BusinessRuleError("Unauthorized: You can only cancel your own bookings.", 403)

        if booking['status'] != 'CONFIRMED':
            raise BusinessRuleError(f"Cannot cancel booking with status '{booking['status']}'. Only 'CONFIRMED' bookings can be cancelled.", 400)

        now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        # Atomic status update and capacity restoration
        cursor.execute('''
            UPDATE bookings
            SET status = 'CANCELLED', updated_at = ?
            WHERE id = ?
        ''', (now_str, booking_id))

        if not booking['is_capacity_restored']:
            cursor.execute('''
                UPDATE consultation_slots
                SET available_capacity = available_capacity + ?
                WHERE id = ?
            ''', (booking['quantity'], booking['slot_id']))

            cursor.execute('''
                UPDATE bookings
                SET is_capacity_restored = 1
                WHERE id = ?
            ''', (booking_id,))

        cursor.execute('''
            INSERT INTO status_history (booking_id, old_status, new_status, changed_by, timestamp, note)
            VALUES (?, 'CONFIRMED', 'CANCELLED', ?, ?, ?)
        ''', (booking_id, user['username'], now_str, 'Booking cancelled by user'))

        conn.commit()

        cursor.execute("SELECT * FROM bookings WHERE id = ?", (booking_id,))
        return dict(cursor.fetchone())

    except Exception as e:
        conn.rollback()
        if isinstance(e, BusinessRuleError):
            raise e
        raise BusinessRuleError(f"Cancellation failed: {str(e)}", 500)

def update_booking_status_transaction(conn, booking_id, new_status, admin_user):
    """
    BR8 - Status Transitions
    Allowed:
    CONFIRMED -> CHECKED_IN
    CONFIRMED -> BOARDED
    CHECKED_IN -> COMPLETED
    BOARDED -> COMPLETED
    Only admin can perform this. No stage skipped. Completed or cancelled cannot be advanced.
    """
    if admin_user['role'] != 'admin':
        raise BusinessRuleError("Unauthorized: Only administrators can update booking operational status.", 403)

    cursor = conn.cursor()
    cursor.execute("BEGIN IMMEDIATE;")

    try:
        cursor.execute("SELECT * FROM bookings WHERE id = ?", (booking_id,))
        booking = cursor.fetchone()

        if not booking:
            raise BusinessRuleError("Booking not found.", 404)

        current_status = booking['status']
        allowed_transitions = {
            'CONFIRMED': ['CHECKED_IN', 'BOARDED'],
            'CHECKED_IN': ['COMPLETED'],
            'BOARDED': ['COMPLETED'],
            'COMPLETED': [],
            'CANCELLED': []
        }

        valid_next = allowed_transitions.get(current_status, [])

        if new_status not in valid_next:
            raise BusinessRuleError(
                f"Invalid status transition from '{current_status}' to '{new_status}'. Allowed transitions: {valid_next or 'None'}.",
                400
            )

        now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        cursor.execute('''
            UPDATE bookings
            SET status = ?, updated_at = ?
            WHERE id = ?
        ''', (new_status, now_str, booking_id))

        cursor.execute('''
            INSERT INTO status_history (booking_id, old_status, new_status, changed_by, timestamp, note)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (booking_id, current_status, new_status, admin_user['username'], now_str, f"Status updated to {new_status} by admin"))

        conn.commit()

        cursor.execute("SELECT * FROM bookings WHERE id = ?", (booking_id,))
        return dict(cursor.fetchone())

    except Exception as e:
        conn.rollback()
        if isinstance(e, BusinessRuleError):
            raise e
        raise BusinessRuleError(f"Status update failed: {str(e)}", 500)
