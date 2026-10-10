from flask import Blueprint, request, jsonify, session, g
from werkzeug.security import check_password_hash
from app.db import get_db_connection
from app.auth import login_required, admin_required, get_current_user
from app.business_logic import (
    BusinessRuleError,
    create_booking_transaction,
    cancel_booking_transaction,
    update_booking_status_transaction,
    calculate_pricing,
    validate_quantity
)

api_bp = Blueprint('api', __name__)

# --- Authentication Endpoints ---

@api_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    if not username or not password:
        return jsonify({'error': 'Username and password are required.'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    conn.close()

    if not user or not check_password_hash(user['password_hash'], password):
        return jsonify({'error': 'Invalid username or password.'}), 401

    session['user_id'] = user['id']

    user_dict = {
        'id': user['id'],
        'username': user['username'],
        'name': user['name'],
        'role': user['role']
    }

    return jsonify({
        'message': 'Login successful.',
        'user': user_dict
    }), 200

@api_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out successfully.'}), 200

@api_bp.route('/me', methods=['GET'])
def get_me():
    user = get_current_user()
    if not user:
        return jsonify({'user': None}), 200
    return jsonify({'user': user}), 200

# --- Consultation Slots Endpoints ---

@api_bp.route('/slots', methods=['GET'])
def get_slots():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM consultation_slots ORDER BY slot_code ASC")
    rows = cursor.fetchall()
    conn.close()
    
    slots = [dict(row) for row in rows]
    return jsonify({'slots': slots}), 200

@api_bp.route('/slots/<int:slot_id>', methods=['GET'])
def get_slot(slot_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM consultation_slots WHERE id = ?", (slot_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return jsonify({'error': 'Slot not found.'}), 404

    return jsonify({'slot': dict(row)}), 200

@api_bp.route('/slots/calculate', methods=['POST'])
def preview_calculate():
    """
    Live price preview calculator for BR4 frontend display.
    """
    data = request.get_json() or {}
    slot_id = data.get('slot_id')
    quantity = data.get('quantity')

    try:
        valid_qty = validate_quantity(quantity)
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT rate FROM consultation_slots WHERE id = ?", (slot_id,))
        row = cursor.fetchone()
        conn.close()

        if not row:
            return jsonify({'error': 'Slot not found.'}), 404

        pricing = calculate_pricing(row['rate'], valid_qty)
        return jsonify(pricing), 200
    except BusinessRuleError as bre:
        return jsonify({'error': bre.message}), bre.status_code

# --- Bookings Endpoints ---

@api_bp.route('/bookings', methods=['POST'])
@login_required
def create_booking():
    user = g.user
    data = request.get_json() or {}

    slot_id = data.get('slot_id')
    quantity = data.get('quantity')
    customer_name = data.get('customer_name')
    phone = data.get('phone')
    consultation_date = data.get('consultation_date')
    identity_reference = data.get('identity_reference')

    customer_details = {
        'name': customer_name,
        'phone': phone,
        'consultation_date': consultation_date,
        'identity_reference': identity_reference
    }

    conn = get_db_connection()
    try:
        booking = create_booking_transaction(
            conn,
            user_id=user['id'],
            username=user['username'],
            slot_id=slot_id,
            quantity=quantity,
            customer_details=customer_details
        )
        return jsonify({
            'message': 'Booking confirmed successfully!',
            'booking': booking
        }), 201
    except BusinessRuleError as bre:
        return jsonify({'error': bre.message}), bre.status_code
    finally:
        conn.close()

@api_bp.route('/bookings/my', methods=['GET'])
@login_required
def get_my_bookings():
    user = g.user
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM bookings WHERE user_id = ? ORDER BY id DESC", (user['id'],))
    rows = cursor.fetchall()
    conn.close()

    bookings = [dict(row) for row in rows]
    return jsonify({'bookings': bookings}), 200

@api_bp.route('/bookings/<int:booking_id>', methods=['GET'])
@login_required
def get_booking_detail(booking_id):
    user = g.user
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM bookings WHERE id = ?", (booking_id,))
    booking = cursor.fetchone()

    if not booking:
        conn.close()
        return jsonify({'error': 'Booking not found.'}), 404

    # Authorization check
    if user['role'] != 'admin' and booking['user_id'] != user['id']:
        conn.close()
        return jsonify({'error': 'Forbidden: You do not have access to this booking.'}), 403

    cursor.execute("SELECT * FROM status_history WHERE booking_id = ? ORDER BY id ASC", (booking_id,))
    history_rows = cursor.fetchall()
    conn.close()

    return jsonify({
        'booking': dict(booking),
        'history': [dict(h) for h in history_rows]
    }), 200

@api_bp.route('/bookings/<int:booking_id>/cancel', methods=['POST'])
@login_required
def cancel_booking(booking_id):
    user = g.user
    conn = get_db_connection()
    try:
        updated_booking = cancel_booking_transaction(conn, booking_id, user)
        return jsonify({
            'message': 'Booking cancelled successfully.',
            'booking': updated_booking
        }), 200
    except BusinessRuleError as bre:
        return jsonify({'error': bre.message}), bre.status_code
    finally:
        conn.close()

# --- Administrator Endpoints ---

@api_bp.route('/admin/bookings', methods=['GET'])
@admin_required
def get_admin_bookings():
    search_query = request.args.get('search', '').strip()
    status_filter = request.args.get('status', '').strip()

    conn = get_db_connection()
    cursor = conn.cursor()

    sql = """
        SELECT b.*, u.username as booked_by_username, u.name as booked_by_name
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        WHERE 1=1
    """
    params = []

    if status_filter and status_filter.upper() != 'ALL':
        sql += " AND b.status = ?"
        params.append(status_filter.upper())

    if search_query:
        sql += " AND (b.booking_code LIKE ? OR b.customer_name LIKE ? OR u.username LIKE ?)"
        like_str = f"%{search_query}%"
        params.extend([like_str, like_str, like_str])

    sql += " ORDER BY b.id DESC"

    cursor.execute(sql, params)
    rows = cursor.fetchall()
    conn.close()

    return jsonify({'bookings': [dict(r) for r in rows]}), 200

@api_bp.route('/admin/bookings/<int:booking_id>/status', methods=['PATCH'])
@admin_required
def update_booking_status(booking_id):
    admin_user = g.user
    data = request.get_json() or {}
    new_status = data.get('new_status', '').strip().upper()

    if not new_status:
        return jsonify({'error': 'New status is required.'}), 400

    conn = get_db_connection()
    try:
        updated_booking = update_booking_status_transaction(conn, booking_id, new_status, admin_user)
        return jsonify({
            'message': f'Booking status successfully updated to {new_status}.',
            'booking': updated_booking
        }), 200
    except BusinessRuleError as bre:
        return jsonify({'error': bre.message}), bre.status_code
    finally:
        conn.close()

@api_bp.route('/admin/bookings/<int:booking_id>/history', methods=['GET'])
@admin_required
def get_booking_history(booking_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM status_history WHERE booking_id = ? ORDER BY id ASC", (booking_id,))
    rows = cursor.fetchall()
    conn.close()

    return jsonify({'history': [dict(r) for r in rows]}), 200

@api_bp.route('/admin/slots/<int:slot_id>/rate', methods=['PATCH'])
@admin_required
def update_slot_rate(slot_id):
    """
    Endpoint for testing rate snapshot isolation (BR3).
    """
    data = request.get_json() or {}
    new_rate = data.get('rate')
    if new_rate is None or not isinstance(new_rate, int) or new_rate < 0:
        return jsonify({'error': 'Valid non-negative integer rate is required.'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE consultation_slots SET rate = ? WHERE id = ?", (new_rate, slot_id))
    conn.commit()
    conn.close()

    return jsonify({'message': 'Slot rate updated successfully.'}), 200
