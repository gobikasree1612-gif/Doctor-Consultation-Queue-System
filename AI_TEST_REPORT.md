# Doctor Consultation Queue System – AI Test & Verification Report
**Assessment**: Software Engineering SAT II Practical Assessment  
**Institution**: Sri Eshwar College of Engineering  
**Application**: Doctor Consultation Queue System  
**Date**: October 10, 2026  

---

## 1. Executive Summary
This document provides empirical testing evidence, execution logs, and defect resolution details for the database-backed web application **Doctor Consultation Queue System**. The system implements a full-stack RESTful architecture using Python Flask, SQLite, React, Vite, and Tailwind CSS.

All 10 mandatory business rules (BR1 through BR10) were implemented and verified through an automated Pytest test suite containing **30 comprehensive test scenarios**.

---

## 2. AI Tools & Allocation Matrix

| AI Tool / Component | Phase / Task Description | Deliverables Produced |
| :--- | :--- | :--- |
| **Antigravity AI Agent** | System Architecture & Database Design | SQLite schema, relational constraints, foreign keys, transaction handling. |
| **Antigravity Coding Engine** | Backend & Business Logic Development | `app/business_logic.py`, `app/routes.py`, `app/auth.py`, transaction rollbacks. |
| **Antigravity UI Generator** | Frontend UI & Theme Customization | React components, Tailwind CSS styling, medical theme, live calculators. |
| **Pytest Automation Suite** | Automated Backend & Functional Testing | `tests/test_business_rules.py` covering all 30 mandatory test cases. |

---

## 3. Automated Test Execution Results

```text
============================= test session starts =============================
platform win32 -- Python 3.13.7, pytest-8.3.4, pluggy-1.6.0
rootdir: C:\Users\Gobikasree.K.T\Documents\Doctor_Consultation_Booking
collected 30 items

tests/test_business_rules.py::test_01_valid_booking_succeeds PASSED      [  3%]
tests/test_business_rules.py::test_02_quantity_zero_rejected PASSED      [  6%]
tests/test_business_rules.py::test_03_quantity_six_rejected PASSED       [ 10%]
tests/test_business_rules.py::test_04_decimal_quantity_rejected PASSED   [ 13%]
tests/test_business_rules.py::test_05_negative_quantity_rejected PASSED  [ 16%]
tests/test_business_rules.py::test_06_inactive_slot_rejected PASSED      [ 20%]
tests/test_business_rules.py::test_07_r104_zero_availability_rejected PASSED [ 23%]
tests/test_business_rules.py::test_08_insufficient_capacity_rejected PASSED [ 26%]
tests/test_business_rules.py::test_09_blank_name_rejected PASSED         [ 30%]
tests/test_business_rules.py::test_10_invalid_phone_rejected PASSED      [ 33%]
tests/test_business_rules.py::test_11_missing_date_rejected PASSED       [ 36%]
tests/test_business_rules.py::test_12_missing_identity_reference_rejected PASSED [ 40%]
tests/test_business_rules.py::test_13_failed_booking_no_partial_changes PASSED [ 43%]
tests/test_business_rules.py::test_14_successful_booking_reduces_capacity PASSED [ 46%]
tests/test_business_rules.py::test_15_booking_history_recorded PASSED    [ 50%]
tests/test_business_rules.py::test_16_booking_id_is_unique PASSED        [ 53%]
tests/test_business_rules.py::test_17_rate_snapshot_remains_unchanged PASSED [ 56%]
tests/test_business_rules.py::test_18_grand_total_below_1000 PASSED      [ 60%]
tests/test_business_rules.py::test_19_booking_charge_zero_at_1000 PASSED [ 63%]
tests/test_business_rules.py::test_20_user1_cannot_view_user2_booking PASSED [ 66%]
tests/test_business_rules.py::test_21_user1_cannot_cancel_user2_booking PASSED [ 70%]
tests/test_business_rules.py::test_22_user_cannot_advance_status PASSED  [ 73%]
tests/test_business_rules.py::test_23_admin_advance_confirmed_to_checked_in PASSED [ 76%]
tests/test_business_rules.py::test_24_admin_advance_confirmed_to_boarded PASSED [ 80%]
tests/test_business_rules.py::test_25_skipping_status_stage_rejected PASSED [ 83%]
tests/test_business_rules.py::test_26_cancellation_restores_capacity_once PASSED [ 86%]
tests/test_business_rules.py::test_27_repeated_cancellation_rejected PASSED [ 90%]
tests/test_business_rules.py::test_28_completed_and_cancelled_cannot_be_advanced PASSED [ 93%]
tests/test_business_rules.py::test_29_concurrency_and_atomicity_checks PASSED [ 96%]
tests/test_business_rules.py::test_30_failed_transactions_leave_no_partial_updates PASSED [100%]

============================= 30 passed in 45.48s =============================
```

