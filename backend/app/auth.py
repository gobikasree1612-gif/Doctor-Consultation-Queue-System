from functools import wraps
from flask import session, request, jsonify, g
from app.db import get_db_connection

def get_current_user(custom_db_path=None):
    user_id = session.get('user_id')
    
    # Also support X-User-Id header for programmatic/test client access if session not set
    if not user_id and request.headers.get('X-User-Id'):
        try:
            user_id = int(request.headers.get('X-User-Id'))
        except ValueError:
            pass

    if not user_id:
        return None

    conn = get_db_connection(custom_db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, name, role FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()

    if row:
        return dict(row)
    return None

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({"error": "Authentication required. Please log in."}), 401
        g.user = user
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({"error": "Authentication required. Please log in."}), 401
        if user['role'] != 'admin':
            return jsonify({"error": "Forbidden: Administrative access required."}), 403
        g.user = user
        return f(*args, **kwargs)
    return decorated_function
