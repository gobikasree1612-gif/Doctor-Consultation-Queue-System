# Defect Log Document

**System Name**: Doctor Consultation Queue System  
**Institution**: Sri Eshwar College of Engineering  
**Assessment**: Software Engineering SAT II Practical Assessment  
**Date**: October 10, 2026  

---

## 1. Overview
This document logs the technical defects identified during the development and automated testing phases of the Doctor Consultation Queue System, detailing the root cause, remediation steps, and empirical retest results.

---

## 2. Defect Records

### Defect DEF-001: Test Database Cross-Test Contamination
- **Defect ID**: `DEF-001`
- **Severity**: High (Blocker for test suite execution)
- **Component**: Pytest Test Fixtures / Database Access Layer (`backend/app/db.py`)
- **Description**: Running sequential test cases in `test_business_rules.py` caused state modifications (e.g. setting slot 1 inactive in `test_06` or reducing capacity in `test_14`) to pollute subsequent tests, causing 15 test failures.
- **Steps to Reproduce**:
  1. Run `pytest -v tests/test_business_rules.py`.
  2. Observe `test_06` deactivating slot 1.
  3. Observe subsequent tests attempting to book slot 1 failing with HTTP 400 "inactive slot".
- **Root Cause**: `get_db_connection()` defaulted to hardcoded path `backend/instance/doctor_queue.db` rather than using Flask application context configuration `app.config['DATABASE']`.
- **Fix Action Taken**:
  - Updated `get_db_connection()` in `db.py` to check `current_app.config.get('DATABASE')`.
  - Updated `create_app()` in `app/__init__.py` to initialize DB using configured path.
  - Updated `conftest.py` to generate isolated temporary SQLite `.db` files per test run using `tempfile.mkstemp()`.
- **Retest Result**: All 30 tests in `test_business_rules.py` and 12 tests in `test_mandatory_t1_t12.py` PASSED with 100% test isolation.
- **Retest Evidence**: `tests/test_business_rules.py` (30 passed in 45.48s).

---

### Defect DEF-002: Decimal String Representation Bypass in Quantity Validation
- **Defect ID**: `DEF-002`
- **Severity**: Medium (Business Rule Violation - BR1)
- **Component**: Business Logic Validation (`backend/app/business_logic.py`)
- **Description**: Passing decimal numbers as string representations (e.g. `"2.5"`) bypassed integer type checks in initial validation drafts.
- **Steps to Reproduce**:
  1. Send `POST /api/bookings` with payload quantity `"2.5"`.
  2. Observe potential conversion errors or non-integer behavior.
- **Root Cause**: `validate_quantity()` relied on basic `isinstance(quantity, int)` check without parsing numeric strings against strict whole-number regex rules.
- **Fix Action Taken**:
  - Added string regex check `re.match(r'^\d+$', quantity.strip())` to ensure string quantities consist strictly of whole digits before converting to int.
  - Added `quantity.is_integer()` check for float inputs.
- **Retest Result**: `test_04_decimal_quantity_rejected` and `test_t2_quantity_boundaries` PASSED with HTTP 400 rejection.
- **Retest Evidence**: `test_mandatory_t1_t12.py::test_t2_quantity_boundaries` (PASSED).

---

### Defect DEF-003: Double Capacity Restoration Risk on Repeated Cancellation Requests
- **Defect ID**: `DEF-003`
- **Severity**: High (Data Integrity & Capacity Corruption - BR9)
- **Component**: Cancellation Service (`backend/app/business_logic.py`)
- **Description**: Rapidly repeated cancellation requests on the same booking ID could potentially increment available slot capacity multiple times if status alone was checked.
- **Steps to Reproduce**:
  1. Create a booking for quantity 2.
  2. Issue first `POST /api/bookings/{id}/cancel` -> status becomes `CANCELLED`, capacity restored by 2.
  3. Attempt second `POST /api/bookings/{id}/cancel` on the same booking ID.
- **Root Cause**: Lack of an explicit persistent boolean marker tracking whether capacity had already been restored for a given booking record.
- **Fix Action Taken**:
  - Added `is_capacity_restored INTEGER NOT NULL DEFAULT 0` column to `bookings` database schema.
  - Updated `cancel_booking_transaction()` to execute status update, set `is_capacity_restored = 1`, and increment `available_capacity` atomically inside `BEGIN IMMEDIATE;` transaction block.
  - Reject cancellation requests if status is not `CONFIRMED`.
- **Retest Result**: `test_27_repeated_cancellation_rejected` and `test_t10_cancellation_and_repeated_cancellation` PASSED. Capacity restored exactly once.
- **Retest Evidence**: `test_mandatory_t1_t12.py::test_t10_cancellation_and_repeated_cancellation` (PASSED).

---

## 3. Defect Summary Table

| Defect ID | Description | Severity | Target File | Resolution Status | Retest Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **DEF-001** | Test database cross-test state pollution | High | `backend/app/db.py`, `conftest.py` | `RESOLVED` | 42/42 Tests Passed |
| **DEF-002** | Decimal quantity validation bypass | Medium | `backend/app/business_logic.py` | `RESOLVED` | Test T2 Passed |
| **DEF-003** | Potential double capacity restoration | High | `backend/app/business_logic.py` | `RESOLVED` | Test T10 Passed |
