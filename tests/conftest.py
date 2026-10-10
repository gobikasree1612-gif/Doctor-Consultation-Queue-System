import os
import sys
import tempfile
import pytest

# Ensure backend directory is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app import create_app
from app.db import get_db_connection

@pytest.fixture
def app():
    # Create temporary database file
    db_fd, db_path = tempfile.mkstemp(suffix='.db')
    
    app = create_app({
        'TESTING': True,
        'SECRET_KEY': 'test_secret_key',
        'DATABASE': db_path
    })

    app.custom_db_path = db_path

    yield app

    # Cleanup
    os.close(db_fd)
    if os.path.exists(db_path):
        os.unlink(db_path)

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def db_conn(app):
    conn = get_db_connection(app.custom_db_path)
    yield conn
    conn.close()
