# Requirement Analysis Document

**System Name**: Doctor Consultation Queue System  
**Institution**: Sri Eshwar College of Engineering  
**Assessment**: Software Engineering SAT II Practical Assessment  
**Date**: October 10, 2026  

---

## 1. Problem Summary

### 1.1 Problem Statement
In outpatient healthcare facilities, traditional appointment queuing often suffers from manual booking errors, double-booking, lack of real-time availability visibility, inconsistent fare calculations, and unauthorized status modifications.

### 1.2 Purpose
The purpose of the Doctor Consultation Queue System is to provide a reliable, database-backed web application that automates consultation slot reservations, enforces fare calculation rules, manages queue lifecycle status transitions, and maintains complete transaction history and access control.

### 1.3 Proposed Solution
A full-stack web application featuring:
- **Frontend**: React + Vite + Tailwind CSS responsive single-page web app.
- **Backend**: Python Flask REST API with role enforcement and transaction boundary management.
- **Database**: SQLite persistent disk database with atomic transaction rollbacks and capacity constraints.

### 1.4 Expected Outcome
A fully functional, fault-tolerant consultation queue system where patients can book available active slots with real-time fee calculations, and administrators can monitor and advance patient queue statuses without data corruption or overbooking.

---

## 2. System Actors

| Actor | Description | Key Responsibilities |
| :--- | :--- | :--- |
| **User (Patient)** | General public or patient accessing the system to book consultation slots. | Searches active slots, selects quantity (1-5), provides required customer details, confirms booking, views own bookings, and cancels eligible confirmed bookings. |
| **Administrator** | Authorized hospital operational staff overseeing queue management. | Views all patient bookings across all users, inspects booking details and status audit history, advances booking operational statuses (`CONFIRMED -> CHECKED_IN / BOARDED -> COMPLETED`), and updates consultation slot rates. |

---

## 3. Functional Requirements (FR1 – FR10)

- **FR1 (Display and Search Active Slots)**: The system shall display all active consultation slots and allow users to search/filter active slots by category or keyword.
- **FR2 (Select Slot and Quantity)**: The system shall allow users to select an eligible active consultation slot and a quantity satisfying BR1 (1–5) and BR2 (capacity check).
- **FR3 (Display Fare Breakdown)**: The system shall display live calculations of base amount, booking charge, and grand total based on the selected slot rate and quantity.
- **FR4 (Validate Input and Availability)**: The system shall validate user identity, customer details (name, 10-digit phone, date, identity reference), active slot state, and current available capacity on both frontend and backend before confirmation.
- **FR5 (Atomic Confirmed Booking)**: The system shall atomically create a unique confirmed booking ID, record a snapshot of slot/fare details, decrement available capacity by quantity, and log status history.
- **FR6 (View Own Bookings)**: The system shall allow authenticated users to view only their own bookings and details.
- **FR7 (Administrator Status Advancement)**: The system shall allow administrators to view all bookings and advance booking operational statuses strictly through valid lifecycle stages.
- **FR8 (Eligible Cancellation and Restoration)**: The system shall allow users to cancel their own `CONFIRMED` bookings, restoring reserved slot capacity exactly once.
- **FR9 (Error Handling and Validation Messages)**: The system shall display clear, user-friendly error messages for invalid input, insufficient availability, unauthorized access, and invalid status transitions.
- **FR10 (Persistent Database Storage)**: The system shall store users, consultation slots, bookings, and status history persistently in a normalized SQLite database surviving application restarts.

---

## 4. Non-Functional Requirements (NFR1 – NFR7)

- **NFR1 (Reliability & Atomicity)**: Failed booking or status transition transactions must roll back completely without partial database updates or corrupted slot availability.
- **NFR2 (Persistence)**: All user records, consultation slot capacities, booking snapshots, and status transition logs must survive application and server restarts.
- **NFR3 (Maintainability)**: Clear architectural separation between UI components (`frontend/src/`), REST API routes (`backend/app/routes.py`), business logic (`backend/app/business_logic.py`), and data access (`backend/app/db.py`).
- **NFR4 (Usability)**: Clean healthcare design aesthetic (medical blue/teal theme), accessible labels, keyboard-friendly forms, field-specific validation errors, and visual status badges.
- **NFR5 (Security Design)**: Role and ownership checks must be enforced strictly on the Flask backend; frontend client inputs or supplied user IDs must never be blindly trusted.
- **NFR6 (Performance)**: API endpoint response times under 200ms for standard requests, with concurrency-safe database row locking (`BEGIN IMMEDIATE`) for capacity updates.
- **NFR7 (Data Integrity)**: Unique constraints on booking codes, foreign keys between bookings/users/slots, and explicit boolean flags preventing double capacity restoration.

---

## 5. Business Rules (BR1 – BR10)

