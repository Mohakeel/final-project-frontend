"""
Database Migration Script
Adds new columns to Job table without deleting existing data
"""
import sqlite3
import os

db_path = 'instance/database.db'

if not os.path.exists(db_path):
    print("❌ Database not found. Please run 'python app.py' first.")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("🔄 Starting database migration...")

# Check if columns already exist
cursor.execute("PRAGMA table_info(job)")
columns = [col[1] for col in cursor.fetchall()]

migrations = []

if 'credential_required' not in columns:
    migrations.append("ALTER TABLE job ADD COLUMN credential_required BOOLEAN DEFAULT 0")
    
if 'is_public' not in columns:
    migrations.append("ALTER TABLE job ADD COLUMN is_public BOOLEAN DEFAULT 1")
    
if 'ai_matching' not in columns:
    migrations.append("ALTER TABLE job ADD COLUMN ai_matching BOOLEAN DEFAULT 0")

if not migrations:
    print("✅ Database is already up to date!")
else:
    for migration in migrations:
        try:
            cursor.execute(migration)
            print(f"✅ Executed: {migration}")
        except Exception as e:
            print(f"❌ Failed: {migration}")
            print(f"   Error: {e}")

    conn.commit()
    print(f"\n✅ Migration complete! Added {len(migrations)} new columns.")

conn.close()
