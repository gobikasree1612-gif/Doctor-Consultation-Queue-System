# Mandatory Test Cases Document (T1 – T12)

**System Name**: Doctor Consultation Queue System  
**Institution**: Sri Eshwar College of Engineering  
**Assessment**: Software Engineering SAT II Practical Assessment  
**Date**: October 10, 2026  

---

## Overview

This document specifies the **12 mandatory test cases (T1 through T12)** designed to evaluate the core functional requirements (FR1–FR10) and business rules (BR1–BR10) of the Doctor Consultation Queue System.

---

## Test Cases Matrix

### T1 — Same Resource Selected Twice
- **Test ID**: `T1`
- **Linked Requirements**: FR2, BR2
- **Preconditions**: Slot `R101` (Consultation Slot A) has initial available capacity of 10 slots. User 1 is logged in.
- **Test Inputs**:
  - Selection 1: Slot R101, Quantity = 2.
  - Selection 2: Slot R101, Quantity = 1.
- **Execution Steps**:
  1. Submit booking request for Slot R101 with quantity 2 as User 1.
  2. Verify confirmation and available capacity drops from 10 to 8.
  3. Submit a second valid booking request for Slot R101 with quantity 1 as User 1.
  4. Verify confirmation and available capacity drops from 8 to 7.
- **Expected Result**: Both legitimate bookings succeed sequentially, generating unique booking IDs and correctly decrementing capacity from 10 to 8, then to 7, without duplicate submission errors or corrupt state.
- **Actual Result**: Both bookings succeeded with unique codes (`BK-20261010-XXXX`), capacity decremented to 7.
- **Status**: `PASS`
- **Evidence Reference**: `tests/test_mandatory_t1_t12.py::test_t1_same_resource_selected_twice`

---

### T2 — Quantity Boundaries
- **Test ID**: `T2`
- **Linked Requirements**: FR2, BR1
- **Preconditions**: Active slots are available. User 1 is logged in.
- **Test Inputs**: Quantities `0`, `1`, `5`, `6`, and `1.5`.
- **Execution Steps**:
  1. Submit booking with quantity `1` -> Expect PASS.
  2. Submit booking with quantity `5` -> Expect PASS.
  3. Submit booking with quantity `0` -> Expect REJECT.
  4. Submit booking with quantity `6` -> Expect REJECT.
  5. Submit booking with quantity `1.5` -> Expect REJECT.
- **Expected Result**: Quantities 1 and 5 are accepted (HTTP 201). Quantities 0, 6, and 1.5 are rejected with HTTP 400 error message "Quantity must be between 1 and 5 / whole integer", creating no booking and leaving capacity unchanged.
- **Actual Result**: Quantities 1 and 5 succeeded; 0, 6, and 1.5 returned HTTP 400 validation error with zero partial DB updates.
- **Status**: `PASS`
- **Evidence Reference**: `tests/test_mandatory_t1_t12.py::test_t2_quantity_boundaries`

---

### T3 — Unavailable Resource
- **Test ID**: `T3`
- **Linked Requirements**: FR1, FR2, BR2
- **Preconditions**: Slot `R104` (Consultation Slot D) is seeded with initial available capacity = 0.
- **Test Inputs**: Slot ID = 4 (`R104`), Quantity = 1.
- **Execution Steps**:
  1. Log in as User 1.
  2. Attempt to book Slot R104 with quantity 1.
- **Expected Result**: Request is rejected on both frontend and backend with HTTP 400 error "Insufficient availability. Requested 1, but only 0 slots remaining." No booking is created, and capacity remains 0.
- **Actual Result**: Request rejected with HTTP 400 error. Available capacity remained 0.
- **Status**: `PASS`
- **Evidence Reference**: `tests/test_mandatory_t1_t12.py::test_t3_unavailable_resource_rejected`

---

### T4 — Amount Boundaries
- **Test ID**: `T4`
- **Linked Requirements**: FR3, BR4
- **Preconditions**: Test slots configured with rates ₹999, ₹1,000, and ₹1,001 for quantity = 1.
- **Test Inputs**:
  - Case A: Rate ₹999 × Qty 1 (Base = ₹999).
  - Case B: Rate ₹1,000 × Qty 1 (Base = ₹1,000).
  - Case C: Rate ₹1,001 × Qty 1 (Base = ₹1,001).
- **Execution Steps**:
  1. Calculate pricing for Base Amount ₹999 -> Expect Booking Charge ₹50, Grand Total ₹1,049.
  2. Calculate pricing for Base Amount ₹1,000 -> Expect Booking Charge ₹0, Grand Total ₹1,000.
  3. Calculate pricing for Base Amount ₹1,001 -> Expect Booking Charge ₹0, Grand Total ₹1,001.
