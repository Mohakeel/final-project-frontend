"""
Database Migration Script - Recreate Certificate Table with correct schema
"""
import sqlite3
import os

db_path = 'instance/database.db'

if not os.path.exists(db_path):
    print("Database not found. Please run 'python app.py' first.")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("Starting certificate table migration...")

# Drop old certificate table
cursor.execute("DROP TABLE IF EXISTS certificate")
conn.commit()
print("Dropped old certificate table.")

# Create new certificate table with correct schema
cursor.execute("""
CREATE TABLE certificate (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    university_id INTEGER NOT NULL,
    student_name VARCHAR(100) NOT NULL,
    certificate_id VARCHAR(50),
    degree VARCHAR(100) NOT NULL,
    graduation_year INTEGER NOT NULL,
    cert_hash VARCHAR(64) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'VERIFIED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (university_id) REFERENCES university(id)
)
""")
conn.commit()
print("Created new certificate table with correct schema.")

# Verify
cursor.execute("PRAGMA table_info(certificate)")
cols = [row[1] for row in cursor.fetchall()]
print(f"Columns: {cols}")

conn.close()
print("\nMigration complete! Restart your Flask backend.")
