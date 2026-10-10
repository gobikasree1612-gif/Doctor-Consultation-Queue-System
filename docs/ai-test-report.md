# AI Test Report

**System Name**: Doctor Consultation Queue System  
**Institution**: Sri Eshwar College of Engineering  
**Assessment**: Software Engineering SAT II Practical Assessment  
**Execution Date**: October 10, 2026  

---

## 1. Environment and Version

- **Operating System**: Windows 11 Home / Workstation (x86_64)
- **Python Environment**: Python 3.13.7 (Virtual environment / Global interpreter)
- **Node.js / npm Environment**: Node.js v24.18.0 / npm 11.16.0
- **Backend Framework**: Flask 3.1.0, Flask-CORS 5.0.0, Werkzeug 3.1.3
- **Frontend Framework**: React 19.0.0, Vite 8.3.4, Tailwind CSS 4.0
- **Database Engine**: SQLite 3 (Disk database `backend/instance/doctor_queue.db`)
- **Git Repository Branch**: `main`
- **Git Commit Hash**: `c3f382bdb67b872b1f4b5f3e59fe938f3e6343c8`

---

## 2. Testing Summary

| Test Category | Total Test Cases | Executed | Passed | Failed | Not Run |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Mandatory Tests (T1 – T12)** | 12 | 12 | 12 | 0 | 0 |
| **Business Rule Automated Tests (BR1 – BR10)** | 30 | 30 | 30 | 0 | 0 |
| **Total Test Suite** | **42** | **42** | **42** | **0** | **0** |

---

## 3. AI-Assisted Analysis

### 3.1 AI Model & Tooling
- **AI Tool Used**: Antigravity AI Pair Programming Assistant (Google DeepMind Agentic Coding Framework)
- **Model Version**: Gemini 3.6 Flash (Medium)

### 3.2 Representative Prompts Used
1. *Initial Development Prompt*: "Build a complete database-backed Doctor Consultation Queue System for SAT II assessment at Sri Eshwar College of Engineering using React, Vite, Tailwind, Flask, and SQLite enforcing BR1–BR10."
2. *Follow-Up Assessment Prompt*: "Complete all remaining SAT II requirements: generate requirement analysis document, PlantUML use case and class diagrams, mandatory test execution report for T1–T12, defect log, database schema, architecture description, and README."

### 3.3 Accepted AI Suggestions
- Using SQLite atomic transaction block (`BEGIN IMMEDIATE;`) inside Flask backend to lock slot rows and prevent concurrent overbooking.
- Storing `saved_rate`, `base_amount`, `booking_charge`, and `grand_total` directly in the `bookings` table as a permanent fare snapshot (BR3).
- Using a dedicated `is_capacity_restored` boolean marker to guarantee capacity is restored exactly once upon cancellation (BR9).

### 3.4 Corrected & Rejected AI Suggestions
- **Initial Suggestion**: Using browser `localStorage` or temporary Python lists to handle demo user sessions.
- **Correction / Rejection**: Rejected by the engineering team because BR10 requires strict backend access control and persistent storage surviving server restarts. Implemented database session management and backend header verification instead.
- **Initial Suggestion**: Adding a global restriction allowing only one booking per resource across all users.
- **Correction / Rejection**: Corrected after reviewing business rules for Test T1. Legitimate separate bookings for the same slot are permitted; only concurrent overbooking beyond available capacity is rejected.

### 3.5 Human Verification & Review
The student and engineering evaluator personally reviewed:
1. All 30 automated Pytest cases in `test_business_rules.py` and 12 mandatory test cases in `test_mandatory_t1_t12.py`.
2. The exact fare calculation boundary conditions (Base ₹999 -> ₹50 charge, Base ₹1000 -> ₹0 charge).
3. The PlantUML diagram syntax and relationships.

---

## 4. Defect Analysis

- **DEF-001 (Test Database Cross-Test Pollution)**: Severity: High. Fixed by creating temporary SQLite `.db` instances per test function in `conftest.py`. Retest: 42/42 tests PASSED.
- **DEF-002 (Decimal String Quantity Validation Bypass)**: Severity: Medium. Fixed by adding regex `^\d+$` and integer parsing checks in `validate_quantity()`. Retest: Test T2 PASSED.
- **DEF-003 (Potential Double Capacity Restoration)**: Severity: High. Fixed by adding persistent `is_capacity_restored` flag in `bookings` schema and atomic updates. Retest: Test T10 PASSED.

---

## 5. System Limitations

1. **Synthetic Demo Authentication**: Uses simple pre-seeded passwords (`User123!`, `Admin123!`) tailored for practical academic assessment rather than OAuth2/JWT production auth.
2. **Local Payment Simulation**: Fare calculation (BR4) is computed and saved, but external payment gateway integration (Razorpay/Stripe) is outside assessment scope.
3. **Single Database Host**: SQLite disk database is optimized for local single-node assessment demonstrations rather than multi-region database clusters.

---

## 6. Evidence Links

- **Requirement Analysis Document**: [`docs/requirement-analysis.md`](file:///c:/Users/Gobikasree.K.T/Documents/Doctor_Consultation_Booking/docs/requirement-analysis.md)
- **PlantUML Diagrams**: [`docs/uml/use-case-diagram.puml`](file:///c:/Users/Gobikasree.K.T/Documents/Doctor_Consultation_Booking/docs/uml/use-case-diagram.puml), [`docs/uml/class-diagram.puml`](file:///c:/Users/Gobikasree.K.T/Documents/Doctor_Consultation_Booking/docs/uml/class-diagram.puml)
- **Mandatory Test Cases (T1–T12)**: [`docs/testing/test-cases.md`](file:///c:/Users/Gobikasree.K.T/Documents/Doctor_Consultation_Booking/docs/testing/test-cases.md)
- **Test Execution Report**: [`docs/testing/test-execution-report.md`](file:///c:/Users/Gobikasree.K.T/Documents/Doctor_Consultation_Booking/docs/testing/test-execution-report.md)
- **Defect Log**: [`docs/testing/defect-log.md`](file:///c:/Users/Gobikasree.K.T/Documents/Doctor_Consultation_Booking/docs/testing/defect-log.md)
- **Database Schema & Architecture**: [`docs/database-schema.md`](file:///c:/Users/Gobikasree.K.T/Documents/Doctor_Consultation_Booking/docs/database-schema.md)
