import pytest
from app.db import get_db_connection

USER1_HDRS = {'X-User-Id': '1'}
USER2_HDRS = {'X-User-Id': '2'}
ADMIN_HDRS = {'X-User-Id': '3'}

VALID_PAYLOAD = {
    'slot_id': 1, # R101 (Rate ₹499, initial capacity 10)
    'quantity': 2,
    'customer_name': 'Dr. Rajesh Kumar',
    'phone': '9876543210',
    'consultation_date': '2026-10-20',
    'identity_reference': 'AADHAAR-9988'
}

def get_slot_by_id(app, slot_id):
    conn = get_db_connection(app.custom_db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM consultation_slots WHERE id = ?", (slot_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

# T1 — Same Resource Selected Twice
def test_t1_same_resource_selected_twice(client, app):
    # First valid booking for R101 (quantity 2) -> availability drops from 10 to 8
    resp1 = client.post('/api/bookings', json=VALID_PAYLOAD, headers=USER1_HDRS)
    assert resp1.status_code == 201
    
    # Second valid booking for same resource R101 (quantity 1) -> availability drops from 8 to 7
    payload2 = {**VALID_PAYLOAD, 'quantity': 1}
    resp2 = client.post('/api/bookings', json=payload2, headers=USER1_HDRS)
    assert resp2.status_code == 201

    slot = get_slot_by_id(app, 1)
    assert slot['available_capacity'] == 7

# T2 — Quantity Boundaries (0, 1, 5, 6, 1.5)
def test_t2_quantity_boundaries(client, app):
    # Qty 1 (Accepted)
    p1 = {**VALID_PAYLOAD, 'quantity': 1}
    assert client.post('/api/bookings', json=p1, headers=USER1_HDRS).status_code == 201

    # Qty 5 (Accepted) - slot R103 has capacity 20
    p5 = {**VALID_PAYLOAD, 'slot_id': 3, 'quantity': 5}
    assert client.post('/api/bookings', json=p5, headers=USER1_HDRS).status_code == 201

    # Qty 0 (Rejected)
    p0 = {**VALID_PAYLOAD, 'quantity': 0}
    r0 = client.post('/api/bookings', json=p0, headers=USER1_HDRS)
    assert r0.status_code == 400

    # Qty 6 (Rejected)
    p6 = {**VALID_PAYLOAD, 'quantity': 6}
    r6 = client.post('/api/bookings', json=p6, headers=USER1_HDRS)
    assert r6.status_code == 400

    # Qty 1.5 (Rejected)
    p1_5 = {**VALID_PAYLOAD, 'quantity': 1.5}
    r1_5 = client.post('/api/bookings', json=p1_5, headers=USER1_HDRS)
    assert r1_5.status_code == 400

# T3 — Unavailable Resource (R104 with 0 availability)
def test_t3_unavailable_resource_rejected(client, app):
    # R104 has slot_id 4, available_capacity 0
    p_r104 = {**VALID_PAYLOAD, 'slot_id': 4, 'quantity': 1}
    resp = client.post('/api/bookings', json=p_r104, headers=USER1_HDRS)
    assert resp.status_code == 400
    assert "Insufficient availability" in resp.get_json()['error']

# T4 — Amount Boundaries (Base ₹999, ₹1,000, ₹1,001)
def test_t4_amount_boundaries(client, app):
    conn = get_db_connection(app.custom_db_path)
    
    # Setup test slots with rates 999, 1000, 1001
    conn.execute("INSERT INTO consultation_slots (slot_code, name, schedule, category, rate, initial_capacity, available_capacity, is_active) VALUES ('T999', 'Slot 999', 'Daily', 'Test', 999, 5, 5, 1)")
    s999_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    
    conn.execute("INSERT INTO consultation_slots (slot_code, name, schedule, category, rate, initial_capacity, available_capacity, is_active) VALUES ('T1000', 'Slot 1000', 'Daily', 'Test', 1000, 5, 5, 1)")
    s1000_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]

    conn.execute("INSERT INTO consultation_slots (slot_code, name, schedule, category, rate, initial_capacity, available_capacity, is_active) VALUES ('T1001', 'Slot 1001', 'Daily', 'Test', 1001, 5, 5, 1)")
    s1001_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    conn.commit()
    conn.close()

    # Case A: Base ₹999 -> Charge ₹50 -> Grand Total ₹1,049
    b999 = client.post('/api/bookings', json={**VALID_PAYLOAD, 'slot_id': s999_id, 'quantity': 1}, headers=USER1_HDRS).get_json()['booking']
    assert b999['base_amount'] == 999
    assert b999['booking_charge'] == 50
    assert b999['grand_total'] == 1049

    # Case B: Base ₹1,000 -> Charge ₹0 -> Grand Total ₹1,000
    b1000 = client.post('/api/bookings', json={**VALID_PAYLOAD, 'slot_id': s1000_id, 'quantity': 1}, headers=USER1_HDRS).get_json()['booking']
    assert b1000['base_amount'] == 1000
    assert b1000['booking_charge'] == 0
    assert b1000['grand_total'] == 1000

    # Case C: Base ₹1,001 -> Charge ₹0 -> Grand Total ₹1,001
    b1001 = client.post('/api/bookings', json={**VALID_PAYLOAD, 'slot_id': s1001_id, 'quantity': 1}, headers=USER1_HDRS).get_json()['booking']
    assert b1001['base_amount'] == 1001
    assert b1001['booking_charge'] == 0
    assert b1001['grand_total'] == 1001

