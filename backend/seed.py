from app.db import init_db

if __name__ == '__main__':
    print("Initializing SQLite Database and seeding demo accounts & consultation slots...")
    init_db()
    print("Database initialization complete.")