- **Expected Result**: Base amount < ₹1,000 incurs ₹50 booking charge; base amount ≥ ₹1,000 incurs ₹0 booking charge.
- **Actual Result**: Base ₹999 yielded ₹50 charge (Total ₹1,049); Base ₹1,000 yielded ₹0 charge (Total ₹1,000); Base ₹1,001 yielded ₹0 charge (Total ₹1,001).
- **Status**: `PASS`
- **Evidence Reference**: `tests/test_mandatory_t1_t12.py::test_t4_amount_boundaries`

---

### T5 — Valid Reservation
- **Test ID**: `T5`
- **Linked Requirements**: FR5, BR7
- **Preconditions**: Slot `R101` (Rate ₹499) has capacity 10. User 1 logged in.
- **Test Inputs**: Slot R101, Quantity = 2, Customer Name = "Dr. Rajesh Kumar", Phone = "9876543210", Date = "2026-10-20", Identity Ref = "AADHAAR-9988".
- **Execution Steps**:
  1. Submit booking request with valid payload.
  2. Verify database commit.
- **Expected Result**: Generates unique booking code (`BK-YYYYMMDD-XXXX`), status `CONFIRMED`, saved rate ₹499, base amount ₹998, booking charge ₹50, grand total ₹1,048, reduces capacity from 10 to 8, and records status history entry atomically.
- **Actual Result**: Booking created with code `BK-20261010-XXXX`, status `CONFIRMED`, grand total ₹1,048, capacity reduced to 8, status history logged.
- **Status**: `PASS`
- **Evidence Reference**: `tests/test_mandatory_t1_t12.py::test_t5_valid_reservation`

---

### T6 — Invalid/Missing Details
- **Test ID**: `T6`
- **Linked Requirements**: FR4, BR5, BR6
- **Preconditions**: Active slot R101 available. User 1 logged in.
- **Test Inputs**:
  - Test A: Customer Name = `"   "` (blank).
  - Test B: Phone = `"12345"` (5 digits instead of 10).
  - Test C: Consultation Date = `""` (missing).
  - Test D: Identity Reference = `""` (missing).
- **Execution Steps**:
  1. Submit booking with blank name -> Expect HTTP 400.
  2. Submit booking with invalid phone -> Expect HTTP 400.
  3. Submit booking with missing date -> Expect HTTP 400.
  4. Submit booking with missing identity ref -> Expect HTTP 400.
- **Expected Result**: All invalid requests are rejected with field-specific HTTP 400 error messages. No booking created, zero capacity deducted, zero history entries written.
- **Actual Result**: All 4 cases returned HTTP 400 with specific validation error messages. Zero DB changes occurred.
- **Status**: `PASS`
- **Evidence Reference**: `tests/test_mandatory_t1_t12.py::test_t6_invalid_missing_details`

---

### T7 — Availability Changes Before Confirmation
- **Test ID**: `T7`
- **Linked Requirements**: FR4, BR2, BR6
- **Preconditions**: Slot `R105` has initial capacity = 3.
- **Test Inputs**:
  - Request 1: User 1 requests Quantity = 3 for R105.
  - Request 2: User 2 requests Quantity = 1 for R105.
- **Execution Steps**:
  1. Submit Request 1 (User 1, Qty 3) -> Consumes remaining capacity (3 to 0).
  2. Submit Request 2 (User 2, Qty 1) for the now-exhausted slot.
- **Expected Result**: Request 1 succeeds. Request 2 is rejected with HTTP 400 "Insufficient availability." Final available capacity remains 0, and no partial booking is created for User 2.
- **Actual Result**: User 1 booking succeeded (avail capacity = 0); User 2 booking returned HTTP 400 error.
- **Status**: `PASS`
- **Evidence Reference**: `tests/test_mandatory_t1_t12.py::test_t7_availability_changes_before_confirmation`

---

### T8 — Unauthorized Access
- **Test ID**: `T8`
- **Linked Requirements**: FR6, BR10
- **Preconditions**: User 2 creates a confirmed booking (Booking ID = B2). User 1 is logged in.
- **Test Inputs**:
  - Action A: User 1 attempts `GET /api/bookings/{B2}`.
  - Action B: User 1 attempts `POST /api/bookings/{B2}/cancel`.
  - Action C: User 1 attempts `PATCH /api/admin/bookings/{B2}/status`.
- **Execution Steps**:
  1. User 1 calls GET details for User 2's booking B2.
  2. User 1 calls cancel on User 2's booking B2.
  3. User 1 calls admin status update on booking B2.