# T5 — Valid Reservation
def test_t5_valid_reservation(client, app):
    resp = client.post('/api/bookings', json=VALID_PAYLOAD, headers=USER1_HDRS)
    assert resp.status_code == 201
    booking = resp.get_json()['booking']
    
    assert booking['booking_code'].startswith('BK-')
    assert booking['status'] == 'CONFIRMED'
    assert booking['saved_rate'] == 499
    assert booking['base_amount'] == 998
    assert booking['booking_charge'] == 50
    assert booking['grand_total'] == 1048

# T6 — Invalid/Missing Details
def test_t6_invalid_missing_details(client, app):
    # Blank name
    assert client.post('/api/bookings', json={**VALID_PAYLOAD, 'customer_name': '  '}, headers=USER1_HDRS).status_code == 400

    # Invalid phone (5 digits)
    assert client.post('/api/bookings', json={**VALID_PAYLOAD, 'phone': '12345'}, headers=USER1_HDRS).status_code == 400

    # Missing date
    assert client.post('/api/bookings', json={**VALID_PAYLOAD, 'consultation_date': ''}, headers=USER1_HDRS).status_code == 400

    # Missing identity reference
    assert client.post('/api/bookings', json={**VALID_PAYLOAD, 'identity_reference': ''}, headers=USER1_HDRS).status_code == 400

# T7 — Availability Changes Before Confirmation
def test_t7_availability_changes_before_confirmation(client, app):
    # Slot R105 has capacity 3
    # User 1 books quantity 3 consuming full capacity
    p_full = {**VALID_PAYLOAD, 'slot_id': 5, 'quantity': 3}
    resp1 = client.post('/api/bookings', json=p_full, headers=USER1_HDRS)
    assert resp1.status_code == 201

    # User 2 attempts to confirm booking for quantity 1
    p_user2 = {**VALID_PAYLOAD, 'slot_id': 5, 'quantity': 1}
    resp2 = client.post('/api/bookings', json=p_user2, headers=USER2_HDRS)
    assert resp2.status_code == 400
    assert "Insufficient availability" in resp2.get_json()['error']

# T8 — Unauthorized Access
def test_t8_unauthorized_access(client, app):
    # User 2 creates booking
    resp = client.post('/api/bookings', json=VALID_PAYLOAD, headers=USER2_HDRS)
    b_id = resp.get_json()['booking']['id']

    # User 1 tries to view User 2's booking -> 403
    assert client.get(f'/api/bookings/{b_id}', headers=USER1_HDRS).status_code == 403

    # User 1 tries to cancel User 2's booking -> 403
    assert client.post(f'/api/bookings/{b_id}/cancel', headers=USER1_HDRS).status_code == 403

    # User 1 tries to advance status -> 403
    assert client.patch(f'/api/admin/bookings/{b_id}/status', json={'new_status': 'CHECKED_IN'}, headers=USER1_HDRS).status_code == 403

