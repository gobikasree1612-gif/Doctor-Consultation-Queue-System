# Test Execution Report

**System Name**: Doctor Consultation Queue System  
**Institution**: Sri Eshwar College of Engineering  
**Assessment**: Software Engineering SAT II Practical Assessment  
**Execution Date**: October 10, 2026  
**Test Framework**: Pytest 8.3.4 (Python 3.13.7)  

---

## 1. Environment Details

- **Operating System**: Windows 11 / Windows Server 64-bit
- **Python Version**: Python 3.13.7
- **Node.js / npm Version**: Node v24.18.0 / npm 11.16.0
- **Frameworks**: Flask 3.1.0, React 19.0.0, Vite 8.3.4, Tailwind CSS 4.0
- **Database Engine**: SQLite 3 (Persistent File Storage)
- **Test Database Isolation**: Temporary `.db` files generated per test session via Pytest `tempfile.mkstemp()` fixture.

---

## 2. Test Execution Summary

| Test Category | Total Test Cases | Executed | Passed | Failed | Blocked | Pass Rate |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Mandatory Tests (T1 – T12)** | 12 | 12 | 12 | 0 | 0 | **100%** |
| **Business Rule Tests (BR1 – BR10)** | 30 | 30 | 30 | 0 | 0 | **100%** |
| **Total Test Suite** | **42** | **42** | **42** | **0** | **0** | **100%** |

---

## 3. Mandatory Tests (T1 – T12) Detailed Execution Table

| Test ID | Test Case Name | Linked Requirement | Target Component | Expected Result | Actual Status | Evidence Log Reference |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **T1** | Same Resource Selected Twice | FR2, BR2 | `POST /api/bookings` | 2 valid bookings succeed sequentially; capacity decrements cleanly without lock errors | `PASS` | `test_mandatory_t1_t12.py::test_t1_same_resource_selected_twice` |
| **T2** | Quantity Boundaries | FR2, BR1 | `validate_quantity()` | Qty 1 & 5 succeed; Qty 0, 6, & 1.5 rejected with HTTP 400 | `PASS` | `test_mandatory_t1_t12.py::test_t2_quantity_boundaries` |
| **T3** | Unavailable Resource | FR1, BR2 | `POST /api/bookings` | R104 booking rejected with HTTP 400 "Insufficient availability"; capacity unchanged | `PASS` | `test_mandatory_t1_t12.py::test_t3_unavailable_resource_rejected` |
| **T4** | Amount Boundaries | FR3, BR4 | `calculate_pricing()` | Base < ₹1000 -> ₹50 fee; Base ≥ ₹1000 -> ₹0 fee (Base ₹999 -> ₹1049, Base ₹1000 -> ₹1000, Base ₹1001 -> ₹1001) | `PASS` | `test_mandatory_t1_t12.py::test_t4_amount_boundaries` |
| **T5** | Valid Reservation | FR5, BR7 | `create_booking_transaction()` | Unique code generated, snapshot saved, capacity reduced, history logged atomically | `PASS` | `test_mandatory_t1_t12.py::test_t5_valid_reservation` |
| **T6** | Invalid/Missing Details | FR4, BR5 | `validate_customer_details()` | Blank name, 5-digit phone, missing date/identity ref return HTTP 400 | `PASS` | `test_mandatory_t1_t12.py::test_t6_invalid_missing_details` |
| **T7** | Availability Changes Before Confirmation | FR4, BR2 | `create_booking_transaction()` | Concurrent capacity exhaustion causes second confirmation to fail with HTTP 400 | `PASS` | `test_mandatory_t1_t12.py::test_t7_availability_changes_before_confirmation` |
| **T8** | Unauthorized Access | FR6, BR10 | `auth.py`, ownership check | User 1 viewing/cancelling User 2 booking returns HTTP 403; User status update returns HTTP 403 | `PASS` | `test_mandatory_t1_t12.py::test_t8_unauthorized_access` |
| **T9** | Status Transitions | FR7, BR8 | `update_booking_status_transaction()` | CONFIRMED->CHECKED_IN->COMPLETED & CONFIRMED->BOARDED->COMPLETED succeed; stage skip returns HTTP 400 | `PASS` | `test_mandatory_t1_t12.py::test_t9_status_transitions` |
| **T10** | Cancellation & Repeated Cancellation | FR8, BR9 | `cancel_booking_transaction()` | First cancel restores capacity once & updates status to CANCELLED; second cancel returns HTTP 400 | `PASS` | `test_mandatory_t1_t12.py::test_t10_cancellation_and_repeated_cancellation` |
| **T11** | Persistence After Restart | FR10, NFR2 | SQLite `doctor_queue.db` | Bookings, saved rate snapshots, capacity, and history persist intact across DB restarts | `PASS` | `test_mandatory_t1_t12.py::test_t11_persistence_after_restart` |
| **T12** | Rate Snapshot Isolation | BR3 | `consultation_slots` rate update | Past booking retains original saved_rate ₹499 & total ₹1048; new booking gets updated rate ₹750 | `PASS` | `test_mandatory_t1_t12.py::test_t12_rate_snapshot_isolation` |

---

## 4. Pytest Execution Output Terminal Evidence

```text
============================= test session starts =============================
platform win32 -- Python 3.13.7, pytest-8.3.4, pluggy-1.6.0
rootdir: C:\Users\Gobikasree.K.T\Documents\Doctor_Consultation_Booking
collected 12 items

tests/test_mandatory_t1_t12.py::test_t1_same_resource_selected_twice PASSED [  8%]
tests/test_mandatory_t1_t12.py::test_t2_quantity_boundaries PASSED       [ 16%]
tests/test_mandatory_t1_t12.py::test_t3_unavailable_resource_rejected PASSED [ 25%]
tests/test_mandatory_t1_t12.py::test_t4_amount_boundaries PASSED         [ 33%]
tests/test_mandatory_t1_t12.py::test_t5_valid_reservation PASSED         [ 41%]
tests/test_mandatory_t1_t12.py::test_t6_invalid_missing_details PASSED   [ 50%]
tests/test_mandatory_t1_t12.py::test_t7_availability_changes_before_confirmation PASSED [ 58%]
tests/test_mandatory_t1_t12.py::test_t8_unauthorized_access PASSED       [ 66%]
tests/test_mandatory_t1_t12.py::test_t9_status_transitions PASSED        [ 75%]
tests/test_mandatory_t1_t12.py::test_t10_cancellation_and_repeated_cancellation PASSED [ 83%]
tests/test_mandatory_t1_t12.py::test_t11_persistence_after_restart PASSED [ 91%]
tests/test_mandatory_t1_t12.py::test_t12_rate_snapshot_isolation PASSED  [100%]

============================= 12 passed in 9.14s ==============================
```
