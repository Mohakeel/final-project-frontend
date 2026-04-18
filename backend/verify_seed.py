"""
Quick verification script to check if seeding dependencies are available
"""

print("🔍 Verifying seeding requirements...\n")

# Check imports
try:
    from app import create_app
    app = create_app()
    print("✅ Flask app imported successfully")
except ImportError as e:
    print(f"❌ Failed to import app: {e}")
    exit(1)

try:
    from models.models import db, User, Applicant, Employer, University, Job, JobApplication, VerificationRequest
    print("✅ All models imported successfully")
except ImportError as e:
    print(f"❌ Failed to import models: {e}")
    exit(1)

try:
    from werkzeug.security import generate_password_hash
    print("✅ Werkzeug security imported successfully")
except ImportError as e:
    print(f"❌ Failed to import werkzeug: {e}")
    exit(1)

try:
    from datetime import datetime, timedelta
    import random
    print("✅ Standard library modules available")
except ImportError as e:
    print(f"❌ Failed to import standard modules: {e}")
    exit(1)

# Check database connection
try:
    with app.app_context():
        # Try to query users table
        user_count = User.query.count()
        print(f"✅ Database connection successful (current users: {user_count})")
except Exception as e:
    print(f"❌ Database connection failed: {e}")
    exit(1)

print("\n✨ All checks passed! You can run the seeding script.")
print("\nTo seed the database, run:")
print("  python seed_database.py")
print("\nTo clear and reseed:")
print("  python seed_database.py --clear")