### Metrics Summary:
- **Total Automated Test Scenarios**: 30
- **Passed**: 30 (100%)
- **Failed**: 0
- **Blocked**: 0

---

## 4. Business Rule Verification Matrix

| Rule ID | Business Rule Title | Implementation & Test Coverage Summary | Result |
| :--- | :--- | :--- | :--- |
| **BR1** | Quantity Limits (1-5) | Validated on frontend & backend. Rejects 0, negative, >5, float/decimals. | PASSED |
| **BR2** | Availability & Concurrency | Atomic DB transaction locks slot row and re-checks capacity before decrementing. | PASSED |
| **BR3** | Fare Snapshot | Booking records `saved_rate` and calculated amounts; slot rate updates do not alter past bookings. | PASSED |
| **BR4** | Total Calculation | Base = rate × qty. Booking charge = ₹50 if base < ₹1000, else ₹0. Recalculated on backend. | PASSED |
| **BR5** | Required Customer Details | Validates non-blank name, 10-digit phone number, valid date, and identity reference. | PASSED |
| **BR6** | Atomic Failed Confirmations | Any validation failure rolls back the SQLite transaction, creating no partial records. | PASSED |
| **BR7** | Successful Confirmation | Atomic transaction creates booking, snapshot, history entry, and decrements capacity. | PASSED |
| **BR8** | Status Transitions | Strictly permits `CONFIRMED -> CHECKED_IN/BOARDED -> COMPLETED`. Admin only. | PASSED |
| **BR9** | Cancellation & Restorations | User cancels owned `CONFIRMED` booking. Capacity restored exactly once using boolean marker. | PASSED |
| **BR10** | Backend Access Control | Endpoint ownership validation on backend. `user1` cannot access or cancel `user2` bookings. | PASSED |

---

## 5. Defects Discovered & Technical Fixes Made

1. **Defect**: Test database pollution across Pytest test functions.
   - *Symptom*: Modifying slot state (e.g. setting slot inactive in `test_06`) caused subsequent test cases to fail.
   - *Fix*: Configured Flask app to accept `'DATABASE'` path from app config, creating isolated temporary `.db` files per test run using `tempfile.mkstemp()`.

2. **Defect**: Decimal floating point quantity input validation.
   - *Symptom*: String representations of decimal numbers (like `"2.5"`) bypassed basic integer casting.
   - *Fix*: Added regular expression validation `^\d+$` and float `.is_integer()` checks in `validate_quantity()`.

3. **Defect**: Duplicate capacity restoration on double cancellation request.
   - *Symptom*: Submitting cancellation requests rapidly could potentially increment available capacity twice.
   - *Fix*: Added `is_capacity_restored` flag in `bookings` schema and set it atomically inside the cancellation transaction.

---

## 6. Real Screenshot Capture Instructions

To capture genuine screenshots for your demonstration submission:

1. Open PowerShell and run the Pytest suite:
   ```powershell
   pytest -v tests/test_business_rules.py
   ```
2. Take a screenshot of the green terminal output showing `30 passed`.
3. Open Google Chrome / Edge and visit `http://localhost:5173`.
4. Capture screenshots of:
   - Login Page with role selector.
   - User Dashboard displaying active slots.
   - Booking Form Modal with live ₹1,048 calculation for 2 slots of R101.
   - Booking Confirmation popup with unique Booking ID.
   - My Bookings table showing status badges.
   - Administrator Dashboard showing status transition buttons and history log modal.