- **BR1 (Quantity Limits)**: Quantity must be a whole integer from 1 through 5 inclusive. 0, negative numbers, >5, float/decimals, empty, or non-numeric inputs are rejected.
- **BR2 (Availability Check)**: A slot can be booked only when it is active (`is_active = 1`) and `available_capacity >= quantity`. Rechecked atomically at confirmation.
- **BR3 (Fare Snapshot)**: The current slot rate at booking confirmation is saved in the booking record (`saved_rate`). Subsequent slot rate updates do not alter existing booking rates or totals.
- **BR4 (Total Calculation)**: `base_amount = current_rate × quantity`. `booking_charge = ₹50` if `base_amount < ₹1,000`; otherwise `₹0`. `grand_total = base_amount + booking_charge`. Recalculated on backend.
- **BR5 (Required Details Validation)**: Full Name (non-blank), Phone (exactly 10 digits `^\d{10}$`), Consultation Date (required), Identity/Reference ID (non-blank).
- **BR6 (Failed Confirmation Isolation)**: Invalid input or insufficient capacity rejects request, creates no booking, leaves availability unchanged, and logs no fake history.
- **BR7 (Successful Atomic Confirmation)**: Validates input, generates unique code `BK-YYYYMMDD-XXXX`, saves snapshot, reduces availability, and logs history in one atomic transaction.
- **BR8 (Permitted Lifecycle Transitions)**: Allowed transitions for Admin: `CONFIRMED -> CHECKED_IN` or `CONFIRMED -> BOARDED`, then `CHECKED_IN / BOARDED -> COMPLETED`. No stage skipping. Completed or cancelled bookings cannot be advanced.
- **BR9 (Cancellation & Restoration)**: User cancels owned `CONFIRMED` booking. Status becomes `CANCELLED`, history logged, and capacity restored **exactly once** using `is_capacity_restored`.
- **BR10 (Access Control)**: Users view/cancel only own bookings. Administrators view all bookings and perform status updates. Unauthenticated/unauthorized requests yield HTTP 401/403.

---

## 6. Assumptions and Scope

- **Assumptions**: The system operates in a practical assessment environment using synthetic demo accounts (`user1`, `user2`, `admin`) and seeded demo consultation slot data.
- **Out of Scope**: External real-world payment gateway integrations (Razorpay/Stripe), third-party SMS/email gateways, hardware scanner integrations, and multi-hospital tenant deployment.

---

## 7. Requirements Traceability Matrix (RTM)

| Req ID | Description | UML Element | Implemented File / API Endpoint | Test ID(s) | Evidence Location |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FR1 / BR2** | Search & Display Active Slots | `UC1` / `Resource` | `GET /api/slots` (`routes.py`) | `T3`, `test_06`, `test_07` | `screenshots/02_user_dashboard.png` |
| **FR2 / BR1** | Select Slot & Quantity (1-5) | `UC2` / `AvailabilityService` | `BookingModal.jsx`, `business_logic.py` | `T2`, `test_02`-`test_05` | `screenshots/03_booking_modal.png` |
| **FR3 / BR4** | Calculate & Display Fare Breakdown | `UC4` / `BookingService` | `POST /api/slots/calculate`, `calculate_pricing()` | `T4`, `test_18`, `test_19` | `screenshots/03_booking_modal.png` |
| **FR4 / BR5** | Validate Required Details | `UC3` / `BookingService` | `validate_customer_details()` (`business_logic.py`) | `T6`, `test_09`-`test_12` | `screenshots/03_booking_modal.png` |
| **FR5 / BR7** | Atomic Booking Confirmation | `UC5` / `Reservation` | `POST /api/bookings` (`create_booking_transaction`) | `T5`, `test_01`, `test_14` | `screenshots/04_booking_confirmation.png` |
| **FR6 / BR10** | View Own Bookings | `UC6` / `User` | `GET /api/bookings/my` (`routes.py`) | `T8`, `test_20` | `screenshots/05_my_bookings.png` |
| **FR7 / BR8** | Admin Status Transition | `UC10` / `BookingService` | `PATCH /api/admin/bookings/<id>/status` | `T9`, `test_23`-`test_25` | `screenshots/06_admin_dashboard.png` |
| **FR8 / BR9** | Cancellation & Capacity Restoration | `UC7` / `AvailabilityService` | `POST /api/bookings/<id>/cancel` | `T10`, `test_26`, `test_27` | `screenshots/05_my_bookings.png` |
| **FR9** | Error Validation Messages | System | `Alert.jsx`, HTTP 400/403 JSON responses | `T2`-`T4`, `T6`-`T10` | `screenshots/03_booking_modal.png` |
| **FR10** | Persistent SQLite Storage | System | `backend/instance/doctor_queue.db` | `T11`, `test_30` | `docs/database-schema.md` |
| **BR3** | Rate Snapshot Isolation | `ReservationItem` | `saved_rate` column in `bookings` table | `T12`, `test_17` | `screenshots/06_admin_dashboard.png` |
