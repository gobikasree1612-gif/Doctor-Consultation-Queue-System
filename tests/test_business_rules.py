import pytest
from app.db import get_db_connection

def get_slot_by_code(client, app, slot_code):
    conn = get_db_connection(app.custom_db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM consultation_slots WHERE slot_code = ?", (slot_code,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

# Helper headers
USER1_HDRS = {'X-User-Id': '1'}
USER2_HDRS = {'X-User-Id': '2'}
ADMIN_HDRS = {'X-User-Id': '3'}

VALID_PAYLOAD = {
    'slot_id': 1, # R101
    'quantity': 2,
    'customer_name': 'John Doe',
    'phone': '9876543210',
    'consultation_date': '2026-10-15',
    'identity_reference': 'AADHAAR-1234'
}

# 1. Valid booking succeeds
def test_01_valid_booking_succeeds(client, app):
    resp = client.post('/api/bookings', json=VALID_PAYLOAD, headers=USER1_HDRS)
    assert resp.status_code == 201
    data = resp.get_json()
    assert 'booking' in data
    assert data['booking']['status'] == 'CONFIRMED'
    assert data['booking']['quantity'] == 2

# 2. Quantity 0 is rejected
def test_02_quantity_zero_rejected(client, app):
    payload = {**VALID_PAYLOAD, 'quantity': 0}
    resp = client.post('/api/bookings', json=payload, headers=USER1_HDRS)
    assert resp.status_code == 400
    assert "between 1 and 5" in resp.get_json()['error']

# 3. Quantity 6 is rejected
def test_03_quantity_six_rejected(client, app):
    payload = {**VALID_PAYLOAD, 'quantity': 6}
    resp = client.post('/api/bookings', json=payload, headers=USER1_HDRS)
    assert resp.status_code == 400
    assert "between 1 and 5" in resp.get_json()['error']

# 4. Decimal quantity is rejected
def test_04_decimal_quantity_rejected(client, app):
    payload = {**VALID_PAYLOAD, 'quantity': 2.5}
    resp = client.post('/api/bookings', json=payload, headers=USER1_HDRS)
    assert resp.status_code == 400
    assert "whole integer" in resp.get_json()['error']

# 5. Negative quantity is rejected
def test_05_negative_quantity_rejected(client, app):
    payload = {**VALID_PAYLOAD, 'quantity': -3}
    resp = client.post('/api/bookings', json=payload, headers=USER1_HDRS)
    assert resp.status_code == 400
    assert "between 1 and 5" in resp.get_json()['error']

# 6. Inactive slot is rejected
def test_06_inactive_slot_rejected(client, app):
    # Set slot 1 inactive
    conn = get_db_connection(app.custom_db_path)
    conn.execute("UPDATE consultation_slots SET is_active = 0 WHERE id = 1")
    conn.commit()
    conn.close()

    resp = client.post('/api/bookings', json=VALID_PAYLOAD, headers=USER1_HDRS)
    assert resp.status_code == 400
    assert "inactive" in resp.get_json()['error']

# 7. R104 with zero availability is rejected
def test_07_r104_zero_availability_rejected(client, app):
    r104 = get_slot_by_code(client, app, 'R104')
    payload = {**VALID_PAYLOAD, 'slot_id': r104['id'], 'quantity': 1}
    resp = client.post('/api/bookings', json=payload, headers=USER1_HDRS)
    assert resp.status_code == 400
    assert "Insufficient availability" in resp.get_json()['error']

# 8. Insufficient capacity is rejected
def test_08_insufficient_capacity_rejected(client, app):
    # R105 has initial capacity 3
    r105 = get_slot_by_code(client, app, 'R105')
    payload = {**VALID_PAYLOAD, 'slot_id': r105['id'], 'quantity': 5}
    resp = client.post('/api/bookings', json=payload, headers=USER1_HDRS)
    assert resp.status_code == 400
    assert "Insufficient availability" in resp.get_json()['error']

# 9. Blank name is rejected
def test_09_blank_name_rejected(client, app):
    payload = {**VALID_PAYLOAD, 'customer_name': '   '}
    resp = client.post('/api/bookings', json=payload, headers=USER1_HDRS)
    assert resp.status_code == 400
    assert "Full name is required" in resp.get_json()['error']

# 10. Invalid phone number is rejected
def test_10_invalid_phone_rejected(client, app):
    payload = {**VALID_PAYLOAD, 'phone': '12345'} # Not 10 digits
    resp = client.post('/api/bookings', json=payload, headers=USER1_HDRS)
    assert resp.status_code == 400
    assert "exactly 10 digits" in resp.get_json()['error']

# 11. Missing or invalid date is rejected
def test_11_missing_date_rejected(client, app):
    payload = {**VALID_PAYLOAD, 'consultation_date': ''}
    resp = client.post('/api/bookings', json=payload, headers=USER1_HDRS)
    assert resp.status_code == 400
    assert "date is required" in resp.get_json()['error']

# 12. Missing identity/reference is rejected
def test_12_missing_identity_reference_rejected(client, app):
    payload = {**VALID_PAYLOAD, 'identity_reference': ''}
    resp = client.post('/api/bookings', json=payload, headers=USER1_HDRS)
    assert resp.status_code == 400
    assert "Identity / Reference ID is required" in resp.get_json()['error']

# 13. Failed booking leaves availability and booking count unchanged
def test_13_failed_booking_no_partial_changes(client, app):
    r101_before = get_slot_by_code(client, app, 'R101')
    
    # Try invalid phone
    payload = {**VALID_PAYLOAD, 'phone': 'invalid'}
    resp = client.post('/api/bookings', json=payload, headers=USER1_HDRS)
    assert resp.status_code == 400

    r101_after = get_slot_by_code(client, app, 'R101')
    assert r101_before['available_capacity'] == r101_after['available_capacity']

    conn = get_db_connection(app.custom_db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as cnt FROM bookings")
    cnt = cursor.fetchone()['cnt']
    conn.close()
    assert cnt == 0

# 14. Successful booking reduces availability by exactly the quantity
def test_14_successful_booking_reduces_capacity(client, app):
    r101_before = get_slot_by_code(client, app, 'R101') # Initial 10
    resp = client.post('/api/bookings', json=VALID_PAYLOAD, headers=USER1_HDRS) # quantity 2
    assert resp.status_code == 201
    
    r101_after = get_slot_by_code(client, app, 'R101')
    assert r101_after['available_capacity'] == r101_before['available_capacity'] - 2

# 15. Booking history is recorded after success
def test_15_booking_history_recorded(client, app):
    resp = client.post('/api/bookings', json=VALID_PAYLOAD, headers=USER1_HDRS)
    b_id = resp.get_json()['booking']['id']

    h_resp = client.get(f'/api/admin/bookings/{b_id}/history', headers=ADMIN_HDRS)
    assert h_resp.status_code == 200
    history = h_resp.get_json()['history']
    assert len(history) == 1
    assert history[0]['new_status'] == 'CONFIRMED'

# 16. Booking ID is unique
def test_16_booking_id_is_unique(client, app):
    resp1 = client.post('/api/bookings', json=VALID_PAYLOAD, headers=USER1_HDRS)
    resp2 = client.post('/api/bookings', json=VALID_PAYLOAD, headers=USER1_HDRS)
    code1 = resp1.get_json()['booking']['booking_code']
    code2 = resp2.get_json()['booking']['booking_code']
    assert code1 != code2

# 17. Rate snapshot remains unchanged after a slot rate change
def test_17_rate_snapshot_remains_unchanged(client, app):
    # Book R101 at rate ₹499 (quantity 2) -> base 998, charge 50, grand 1048
    resp = client.post('/api/bookings', json=VALID_PAYLOAD, headers=USER1_HDRS)
    b_id = resp.get_json()['booking']['id']

    # Update slot rate to ₹600 via admin route
    client.patch('/api/admin/slots/1/rate', json={'rate': 600}, headers=ADMIN_HDRS)

    # Check booking detail - saved_rate and grand_total must remain original
    b_resp = client.get(f'/api/bookings/{b_id}', headers=USER1_HDRS)
    booking = b_resp.get_json()['booking']
    assert booking['saved_rate'] == 499
    assert booking['grand_total'] == 1048

# 18. Grand total is correct when the base amount is below ₹1,000
def test_18_grand_total_below_1000(client, app):
    # R101 rate 499 * 2 = 998 (< 1000). Charge = 50. Total = 1048
    resp = client.post('/api/bookings', json=VALID_PAYLOAD, headers=USER1_HDRS)
    booking = resp.get_json()['booking']
    assert booking['base_amount'] == 998
    assert booking['booking_charge'] == 50
    assert booking['grand_total'] == 1048

# 19. Booking charge is zero when the base amount is exactly ₹1,000
def test_19_booking_charge_zero_at_1000(client, app):
    # R105 has rate 1000. Quantity 1 -> base 1000. Charge = 0. Total = 1000
    r105 = get_slot_by_code(client, app, 'R105')
    payload = {**VALID_PAYLOAD, 'slot_id': r105['id'], 'quantity': 1}
    resp = client.post('/api/bookings', json=payload, headers=USER1_HDRS)
    booking = resp.get_json()['booking']
    assert booking['base_amount'] == 1000
    assert booking['booking_charge'] == 0
    assert booking['grand_total'] == 1000

# 20. User 1 cannot view User 2's booking
def test_20_user1_cannot_view_user2_booking(client, app):
    resp = client.post('/api/bookings', json=VALID_PAYLOAD, headers=USER2_HDRS) # Created by User 2
    b_id = resp.get_json()['booking']['id']

    # User 1 attempts to access User 2's booking
    view_resp = client.get(f'/api/bookings/{b_id}', headers=USER1_HDRS)
    assert view_resp.status_code == 403
    assert "Forbidden" in view_resp.get_json()['error']

# 21. User 1 cannot cancel User 2's booking
def test_21_user1_cannot_cancel_user2_booking(client, app):
    resp = client.post('/api/bookings', json=VALID_PAYLOAD, headers=USER2_HDRS) # Created by User 2
    b_id = resp.get_json()['booking']['id']

    # User 1 attempts to cancel User 2's booking
    cancel_resp = client.post(f'/api/bookings/{b_id}/cancel', headers=USER1_HDRS)
    assert cancel_resp.status_code == 403
    assert "Unauthorized" in cancel_resp.get_json()['error']

# 22. A user cannot advance operational status
def test_22_user_cannot_advance_status(client, app):
    resp = client.post('/api/bookings', json=VALID_PAYLOAD, headers=USER1_HDRS)
    b_id = resp.get_json()['booking']['id']

    patch_resp = client.patch(f'/api/admin/bookings/{b_id}/status', json={'new_status': 'CHECKED_IN'}, headers=USER1_HDRS)
    assert patch_resp.status_code == 403

# 23. Administrator can advance CONFIRMED to CHECKED_IN
def test_23_admin_advance_confirmed_to_checked_in(client, app):
    resp = client.post('/api/bookings', json=VALID_PAYLOAD, headers=USER1_HDRS)
    b_id = resp.get_json()['booking']['id']

    patch_resp = client.patch(f'/api/admin/bookings/{b_id}/status', json={'new_status': 'CHECKED_IN'}, headers=ADMIN_HDRS)
    assert patch_resp.status_code == 200
    assert patch_resp.get_json()['booking']['status'] == 'CHECKED_IN'

# 24. Administrator can advance CONFIRMED to BOARDED
def test_24_admin_advance_confirmed_to_boarded(client, app):
    resp = client.post('/api/bookings', json=VALID_PAYLOAD, headers=USER1_HDRS)
    b_id = resp.get_json()['booking']['id']

    patch_resp = client.patch(f'/api/admin/bookings/{b_id}/status', json={'new_status': 'BOARDED'}, headers=ADMIN_HDRS)
    assert patch_resp.status_code == 200
    assert patch_resp.get_json()['booking']['status'] == 'BOARDED'

# 25. Skipping a status stage is rejected
def test_25_skipping_status_stage_rejected(client, app):
    resp = client.post('/api/bookings', json=VALID_PAYLOAD, headers=USER1_HDRS) # Status is CONFIRMED
    b_id = resp.get_json()['booking']['id']

    # Try skipping CHECKED_IN / BOARDED and jumping straight to COMPLETED
    patch_resp = client.patch(f'/api/admin/bookings/{b_id}/status', json={'new_status': 'COMPLETED'}, headers=ADMIN_HDRS)
    assert patch_resp.status_code == 400
    assert "Invalid status transition" in patch_resp.get_json()['error']

# 26. Cancellation restores capacity exactly once
def test_26_cancellation_restores_capacity_once(client, app):
    r101_initial = get_slot_by_code(client, app, 'R101') # 10
    resp = client.post('/api/bookings', json=VALID_PAYLOAD, headers=USER1_HDRS) # Qty 2 -> avail 8
    b_id = resp.get_json()['booking']['id']

    cancel_resp = client.post(f'/api/bookings/{b_id}/cancel', headers=USER1_HDRS)
    assert cancel_resp.status_code == 200
    assert cancel_resp.get_json()['booking']['status'] == 'CANCELLED'

    r101_restored = get_slot_by_code(client, app, 'R101')
    assert r101_restored['available_capacity'] == r101_initial['available_capacity'] # 10 again

# 27. Repeated cancellation does not restore capacity again
def test_27_repeated_cancellation_rejected(client, app):
    resp = client.post('/api/bookings', json=VALID_PAYLOAD, headers=USER1_HDRS)
    b_id = resp.get_json()['booking']['id']

    # First cancel
    client.post(f'/api/bookings/{b_id}/cancel', headers=USER1_HDRS)
    r101_restored = get_slot_by_code(client, app, 'R101')

    # Second cancel attempt
    cancel_resp2 = client.post(f'/api/bookings/{b_id}/cancel', headers=USER1_HDRS)
    assert cancel_resp2.status_code == 400
    assert "Only 'CONFIRMED' bookings can be cancelled" in cancel_resp2.get_json()['error']

    r101_after2 = get_slot_by_code(client, app, 'R101')
    assert r101_after2['available_capacity'] == r101_restored['available_capacity']

# 28. Completed and cancelled bookings cannot be advanced
def test_28_completed_and_cancelled_cannot_be_advanced(client, app):
    # Case 1: Cancelled
    resp = client.post('/api/bookings', json=VALID_PAYLOAD, headers=USER1_HDRS)
    b_id = resp.get_json()['booking']['id']
    client.post(f'/api/bookings/{b_id}/cancel', headers=USER1_HDRS)

    patch_resp = client.patch(f'/api/admin/bookings/{b_id}/status', json={'new_status': 'CHECKED_IN'}, headers=ADMIN_HDRS)
    assert patch_resp.status_code == 400

    # Case 2: Completed
    resp2 = client.post('/api/bookings', json=VALID_PAYLOAD, headers=USER1_HDRS)
    b2_id = resp2.get_json()['booking']['id']
    client.patch(f'/api/admin/bookings/{b2_id}/status', json={'new_status': 'CHECKED_IN'}, headers=ADMIN_HDRS)
    client.patch(f'/api/admin/bookings/{b2_id}/status', json={'new_status': 'COMPLETED'}, headers=ADMIN_HDRS)

    patch_resp2 = client.patch(f'/api/admin/bookings/{b2_id}/status', json={'new_status': 'CHECKED_IN'}, headers=ADMIN_HDRS)
    assert patch_resp2.status_code == 400

# 29. Repeated submission does not create duplicate bookings
def test_29_concurrency_and_atomicity_checks(client, app):
    # Book last available capacity of R105 (capacity 3)
    r105 = get_slot_by_code(client, app, 'R105') # initial capacity 3
    payload = {**VALID_PAYLOAD, 'slot_id': r105['id'], 'quantity': 3}
    
    resp1 = client.post('/api/bookings', json=payload, headers=USER1_HDRS)
    assert resp1.status_code == 201

    # Immediate second attempt with quantity 1 must be rejected due to 0 remaining availability
    payload2 = {**VALID_PAYLOAD, 'slot_id': r105['id'], 'quantity': 1}
    resp2 = client.post('/api/bookings', json=payload2, headers=USER1_HDRS)
    assert resp2.status_code == 400
    assert "Insufficient availability" in resp2.get_json()['error']

# 30. Failed transactions leave no partial updates
def test_30_failed_transactions_leave_no_partial_updates(client, app):
    conn = get_db_connection(app.custom_db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as b_cnt FROM bookings")
    b_before = cursor.fetchone()['b_cnt']
    cursor.execute("SELECT COUNT(*) as h_cnt FROM status_history")
    h_before = cursor.fetchone()['h_cnt']
    conn.close()

    # Trigger booking failure with blank identity_reference
    invalid_payload = {**VALID_PAYLOAD, 'identity_reference': ''}
    resp = client.post('/api/bookings', json=invalid_payload, headers=USER1_HDRS)
    assert resp.status_code == 400

    conn = get_db_connection(app.custom_db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as b_cnt FROM bookings")
    b_after = cursor.fetchone()['b_cnt']
    cursor.execute("SELECT COUNT(*) as h_cnt FROM status_history")
    h_after = cursor.fetchone()['h_cnt']
    conn.close()

    assert b_before == b_after
    assert h_before == h_after
