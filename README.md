# Doctor Consultation Queue System – Software Engineering SAT II

**Institution**: Sri Eshwar College of Engineering  
**Assessment**: Software Engineering SAT II Assessment  
**Application Title**: Doctor Consultation Queue System  
**Repository Branch**: `main`  
**Git Commit Hash**: `c3f382bdb67b872b1f4b5f3e59fe938f3e6343c8`  

---

## 1. Project Overview & Summary

The **Doctor Consultation Queue System** is a complete, database-backed web application built for the Software Engineering SAT II assessment at Sri Eshwar College of Engineering. It features a modern healthcare-themed React single-page frontend connected to a Python Flask REST API backed by a persistent SQLite database.

The system enforces all 10 mandatory business rules (BR1 through BR10), supports full queue status transition lifecycles, and maintains 100% test pass rates across 42 automated Pytest test cases.

---

## 2. Main Features

- **Dual Role System**: User (Patient) and Administrator with role-based access control and backend identity verification.
- **Seeded Consultation Slots**: Seeded with 5 exact slot records (`R101` through `R105`) containing rate, capacity, and active status.
- **Real-Time Fare Calculator (BR4)**: Computes Base Amount (`rate × quantity`) and Booking Charge (₹50 if base < ₹1,000; otherwise ₹0).
- **Atomic Transactions (BR6 & BR7)**: Guarantees booking creation, capacity decrement, fare snapshots, and status history logs succeed together or roll back cleanly.
- **Queue Status Lifecycle (BR8)**: `CONFIRMED -> CHECKED_IN / BOARDED -> COMPLETED` (Managed by Administrator).
- **Cancellation & Restoration (BR9)**: User cancels owned `CONFIRMED` booking; capacity restored **exactly once** using persistent restoration flags.

---

## 3. Technology Stack

- **Frontend**: React 19, Vite 8, Tailwind CSS v4, React Router DOM 7, Axios, Lucide React Icons
- **Backend**: Python 3.13, Flask 3.1, Flask-CORS, Werkzeug Security
- **Database Engine**: SQLite 3 (Persistent File Storage: `backend/instance/doctor_queue.db`)
- **Testing**: Pytest 8.3 (42 Automated Tests)

---

## 4. Project Folder Structure

```text
Doctor_Consultation_Booking/
├── backend/
│   ├── app/
│   │   ├── __init__.py        # Flask App Factory & CORS setup
│   │   ├── auth.py            # Authentication & authorization decorators
│   │   ├── business_logic.py  # BR1 - BR10 validation & transaction functions
│   │   ├── db.py              # SQLite connection & schema initialization
│   │   └── routes.py          # REST API Endpoints blueprint
│   ├── instance/
│   │   └── doctor_queue.db    # Persistent SQLite database file
│   ├── requirements.txt       # Backend Python dependencies
│   ├── run.py                 # Backend server entrypoint (Port 5000)
│   └── seed.py                # Database seed script
├── docs/
│   ├── requirement-analysis.md # FR1-FR10, NFRs, BRs, Traceability Matrix
│   ├── database-schema.md     # Relational Schema & 3-Tier Architecture
│   ├── ai-test-report.md      # AI tools, prompts, defect analysis & metrics
│   ├── uml/
│   │   ├── use-case-diagram.puml / .svg
│   │   └── class-diagram.puml / .svg
│   └── testing/
│       ├── test-cases.md              # Mandatory Test Cases T1 - T12
│       ├── test-execution-report.md   # Pytest execution report (42/42 Passed)
│       └── defect-log.md              # DEF-001, DEF-002, DEF-003 analysis
├── frontend/
│   ├── src/
│   │   ├── components/        # Navbar, BookingModal, StatusBadge, Alert, etc.
│   │   ├── context/           # AuthContext provider
│   │   ├── pages/             # LoginPage, UserDashboard, MyBookings, AdminDashboard
│   │   ├── services/          # Axios API service
│   │   ├── App.jsx            # Router & protected routes
│   │   └── index.css          # Tailwind CSS styles
│   └── vite.config.js         # Vite configuration with API proxy
├── screenshots/               # PlantUML PNG diagram exports & test screenshots
├── tests/
│   ├── conftest.py            # Pytest test environment fixtures
│   ├── test_business_rules.py # 30 automated business rule tests
│   └── test_mandatory_t1_t12.py # 12 mandatory assessment test cases
├── AI_TEST_REPORT.md
└── README.md
```

---

## 5. Installation Instructions (Windows PowerShell)

Open PowerShell in the root directory:

```powershell
# Step 1: Create and Activate Python Virtual Environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Step 2: Install Backend Dependencies
pip install -r backend/requirements.txt

# Step 3: Install Frontend Dependencies
cd frontend
npm install
cd ..
```

---

## 6. Execution Commands

### A. Initialize / Seed SQLite Database
```powershell
python backend/seed.py
```

### B. Start Flask Backend Server (Port 5000)
```powershell
python backend/run.py
```
*API Base URL: `http://127.0.0.1:5000/api`*

### C. Start Vite Frontend Server (Port 5173) (In a separate terminal)
```powershell
cd frontend
npm run dev
```
*Application URL: `http://localhost:5173`*

