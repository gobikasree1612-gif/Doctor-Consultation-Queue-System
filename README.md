# Doctor Consultation Queue System – Software Engineering SAT II

**Institution**: Sri Eshwar College of Engineering  
**Assessment**: Software Engineering SAT II Assessment  
**Application Title**: Doctor Consultation Queue System  

---

## 1. Project Overview

The **Doctor Consultation Queue System** is a complete, database-backed web application built for the Software Engineering SAT II assessment. It features a modern healthcare-themed React frontend connected to a Python Flask REST API backed by an SQLite persistent database.

### Key Features:
- **Role-Based Access Control**: Supports User (Patient) and Administrator roles with session validation and backend authorization checks.
- **Seeded Consultation Slots**: Seeded with 5 exact slot records (`R101` through `R105`) with category, schedule, rate, and initial availability.
- **10 Mandatory Business Rules (BR1 - BR10)**: Strict quantity validation (1-5), backend total calculation (₹50 fee for base < ₹1000, free if ≥ ₹1000), rate snapshots, atomic transactions, capacity tracking, and status transitions.
- **Full Operational Lifecycle**: `CONFIRMED -> CHECKED_IN / BOARDED -> COMPLETED` (Admin managed) or `CONFIRMED -> CANCELLED` (User managed with capacity restoration).
- **Automated Pytest Test Suite**: 30 comprehensive business rule automated tests passing with 100% success rate.

---

## 2. Technology Stack

- **Frontend**: React, Vite, Tailwind CSS, React Router, Axios, Lucide React
- **Backend**: Python 3.13, Flask, Flask-CORS, Werkzeug
- **Database**: SQLite3 (Persistent disk database `backend/instance/doctor_queue.db`)
- **Testing**: Pytest for backend REST API & business logic verification

---

## 3. Demo Accounts & Seeded Consultation Slots

### Demo Accounts:
| Username | Password | Role | Name |
| :--- | :--- | :--- | :--- |
| `user1` | `User123!` | User | User One (Patient) |
| `user2` | `User123!` | User | User Two (Patient) |
| `admin` | `Admin123!` | Administrator | Chief Administrator |

### Seeded Consultation Slots:
| Slot ID | Display Name | Category | Schedule | Rate | Initial Capacity | Initial Availability |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **R101** | Consultation Slot A | General Medicine | Mon, Wed, Fri 09:00 AM - 12:00 PM | ₹499 | 10 | 10 |
| **R102** | Consultation Slot B | Cardiology | Tue, Thu 02:00 PM - 05:00 PM | ₹799 | 5 | 5 |
| **R103** | Consultation Slot C | Dermatology | Mon-Sat 10:00 AM - 01:00 PM | ₹199 | 20 | 20 |
| **R104** | Consultation Slot D | Orthopedics | Sat, Sun 04:00 PM - 07:00 PM | ₹1,299 | 0 | 0 (Unavailable) |
| **R105** | Consultation Slot E | Pediatrics | Mon, Thu 05:00 PM - 08:00 PM | ₹1,000 | 3 | 3 |

---

## 4. Setup and Execution Instructions (PowerShell)

Execute the following commands in PowerShell from the root project directory:

### Step 1: Create and Activate Python Virtual Environment
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### Step 2: Install Backend Dependencies
```powershell
pip install -r backend/requirements.txt
```

### Step 3: Initialize and Seed SQLite Database
```powershell
python backend/seed.py
```

### Step 4: Run Flask Backend Server
```powershell
python backend/run.py
```
*The backend API will run locally at `http://127.0.0.1:5000`.*

### Step 5: Install Frontend Dependencies (in a separate terminal)
```powershell
cd frontend
npm install
```

### Step 6: Start Vite Frontend Server
```powershell
npm run dev
```
*The frontend application will open locally at `http://localhost:5173`.*

### Step 7: Run Automated Test Suite
In your virtual environment terminal, run:
```powershell
pytest -v tests/test_business_rules.py
```

---

## 5. Live Demonstration Workflow

1. **Successful Transaction Workflow**:
   - Log in as **User 1** (`user1` / `User123!`).
   - Select **R101** (`Consultation Slot A`).
   - Choose quantity `2`.
   - Fill customer details (Full Name, 10-digit Phone, Date, Identity Ref).
   - Observe live total calculation: Base Amount = ₹998, Booking Charge = ₹50, Grand Total = **₹1,048**.
   - Click **Confirm Booking**.
   - Verify confirmation modal displays unique Booking ID and status `CONFIRMED`.
   - Open **My Bookings** to see the entry.
   - Log in as **Administrator** (`admin` / `Admin123!`).
   - Advance status: `CONFIRMED -> CHECKED_IN -> COMPLETED`.
   - Click **History** to view audit trail.

2. **Rejected Transaction Demonstration**:
   - Try booking **R104** (0 availability). The system displays "Slot Unavailable" and rejects booking attempts.

3. **Cancellation Demonstration**:
   - Create a valid booking for an available slot as **User 1**.
   - In **My Bookings**, click **Cancel**. Status becomes `CANCELLED` and capacity is restored.
   - Attempting to cancel again is rejected.

4. **Authorization Demonstration**:
   - Log in as **User 2** (`user2` / `User123!`). Verify User 1's bookings are inaccessible and user role cannot advance status.