# T9 — Status Transitions
def test_t9_status_transitions(client, app):
    # Path A: CONFIRMED -> CHECKED_IN -> COMPLETED
    b1 = client.post('/api/bookings', json=VALID_PAYLOAD, headers=USER1_HDRS).get_json()['booking']
    id1 = b1['id']

    assert client.patch(f'/api/admin/bookings/{id1}/status', json={'new_status': 'CHECKED_IN'}, headers=ADMIN_HDRS).status_code == 200
    assert client.patch(f'/api/admin/bookings/{id1}/status', json={'new_status': 'COMPLETED'}, headers=ADMIN_HDRS).status_code == 200

    # Path B: CONFIRMED -> BOARDED -> COMPLETED
    b2 = client.post('/api/bookings', json=VALID_PAYLOAD, headers=USER1_HDRS).get_json()['booking']
    id2 = b2['id']

    assert client.patch(f'/api/admin/bookings/{id2}/status', json={'new_status': 'BOARDED'}, headers=ADMIN_HDRS).status_code == 200
    assert client.patch(f'/api/admin/bookings/{id2}/status', json={'new_status': 'COMPLETED'}, headers=ADMIN_HDRS).status_code == 200

    # Invalid: CONFIRMED -> COMPLETED (Stage skip)
    b3 = client.post('/api/bookings', json=VALID_PAYLOAD, headers=USER1_HDRS).get_json()['booking']
    id3 = b3['id']

    assert client.patch(f'/api/admin/bookings/{id3}/status', json={'new_status': 'COMPLETED'}, headers=ADMIN_HDRS).status_code == 400

# T10 — Cancellation and Repeated Cancellation
def test_t10_cancellation_and_repeated_cancellation(client, app):
    slot_before = get_slot_by_id(app, 1) # capacity 10
    
    # Book 2 slots -> capacity becomes 8
    b = client.post('/api/bookings', json=VALID_PAYLOAD, headers=USER1_HDRS).get_json()['booking']
    b_id = b['id']
    
    # First cancellation -> capacity restored to 10
    cancel1 = client.post(f'/api/bookings/{b_id}/cancel', headers=USER1_HDRS)
    assert cancel1.status_code == 200
    assert cancel1.get_json()['booking']['status'] == 'CANCELLED'

    slot_after = get_slot_by_id(app, 1)
    assert slot_after['available_capacity'] == slot_before['available_capacity']

    # Second cancellation attempt -> Rejected (400), capacity remains 10
    cancel2 = client.post(f'/api/bookings/{b_id}/cancel', headers=USER1_HDRS)
    assert cancel2.status_code == 400

    slot_after2 = get_slot_by_id(app, 1)
    assert slot_after2['available_capacity'] == slot_before['available_capacity']

# T11 — Persistence After Restart
def test_t11_persistence_after_restart(client, app):
    # Book R101 (qty 2)
    b = client.post('/api/bookings', json=VALID_PAYLOAD, headers=USER1_HDRS).get_json()['booking']
    code = b['booking_code']

    # Simulate database reconnection / app restart by fetching directly from SQLite file
    conn = get_db_connection(app.custom_db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM bookings WHERE booking_code = ?", (code,))
    persisted_b = cursor.fetchone()
    
    cursor.execute("SELECT available_capacity FROM consultation_slots WHERE id = 1")
    avail = cursor.fetchone()['available_capacity']
    conn.close()

    assert persisted_b is not None
    assert persisted_b['booking_code'] == code
    assert avail == 8

# T12 — Rate Snapshot
def test_t12_rate_snapshot_isolation(client, app):
    # Book R101 at rate ₹499 (quantity 2) -> base 998, charge 50, grand 1048
    b = client.post('/api/bookings', json=VALID_PAYLOAD, headers=USER1_HDRS).get_json()['booking']
    b_id = b['id']

    # Admin changes slot 1 rate to ₹750
    client.patch('/api/admin/slots/1/rate', json={'rate': 750}, headers=ADMIN_HDRS)

    # Past booking retains original saved rate ₹499 and grand total ₹1048
    past_booking = client.get(f'/api/bookings/{b_id}', headers=USER1_HDRS).get_json()['booking']
    assert past_booking['saved_rate'] == 499
    assert past_booking['grand_total'] == 1048

    # New booking receives updated rate ₹750
    new_booking = client.post('/api/bookings', json={**VALID_PAYLOAD, 'quantity': 1}, headers=USER1_HDRS).get_json()['booking']
    assert new_booking['saved_rate'] == 750
