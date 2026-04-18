# 🌱 Database Seeding Guide

## Quick Start

### Windows
```bash
cd backend
python seed_database.py
```

Or use the batch file:
```bash
cd backend
seed.bat
```

### Linux/Mac
```bash
cd backend
python seed_database.py
```

Or use the shell script:
```bash
cd backend
./seed.sh
```

## Commands

### Add Dummy Data (Safe - keeps existing data)
```bash
python seed_database.py
```

### Clear & Reseed (⚠️ Deletes everything)
```bash
python seed_database.py --clear
```

## What You Get

### 📊 Data Summary
- **8 Applicants** - Job seekers with profiles
- **6 Employers** - Companies posting jobs
- **5 Universities** - Educational institutions
- **12 Jobs** - Various tech positions
- **~25 Applications** - Job applications with different statuses
- **15 Verification Requests** - Credential verification requests

### 🔑 Login Credentials

**Password for all accounts:** `password123`

#### Test as Applicant
```
Email: john.doe@email.com
Role: Job Seeker
```

#### Test as Employer
```
Email: hr@techcorp.com
Role: Company/Recruiter
```

#### Test as University
```
Email: admin@stanford.edu
Role: Educational Institution
```

## Sample Data Details

### Jobs Include
- Senior Software Engineer ($120k-$180k, San Francisco)
- Frontend Developer ($90k-$130k, Remote)
- Data Scientist ($110k-$160k, New York)
- DevOps Engineer ($100k-$150k, Austin)
- Product Manager ($130k-$190k, Seattle)
- UX/UI Designer ($85k-$125k, Los Angeles)
- Backend Developer ($95k-$140k, Boston)
- Mobile App Developer ($90k-$135k, Chicago)
- QA Engineer ($75k-$110k, Denver)
- Security Engineer ($115k-$170k, Washington DC)
- Machine Learning Engineer ($125k-$185k, San Francisco)
- Technical Writer ($65k-$95k, Remote)

### Application Statuses
- **PENDING** - Awaiting review
- **REVIEWED** - Under consideration
- **ACCEPTED** - Offer extended
- **REJECTED** - Not selected

### Verification Request Statuses
- **PENDING** - Awaiting university response
- **APPROVED** - Credentials verified (includes blockchain hash)
- **REJECTED** - Could not verify (includes reason)

## Features

✅ **Realistic Data**
- Valid email formats
- Proper salary ranges
- Real company names and industries
- Authentic job descriptions
- Varied locations across US

✅ **Proper Relationships**
- Users → Profiles (Applicant/Employer/University)
- Employers → Jobs
- Jobs → Applications → Applicants
- Employers → Verification Requests → Universities

✅ **Safe Execution**
- Duplicate prevention for applications
- Idempotent (can run multiple times safely)
- Optional clear flag for fresh start

✅ **Timestamps**
- Backdated 1-60 days for realistic history
- Random distribution for variety

## Testing Workflows

### Test Applicant Flow
1. Login as `john.doe@email.com`
2. Browse jobs
3. View existing applications
4. Apply for new jobs

### Test Employer Flow
1. Login as `hr@techcorp.com`
2. View posted jobs
3. Review applications
4. Update application statuses
5. Request credential verifications

### Test University Flow
1. Login as `admin@stanford.edu`
2. View pending verification requests
3. Approve/reject requests
4. View verification history

## Troubleshooting

### "No module named 'app'"
Make sure you're in the backend directory:
```bash
cd backend
python seed_database.py
```

### "Database is locked"
Stop the Flask server before seeding:
```bash
# Stop Flask (Ctrl+C)
# Then run seed script
python seed_database.py
```

### "Table already exists"
This is normal if running without `--clear`. The script will add data to existing tables.

### Want fresh data?
```bash
python seed_database.py --clear
```

## Customization

Edit `seed_database.py` to customize:

```python
# Add more users
users_data = [
    {'email': 'new.user@email.com', 'password': 'password123', 'role': 'applicant', 'name': 'New User'},
    # ... more users
]

# Modify job data
jobs_data = [
    {
        'title': 'Your Job Title',
        'description': 'Job description...',
        'location': 'Your City',
        'salary_min': 80000,
        'salary_max': 120000,
        # ... more fields
    }
]

# Change number of applications
for _ in range(50):  # Create 50 instead of 25
    # ... application creation code
```

## Integration with Development

### Recommended Workflow
1. Develop features
2. Test with seeded data
3. Clear and reseed when needed
4. Use consistent test accounts

### Before Demo/Presentation
```bash
python seed_database.py --clear
```
This ensures clean, consistent data for demonstrations.

## All Test Accounts

### Applicants (8)
- john.doe@email.com - John Doe
- sarah.wilson@email.com - Sarah Wilson
- michael.chen@email.com - Michael Chen
- emily.brown@email.com - Emily Brown
- david.martinez@email.com - David Martinez
- lisa.anderson@email.com - Lisa Anderson
- james.taylor@email.com - James Taylor
- sophia.garcia@email.com - Sophia Garcia

### Employers (6)
- hr@techcorp.com - TechCorp Inc (Technology)
- jobs@innovatesoft.com - InnovateSoft (Software Development)
- careers@datastream.com - DataStream Analytics (Data Analytics)
- hiring@cloudnine.com - CloudNine Solutions (Cloud Computing)
- recruit@fintech.com - FinTech Global (Financial Services)
- talent@greentech.com - GreenTech Industries (Clean Energy)

### Universities (5)
- admin@stanford.edu - Stanford University (STAN001)
- registrar@mit.edu - MIT (MIT002)
- admin@berkeley.edu - UC Berkeley (UCB003)
- records@harvard.edu - Harvard University (HARV004)
- admin@caltech.edu - Caltech (CALT005)

---

**Need help?** Check `SEEDING_INSTRUCTIONS.md` for more details.
