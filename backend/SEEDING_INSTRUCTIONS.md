# Database Seeding Instructions

## Overview
The `seed_database.py` script populates your CertiVerify database with realistic dummy data for testing and development.

## What Gets Created

### Users & Profiles
- **8 Applicants** with complete profiles (names, phones, emails)
- **6 Employers** representing different companies and industries
- **5 Universities** with unique codes and contact information

### Jobs & Applications
- **12 Job Postings** across various roles (Software Engineer, Data Scientist, etc.)
- **~25 Job Applications** with different statuses (Pending, Reviewed, Accepted, Rejected)

### Verification Requests
- **15 Verification Requests** with varied statuses and realistic student data

## How to Run

### Option 1: Seed with Existing Data (Safe)
```bash
cd backend
python seed_database.py
```
This will add dummy data to your existing database without clearing it.

### Option 2: Clear and Reseed (Fresh Start)
```bash
cd backend
python seed_database.py --clear
```
⚠️ **WARNING**: This will delete ALL existing data and create fresh dummy data.

## Test Credentials

All users have the password: `password123`

### Applicant Accounts
- john.doe@email.com
- sarah.wilson@email.com
- michael.chen@email.com
- emily.brown@email.com
- david.martinez@email.com
- lisa.anderson@email.com
- james.taylor@email.com
- sophia.garcia@email.com

### Employer Accounts
- hr@techcorp.com (TechCorp Inc)
- jobs@innovatesoft.com (InnovateSoft)
- careers@datastream.com (DataStream Analytics)
- hiring@cloudnine.com (CloudNine Solutions)
- recruit@fintech.com (FinTech Global)
- talent@greentech.com (GreenTech Industries)

### University Accounts
- admin@stanford.edu (Stanford University)
- registrar@mit.edu (MIT)
- admin@berkeley.edu (UC Berkeley)
- records@harvard.edu (Harvard University)
- admin@caltech.edu (Caltech)

## Data Characteristics

### Realistic Features
- ✅ Proper foreign key relationships
- ✅ Valid email formats
- ✅ Realistic salary ranges ($65k - $190k)
- ✅ Various job types (Full-time, Contract)
- ✅ Multiple application statuses
- ✅ Timestamps with realistic date ranges (1-60 days ago)
- ✅ Blockchain hashes for approved verifications
- ✅ Rejection reasons for denied requests

### Duplicate Prevention
The script checks for existing applications before creating new ones to avoid duplicate job applications from the same applicant.

## Troubleshooting

### Import Error
If you get an import error, make sure you're in the backend directory:
```bash
cd backend
python seed_database.py
```

### Database Locked
If you get a "database is locked" error, make sure the Flask app is not running:
```bash
# Stop any running Flask processes
# Then run the seed script
python seed_database.py
```

### Module Not Found
Ensure all dependencies are installed:
```bash
pip install -r requirements.txt
```

## Customization

You can modify the script to:
- Add more users by extending the `users_data` list
- Create different job types by modifying `jobs_data`
- Adjust salary ranges, locations, or other fields
- Change the number of applications created (currently ~25)

## Resetting for Testing

To get a completely fresh database for testing:
```bash
python seed_database.py --clear
```

This is useful when:
- You want to test the registration flow
- You need a clean slate for demos
- You've made changes to the database schema
- You want consistent test data

## Notes

- The script uses `random` module for variety in statuses and assignments
- All passwords are hashed using Werkzeug's security functions
- Timestamps are backdated to simulate real-world usage patterns
- The script is idempotent when run without `--clear` flag
