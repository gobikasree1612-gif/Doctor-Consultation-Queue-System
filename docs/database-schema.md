# Database Schema & Architecture Documentation

**System Name**: Doctor Consultation Queue System  
**Institution**: Sri Eshwar College of Engineering  
**Assessment**: Software Engineering SAT II Practical Assessment  
**Engine**: SQLite 3 (Persistent File Storage)  
**Database File**: `backend/instance/doctor_queue.db`  

---

## 1. System Architecture (Non-UML Overview)

The application follows a clean 3-tier layered architecture separating presentation, business logic, API orchestration, and data storage:

```text
  ┌─────────────────────────────────────────────────────────────┐
  │                 React + Vite Frontend (UI)                  │
  │     (User Dashboard, Booking Modal, Admin Queue Control)    │
  └──────────────────────────────┬──────────────────────────────┘
                                 │ HTTP / REST API (JSON)
  ┌──────────────────────────────▼──────────────────────────────┐
  │                 Flask REST API Controller                   │
  │               (app/routes.py & app/auth.py)                 │
  └──────────────────────────────┬──────────────────────────────┘
                                 │ In-Memory Invocation
  ┌──────────────────────────────▼──────────────────────────────┐
  │                 Business Logic Services                      │
  │             (app/business_logic.py: BR1 - BR10)             │
  └──────────────────────────────┬──────────────────────────────┘
                                 │ SQLite SQL Transactions
  ┌──────────────────────────────▼──────────────────────────────┐
  │               SQLite Disk Database Storage                  │
  │             (backend/instance/doctor_queue.db)              │
  └─────────────────────────────────────────────────────────────┘
```

---

## 2. Relational Database Schema

### 2.1 `users` Table
Stores authenticated system accounts and roles.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique user identification number |
| `username` | `TEXT` | `UNIQUE NOT NULL` | Login username (`user1`, `user2`, `admin`) |
| `password_hash` | `TEXT` | `NOT NULL` | Werkzeug salted hash of account password |
| `name` | `TEXT` | `NOT NULL` | Full display name of the account holder |
| `role` | `TEXT` | `NOT NULL CHECK(role IN ('user', 'admin'))` | System role (`user` or `admin`) |

---

### 2.2 `consultation_slots` Table
Stores consultation slots, capacities, rates, and active states (mapped conceptually to Resource).

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique internal slot ID |
| `slot_code` | `TEXT` | `UNIQUE NOT NULL` | Business code (`R101`, `R102`, `R103`, `R104`, `R105`) |
| `name` | `TEXT` | `NOT NULL` | Consultation slot display title |
| `schedule` | `TEXT` | `NOT NULL` | Schedule info (days & time window) |
| `category` | `TEXT` | `NOT NULL` | Medical department / category |
| `rate` | `INTEGER` | `NOT NULL` | Current consultation fee in INR (₹) |
| `initial_capacity` | `INTEGER` | `NOT NULL` | Maximum capacity seeded |
| `available_capacity` | `INTEGER` | `NOT NULL` | Current available capacity |
| `is_active` | `INTEGER` | `NOT NULL DEFAULT 1` | Active (1) or inactive (0) status flag |

---

### 2.3 `bookings` Table
Stores customer reservations, saved fare snapshots, customer details, and lifecycle statuses.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Internal booking ID |
| `booking_code` | `TEXT` | `UNIQUE NOT NULL` | Generated unique reference (`BK-YYYYMMDD-XXXX`) |
| `user_id` | `INTEGER` | `NOT NULL, FOREIGN KEY(user_id) REFERENCES users(id)` | Account ID of owner |
| `slot_id` | `INTEGER` | `NOT NULL, FOREIGN KEY(slot_id) REFERENCES consultation_slots(id)` | Reserved slot ID |
| `saved_slot_name` | `TEXT` | `NOT NULL` | Saved slot name snapshot |
| `saved_schedule` | `TEXT` | `NOT NULL` | Saved schedule snapshot |
| `saved_category` | `TEXT` | `NOT NULL` | Saved category snapshot |
| `customer_name` | `TEXT` | `NOT NULL` | Patient full name (BR5) |
| `phone` | `TEXT` | `NOT NULL` | Patient 10-digit phone number (BR5) |
| `consultation_date` | `TEXT` | `NOT NULL` | Scheduled consultation date |
| `identity_reference` | `TEXT` | `NOT NULL` | Aadhaar / Govt ID / Ref ID |
| `quantity` | `INTEGER` | `NOT NULL` | Booked slot quantity (1–5) |
| `saved_rate` | `INTEGER` | `NOT NULL` | Rate per slot captured at confirmation (BR3) |
| `base_amount` | `INTEGER` | `NOT NULL` | `saved_rate × quantity` (BR4) |
| `booking_charge` | `INTEGER` | `NOT NULL` | ₹50 if base < ₹1000, else ₹0 (BR4) |
| `grand_total` | `INTEGER` | `NOT NULL` | `base_amount + booking_charge` |
| `status` | `TEXT` | `NOT NULL DEFAULT 'CONFIRMED'` | `CONFIRMED`, `CHECKED_IN`, `BOARDED`, `COMPLETED`, `CANCELLED` |
| `is_capacity_restored` | `INTEGER` | `NOT NULL DEFAULT 0` | Restoration marker preventing double capacity return (BR9) |
| `created_at` | `TEXT` | `NOT NULL` | Creation timestamp |
| `updated_at` | `TEXT` | `NOT NULL` | Last update timestamp |

---

### 2.4 `status_history` Table
Stores audit logs of all lifecycle status transitions.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Audit log record ID |
| `booking_id` | `INTEGER` | `NOT NULL, FOREIGN KEY(booking_id) REFERENCES bookings(id)` | Target booking ID |
| `old_status` | `TEXT` | `NULLABLE` | Previous status |
| `new_status` | `TEXT` | `NOT NULL` | Transitioned status |
| `changed_by` | `TEXT` | `NOT NULL` | Username of actor performing change |
| `timestamp` | `TEXT` | `NOT NULL` | Event timestamp |
| `note` | `TEXT` | `NULLABLE` | Descriptive event note |

---

## 3. Data Integrity & Business Mechanism Implementations

### 3.1 Fare Snapshot Storage (BR3 & BR4)
When a booking is confirmed, the backend computes `base_amount`, `booking_charge`, and `grand_total` using the slot's rate at that instant and writes `saved_rate` directly into the `bookings` row. If an administrator later executes an update on `consultation_slots.rate`, existing rows in `bookings` remain unaffected.

### 3.2 Atomic Database Transactions & Rollbacks (BR6 & BR7)
Booking confirmation (`create_booking_transaction`) executes inside an immediate SQLite transaction (`BEGIN IMMEDIATE;`). If any validation fails (e.g. invalid phone, inactive slot, or `available_capacity < quantity`), `conn.rollback()` is invoked immediately, ensuring zero partial records or availability changes occur.

### 3.3 Protection Against Double Capacity Restoration (BR9)
During cancellation (`cancel_booking_transaction`), the backend checks `is_capacity_restored`. If `0`, it sets `is_capacity_restored = 1`, increments `available_capacity += quantity`, updates status to `CANCELLED`, and commits. Subsequent cancellation attempts on the same booking ID are rejected with HTTP 400.

### 3.4 Persistence After Restart Verification (FR10)
SQLite writes all committed transactions directly to disk at `backend/instance/doctor_queue.db`. Restarting the Flask server re-opens the existing database file, guaranteeing all booking records, fare snapshots, updated slot capacities, and audit logs persist intact across restarts.