### D. Run Automated Test Suites
```powershell
# Run Mandatory Test Suite (T1 - T12)
pytest -v tests/test_mandatory_t1_t12.py

# Run Full 30 Business Rule Test Suite
pytest -v tests/test_business_rules.py
```

---

## 7. Synthetic Demo Credentials

> [!IMPORTANT]
> These credentials are synthetic test accounts created specifically for academic assessment demonstrations.

| Role | Username | Password | Display Name |
| :--- | :--- | :--- | :--- |
| **User (Patient)** | `user1` | `User123!` | User One (Patient) |
| **User (Patient)** | `user2` | `User123!` | User Two (Patient) |
| **Administrator** | `admin` | `Admin123!` | Chief Administrator |

---

## 8. Exact Demonstration Workflow

1. **Successful Transaction Demonstration**:
   - Log in as **User 1** (`user1` / `User123!`).
   - Select **R101** (`Consultation Slot A`, Rate ₹499).
   - Input Quantity = `2`.
   - Enter Full Name `"Dr. Rajesh Kumar"`, Phone `"9876543210"`, Date `"2026-10-20"`, Identity Ref `"AADHAAR-9988"`.
   - Verify calculation: Base = ₹998, Booking Charge = ₹50, Grand Total = **₹1,048**.
   - Click **Confirm Booking**.
   - Verify unique Booking ID (`BK-YYYYMMDD-XXXX`) and status `CONFIRMED`.
   - Open **My Bookings** to view entry.
   - Log in as **Administrator** (`admin` / `Admin123!`).
   - Advance status: `CONFIRMED -> CHECKED_IN -> COMPLETED`.
   - Click **History** to view the status audit trail.

2. **Rejected Transaction Demonstration**:
   - Attempt to book **R104** (0 initial availability). Observe button disabled and API rejecting requests with HTTP 400.

3. **Cancellation Demonstration**:
   - Create a valid booking for an available slot as **User 1**.
   - In **My Bookings**, click **Cancel**. Status changes to `CANCELLED` and capacity is restored.
   - Attempting cancellation again is rejected without secondary capacity restoration.

4. **Authorization Demonstration**:
   - Log in as **User 2** (`user2` / `User123!`). Verify User 1's bookings return HTTP 403 Forbidden.

---

## 9. Documentation Links

- 📄 **Requirement Analysis Document**: [`docs/requirement-analysis.md`](file:///c:/Users/Gobikasree.K.T/Documents/Doctor_Consultation_Booking/docs/requirement-analysis.md)
- 📐 **PlantUML Use Case Diagram**: [`docs/uml/use-case-diagram.puml`](file:///c:/Users/Gobikasree.K.T/Documents/Doctor_Consultation_Booking/docs/uml/use-case-diagram.puml) ([SVG](file:///c:/Users/Gobikasree.K.T/Documents/Doctor_Consultation_Booking/docs/uml/use-case-diagram.svg) / [PNG](file:///c:/Users/Gobikasree.K.T/Documents/Doctor_Consultation_Booking/screenshots/use-case-diagram.png))
- 📐 **PlantUML Class Diagram**: [`docs/uml/class-diagram.puml`](file:///c:/Users/Gobikasree.K.T/Documents/Doctor_Consultation_Booking/docs/uml/class-diagram.puml) ([SVG](file:///c:/Users/Gobikasree.K.T/Documents/Doctor_Consultation_Booking/docs/uml/class-diagram.svg) / [PNG](file:///c:/Users/Gobikasree.K.T/Documents/Doctor_Consultation_Booking/screenshots/class-diagram.png))
- 🗄️ **Database Schema & Architecture**: [`docs/database-schema.md`](file:///c:/Users/Gobikasree.K.T/Documents/Doctor_Consultation_Booking/docs/database-schema.md)
- 🧪 **Mandatory Test Cases (T1 – T12)**: [`docs/testing/test-cases.md`](file:///c:/Users/Gobikasree.K.T/Documents/Doctor_Consultation_Booking/docs/testing/test-cases.md)
- 📊 **Test Execution Report**: [`docs/testing/test-execution-report.md`](file:///c:/Users/Gobikasree.K.T/Documents/Doctor_Consultation_Booking/docs/testing/test-execution-report.md)
- 🐛 **Defect Log**: [`docs/testing/defect-log.md`](file:///c:/Users/Gobikasree.K.T/Documents/Doctor_Consultation_Booking/docs/testing/defect-log.md)
- 🤖 **AI Test Report**: [`docs/ai-test-report.md`](file:///c:/Users/Gobikasree.K.T/Documents/Doctor_Consultation_Booking/docs/ai-test-report.md)

---

## 10. Submission Evidence & Git Status

- **Git Branch**: `main`
- **Git Commit Hash**: `c3f382bdb67b872b1f4b5f3e59fe938f3e6343c8`
- **Committed Changes**: All source files, test suites, PlantUML diagrams, and documentation files committed to local Git repo.
- **Remote Submission Status**: Local Git repository initialized and committed. No remote push performed.

---

## 11. System Limitations & Future Work

- **Synthetic Auth**: Uses pre-seeded demo accounts rather than production OAuth2 / SAML single sign-on.
- **Payment Gateway**: Computes and stores fee breakdowns; external payment gateway integrations (Razorpay/Stripe) are outside assessment scope.