- **Expected Result**: All 3 unauthorized attempts are rejected with HTTP 403 Forbidden. No data is revealed or modified.
- **Actual Result**: Actions A, B, and C returned HTTP 403 Forbidden error responses.
- **Status**: `PASS`
- **Evidence Reference**: `tests/test_mandatory_t1_t12.py::test_t8_unauthorized_access`

---

### T9 — Status Transitions
- **Test ID**: `T9`
- **Linked Requirements**: FR7, BR8
- **Preconditions**: Confirmed bookings exist. Administrator is logged in.
- **Test Inputs**:
  - Path 1: `CONFIRMED -> CHECKED_IN -> COMPLETED`.
  - Path 2: `CONFIRMED -> BOARDED -> COMPLETED`.
  - Path 3 (Invalid): `CONFIRMED -> COMPLETED` (skipping stage).
- **Execution Steps**:
  1. Execute Path 1 for Booking 1 -> Expect HTTP 200.
  2. Execute Path 2 for Booking 2 -> Expect HTTP 200.
  3. Execute Path 3 for Booking 3 -> Expect HTTP 400.
- **Expected Result**: Valid lifecycle paths 1 and 2 succeed and log status history. Invalid path 3 is rejected with HTTP 400 "Invalid status transition".
- **Actual Result**: Paths 1 and 2 succeeded with status updates; Path 3 returned HTTP 400 error.
- **Status**: `PASS`
- **Evidence Reference**: `tests/test_mandatory_t1_t12.py::test_t9_status_transitions`

---

### T10 — Cancellation and Repeated Cancellation
- **Test ID**: `T10`
- **Linked Requirements**: FR8, BR9
- **Preconditions**: Slot R101 initial capacity = 10. User 1 creates a confirmed booking for Quantity = 2 (capacity drops to 8).
- **Test Inputs**: Cancellation request 1, followed by cancellation request 2 on the same booking ID.
- **Execution Steps**:
  1. Submit first cancellation request as User 1.
  2. Verify booking status becomes `CANCELLED` and slot capacity is restored from 8 to 10.
  3. Submit second cancellation request as User 1 on the same booking ID.
- **Expected Result**: First cancellation succeeds, status updated to `CANCELLED`, history logged, capacity restored from 8 back to 10. Second cancellation is rejected with HTTP 400, leaving capacity at 10.
- **Actual Result**: First cancel succeeded and restored capacity to 10; second cancel returned HTTP 400 with capacity unchanged.
- **Status**: `PASS`
- **Evidence Reference**: `tests/test_mandatory_t1_t12.py::test_t10_cancellation_and_repeated_cancellation`

---

### T11 — Persistence After Restart
- **Test ID**: `T11`
- **Linked Requirements**: FR10, NFR2
- **Preconditions**: User 1 creates booking `BK-PERSIST-1` for Slot R101 (Quantity = 2). Available capacity becomes 8.
- **Test Inputs**: Application/Database restart simulation (re-opening SQLite database disk file `doctor_queue.db`).
- **Execution Steps**:
  1. Create booking and verify DB state.
  2. Close database connection and simulate backend server restart.
  3. Query SQLite database disk file directly.
- **Expected Result**: Booking `BK-PERSIST-1`, saved rate ₹499, grand total ₹1,048, updated capacity 8, and status history persist intact.
- **Actual Result**: All booking data, fare snapshots, and updated capacity (8) persisted perfectly in the SQLite disk database.
- **Status**: `PASS`
- **Evidence Reference**: `tests/test_mandatory_t1_t12.py::test_t11_persistence_after_restart`

---

### T12 — Rate Snapshot Isolation
- **Test ID**: `T12`
- **Linked Requirements**: BR3
- **Preconditions**: Slot R101 initial rate = ₹499. User 1 creates Booking 1 (Quantity 2, saved_rate = ₹499, grand_total = ₹1,048).
- **Test Inputs**: Admin updates Slot R101 rate to ₹750 via `PATCH /api/admin/slots/1/rate`.
- **Execution Steps**:
  1. Create Booking 1 at rate ₹499.
  2. Execute admin rate update for Slot R101 to ₹750.
  3. Query Booking 1 details.
  4. Create new Booking 2 for Slot R101.
- **Expected Result**: Booking 1 retains original saved_rate ₹499 and grand_total ₹1,048. New Booking 2 uses updated rate ₹750.
- **Actual Result**: Past Booking 1 retained saved_rate ₹499 and total ₹1,048. New Booking 2 received rate ₹750.
- **Status**: `PASS`
- **Evidence Reference**: `tests/test_mandatory_t1_t12.py::test_t12_rate_snapshot_isolation`
