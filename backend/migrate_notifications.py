"""Create notification table if it doesn't exist"""
import sqlite3
import os

db_path = 'instance/database.db'
if not os.path.exists(db_path):
    print("Database not found.")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='notification'")
if cursor.fetchone():
    print("Notification table already exists.")
else:
    cursor.execute("""
    CREATE TABLE notification (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title VARCHAR(120) NOT NULL,
        message VARCHAR(300) NOT NULL,
        type VARCHAR(30) DEFAULT 'info',
        is_read BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES user(id)
    )
    """)
    conn.commit()
    print("Notification table created!")

conn.close()
print("Done! Restart your Flask backend.")
