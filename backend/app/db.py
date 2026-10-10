import sqlite3
import os
from flask import current_app, has_app_context
from werkzeug.security import generate_password_hash

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'instance', 'doctor_queue.db')

def get_db_path(custom_db_path=None):
    if custom_db_path:
        return custom_db_path
    if has_app_context() and current_app.config.get('DATABASE'):
        return current_app.config['DATABASE']
    return DB_PATH

def get_db_connection(custom_db_path=None):
    db_file = get_db_path(custom_db_path)
    os.makedirs(os.path.dirname(db_file), exist_ok=True)
    conn = sqlite3.connect(db_file)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db(custom_db_path=None):
    conn = get_db_connection(custom_db_path)
    cursor = conn.cursor()

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('user', 'admin'))
    );
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS consultation_slots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slot_code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        schedule TEXT NOT NULL,
        category TEXT NOT NULL,
        rate INTEGER NOT NULL,
        initial_capacity INTEGER NOT NULL,
        available_capacity INTEGER NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1
    );
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_code TEXT UNIQUE NOT NULL,
        user_id INTEGER NOT NULL,
        slot_id INTEGER NOT NULL,
        saved_slot_name TEXT NOT NULL,
        saved_schedule TEXT NOT NULL,
        saved_category TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        consultation_date TEXT NOT NULL,
        identity_reference TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        saved_rate INTEGER NOT NULL,
        base_amount INTEGER NOT NULL,
        booking_charge INTEGER NOT NULL,
        grand_total INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'CONFIRMED',
        is_capacity_restored INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(slot_id) REFERENCES consultation_slots(id)
    );
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS status_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id INTEGER NOT NULL,
        old_status TEXT,
        new_status TEXT NOT NULL,
        changed_by TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        note TEXT,
        FOREIGN KEY(booking_id) REFERENCES bookings(id)
    );
    ''')

    conn.commit()

    seed_database(conn)
    conn.close()

def seed_database(conn):
    cursor = conn.cursor()

    # Demo Accounts
    users_data = [
        ('user1', generate_password_hash('User123!'), 'User One (Patient)', 'user'),
        ('user2', generate_password_hash('User123!'), 'User Two (Patient)', 'user'),
        ('admin', generate_password_hash('Admin123!'), 'Chief Administrator', 'admin')
    ]

    for username, pwd_hash, name, role in users_data:
        cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
        if not cursor.fetchone():
            cursor.execute('''
                INSERT INTO users (username, password_hash, name, role)
                VALUES (?, ?, ?, ?)
            ''', (username, pwd_hash, name, role))

    # Required Slots
    slots_data = [
        ('R101', 'Consultation Slot A', 'Mon, Wed, Fri 09:00 AM - 12:00 PM', 'General Medicine', 499, 10, 10, 1),
        ('R102', 'Consultation Slot B', 'Tue, Thu 02:00 PM - 05:00 PM', 'Cardiology', 799, 5, 5, 1),
        ('R103', 'Consultation Slot C', 'Mon-Sat 10:00 AM - 01:00 PM', 'Dermatology', 199, 20, 20, 1),
        ('R104', 'Consultation Slot D', 'Sat, Sun 04:00 PM - 07:00 PM', 'Orthopedics', 1299, 0, 0, 1),
        ('R105', 'Consultation Slot E', 'Mon, Thu 05:00 PM - 08:00 PM', 'Pediatrics', 1000, 3, 3, 1)
    ]

    for slot_code, name, sched, cat, rate, init_cap, avail_cap, is_act in slots_data:
        cursor.execute("SELECT id FROM consultation_slots WHERE slot_code = ?", (slot_code,))
        if not cursor.fetchone():
            cursor.execute('''
                INSERT INTO consultation_slots (slot_code, name, schedule, category, rate, initial_capacity, available_capacity, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (slot_code, name, sched, cat, rate, init_cap, avail_cap, is_act))

    conn.commit()
