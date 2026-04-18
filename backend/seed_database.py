"""
Database Seeding Script for CertiVerify
Creates realistic dummy data for testing and development
"""

from app import create_app
from models.models import db, User, Applicant, Employer, University, Job, JobApplication, VerificationRequest
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta
import random

# Create Flask app instance
app = create_app()

def clear_database():
    """Clear all data from the database"""
    print("🗑️  Clearing existing data...")
    with app.app_context():
        db.drop_all()
        db.create_all()
    print("✅ Database cleared and recreated")

def seed_users():
    """Create users for all roles"""
    print("\n👥 Seeding Users...")
    
    users_data = [
        # Applicants
        {'email': 'john.doe@email.com', 'password': 'password123', 'role': 'applicant', 'name': 'John Doe'},
        {'email': 'sarah.wilson@email.com', 'password': 'password123', 'role': 'applicant', 'name': 'Sarah Wilson'},
        {'email': 'michael.chen@email.com', 'password': 'password123', 'role': 'applicant', 'name': 'Michael Chen'},
        {'email': 'emily.brown@email.com', 'password': 'password123', 'role': 'applicant', 'name': 'Emily Brown'},
        {'email': 'david.martinez@email.com', 'password': 'password123', 'role': 'applicant', 'name': 'David Martinez'},
        {'email': 'lisa.anderson@email.com', 'password': 'password123', 'role': 'applicant', 'name': 'Lisa Anderson'},
        {'email': 'james.taylor@email.com', 'password': 'password123', 'role': 'applicant', 'name': 'James Taylor'},
        {'email': 'sophia.garcia@email.com', 'password': 'password123', 'role': 'applicant', 'name': 'Sophia Garcia'},
        
        # Employers
        {'email': 'hr@techcorp.com', 'password': 'password123', 'role': 'employer', 'name': 'TechCorp Inc'},
        {'email': 'jobs@innovatesoft.com', 'password': 'password123', 'role': 'employer', 'name': 'InnovateSoft'},
        {'email': 'careers@datastream.com', 'password': 'password123', 'role': 'employer', 'name': 'DataStream Analytics'},
        {'email': 'hiring@cloudnine.com', 'password': 'password123', 'role': 'employer', 'name': 'CloudNine Solutions'},
        {'email': 'recruit@fintech.com', 'password': 'password123', 'role': 'employer', 'name': 'FinTech Global'},
        {'email': 'talent@greentech.com', 'password': 'password123', 'role': 'employer', 'name': 'GreenTech Industries'},
        
        # Universities
        {'email': 'admin@stanford.edu', 'password': 'password123', 'role': 'university', 'name': 'Stanford University'},
        {'email': 'registrar@mit.edu', 'password': 'password123', 'role': 'university', 'name': 'MIT'},
        {'email': 'admin@berkeley.edu', 'password': 'password123', 'role': 'university', 'name': 'UC Berkeley'},
        {'email': 'records@harvard.edu', 'password': 'password123', 'role': 'university', 'name': 'Harvard University'},
        {'email': 'admin@caltech.edu', 'password': 'password123', 'role': 'university', 'name': 'Caltech'},
    ]
    
    users = []
    for data in users_data:
        user = User(
            email=data['email'],
            password=generate_password_hash(data['password']),
            role=data['role']
        )
        db.session.add(user)
        users.append({'user': user, 'name': data['name'], 'role': data['role']})
    
    db.session.commit()
    print(f"✅ Created {len(users)} users")
    return users

def seed_applicants(users):
    """Create applicant profiles"""
    print("\n📝 Seeding Applicants...")
    
    applicant_users = [u for u in users if u['role'] == 'applicant']
    phones = ['555-0101', '555-0102', '555-0103', '555-0104', '555-0105', '555-0106', '555-0107', '555-0108']
    
    applicants = []
    for i, user_data in enumerate(applicant_users):
        applicant = Applicant(
            user_id=user_data['user'].id,
            full_name=user_data['name'],
            phone=phones[i],
            email_verified=random.choice([True, False]),
            resume_path=f'uploads/resumes/resume_{i+1}.pdf' if random.random() > 0.3 else None
        )
        db.session.add(applicant)
        applicants.append(applicant)
    
    db.session.commit()
    print(f"✅ Created {len(applicants)} applicant profiles")
    return applicants

def seed_employers(users):
    """Create employer profiles"""
    print("\n🏢 Seeding Employers...")
    
    employer_users = [u for u in users if u['role'] == 'employer']
    industries = ['Technology', 'Software Development', 'Data Analytics', 'Cloud Computing', 'Financial Services', 'Clean Energy']
    
    employers = []
    for i, user_data in enumerate(employer_users):
        employer = Employer(
            user_id=user_data['user'].id,
            company_name=user_data['name'],
            company_email=user_data['user'].email,
            industry=industries[i % len(industries)]
        )
        db.session.add(employer)
        employers.append(employer)
    
    db.session.commit()
    print(f"✅ Created {len(employers)} employer profiles")
    return employers

def seed_universities(users):
    """Create university profiles"""
    print("\n🎓 Seeding Universities...")
    
    university_users = [u for u in users if u['role'] == 'university']
    uni_codes = ['STAN001', 'MIT002', 'UCB003', 'HARV004', 'CALT005']
    
    universities = []
    for i, user_data in enumerate(university_users):
        university = University(
            user_id=user_data['user'].id,
            uni_name=user_data['name'],
            uni_email=user_data['user'].email,
            uni_code=uni_codes[i]
        )
        db.session.add(university)
        universities.append(university)
    
    db.session.commit()
    print(f"✅ Created {len(universities)} university profiles")
    return universities

def seed_jobs(employers):
    """Create job postings"""
    print("\n💼 Seeding Jobs...")
    
    jobs_data = [
        {
            'title': 'Senior Software Engineer',
            'description': 'We are seeking an experienced software engineer to join our team. You will work on cutting-edge technologies and lead development of scalable applications. Requirements: 5+ years experience, proficiency in Python/Java, strong problem-solving skills.',
            'location': 'San Francisco, CA',
            'salary_min': 120000,
            'salary_max': 180000,
            'job_type': 'Full-time',
            'status': 'OPEN'
        },
        {
            'title': 'Frontend Developer',
            'description': 'Join our dynamic team to build beautiful, responsive web applications. Work with React, Vue, and modern CSS frameworks. Requirements: 3+ years frontend experience, strong JavaScript skills, eye for design.',
            'location': 'Remote',
            'salary_min': 90000,
            'salary_max': 130000,
            'job_type': 'Full-time',
            'status': 'OPEN'
        },
        {
            'title': 'Data Scientist',
            'description': 'Analyze complex datasets and build machine learning models to drive business insights. Requirements: MS/PhD in related field, Python, R, SQL, experience with ML frameworks.',
            'location': 'New York, NY',
            'salary_min': 110000,
            'salary_max': 160000,
            'job_type': 'Full-time',
            'status': 'OPEN'
        },
        {
            'title': 'DevOps Engineer',
            'description': 'Manage cloud infrastructure and CI/CD pipelines. Work with AWS, Docker, Kubernetes. Requirements: 4+ years DevOps experience, strong scripting skills, cloud certifications preferred.',
            'location': 'Austin, TX',
            'salary_min': 100000,
            'salary_max': 150000,
            'job_type': 'Full-time',
            'status': 'OPEN'
        },
        {
            'title': 'Product Manager',
            'description': 'Lead product strategy and roadmap for our flagship products. Work cross-functionally with engineering, design, and marketing teams. Requirements: 5+ years PM experience, technical background, excellent communication.',
            'location': 'Seattle, WA',
            'salary_min': 130000,
            'salary_max': 190000,
            'job_type': 'Full-time',
            'status': 'OPEN'
        },
        {
            'title': 'UX/UI Designer',
            'description': 'Create intuitive and beautiful user experiences. Conduct user research, create wireframes and prototypes. Requirements: 3+ years design experience, proficiency in Figma/Sketch, portfolio required.',
            'location': 'Los Angeles, CA',
            'salary_min': 85000,
            'salary_max': 125000,
            'job_type': 'Full-time',
            'status': 'OPEN'
        },
        {
            'title': 'Backend Developer',
            'description': 'Build robust APIs and microservices. Work with Node.js, Python, databases. Requirements: 4+ years backend experience, RESTful API design, database optimization skills.',
            'location': 'Boston, MA',
            'salary_min': 95000,
            'salary_max': 140000,
            'job_type': 'Full-time',
            'status': 'OPEN'
        },
        {
            'title': 'Mobile App Developer',
            'description': 'Develop native iOS and Android applications. Requirements: 3+ years mobile development, Swift/Kotlin, experience with React Native or Flutter a plus.',
            'location': 'Chicago, IL',
            'salary_min': 90000,
            'salary_max': 135000,
            'job_type': 'Full-time',
            'status': 'OPEN'
        },
        {
            'title': 'QA Engineer',
            'description': 'Ensure software quality through comprehensive testing. Develop automated test suites. Requirements: 3+ years QA experience, test automation frameworks, attention to detail.',
            'location': 'Denver, CO',
            'salary_min': 75000,
            'salary_max': 110000,
            'job_type': 'Full-time',
            'status': 'OPEN'
        },
        {
            'title': 'Security Engineer',
            'description': 'Protect our systems and data. Conduct security audits, implement security best practices. Requirements: 4+ years security experience, certifications (CISSP, CEH), penetration testing skills.',
            'location': 'Washington, DC',
            'salary_min': 115000,
            'salary_max': 170000,
            'job_type': 'Full-time',
            'status': 'OPEN'
        },
        {
            'title': 'Machine Learning Engineer',
            'description': 'Build and deploy ML models at scale. Work with TensorFlow, PyTorch. Requirements: MS in CS/related field, 3+ years ML experience, strong Python skills.',
            'location': 'San Francisco, CA',
            'salary_min': 125000,
            'salary_max': 185000,
            'job_type': 'Full-time',
            'status': 'OPEN'
        },
        {
            'title': 'Technical Writer',
            'description': 'Create clear, comprehensive technical documentation. Requirements: 2+ years technical writing, ability to understand complex systems, excellent writing skills.',
            'location': 'Remote',
            'salary_min': 65000,
            'salary_max': 95000,
            'job_type': 'Contract',
            'status': 'OPEN'
        },
    ]
    
    jobs = []
    for i, job_data in enumerate(jobs_data):
        employer = employers[i % len(employers)]
        job = Job(
            employer_id=employer.id,
            **job_data,
            created_at=datetime.utcnow() - timedelta(days=random.randint(1, 30))
        )
        db.session.add(job)
        jobs.append(job)
    
    db.session.commit()
    print(f"✅ Created {len(jobs)} job postings")
    return jobs

def seed_applications(jobs, applicants):
    """Create job applications"""
    print("\n📨 Seeding Job Applications...")
    
    cover_letters = [
        "I am excited to apply for this position. With my extensive experience and passion for technology, I believe I would be a great fit for your team.",
        "I have been following your company for years and am impressed by your innovative approach. I would love to contribute my skills to your mission.",
        "My background in software development and proven track record of delivering high-quality solutions make me an ideal candidate for this role.",
        "I am particularly drawn to this opportunity because it aligns perfectly with my career goals and expertise in the field.",
        "With my strong technical skills and collaborative mindset, I am confident I can make valuable contributions to your team.",
        "I am eager to bring my experience and enthusiasm to this role and help drive your company's success.",
        "This position represents an exciting opportunity to apply my skills in a challenging and rewarding environment.",
        "I believe my unique combination of technical expertise and creative problem-solving would be an asset to your organization.",
    ]
    
    statuses = ['PENDING', 'REVIEWED', 'ACCEPTED', 'REJECTED']
    applications = []
    
    # Create 20-30 applications with varied statuses
    for _ in range(25):
        job = random.choice(jobs)
        applicant = random.choice(applicants)
        
        # Check if this applicant already applied to this job
        existing = JobApplication.query.filter_by(job_id=job.id, applicant_id=applicant.id).first()
        if existing:
            continue
        
        application = JobApplication(
            job_id=job.id,
            applicant_id=applicant.id,
            status=random.choice(statuses),
            cover_letter=random.choice(cover_letters),
            created_at=datetime.utcnow() - timedelta(days=random.randint(1, 20))
        )
        db.session.add(application)
        applications.append(application)
    
    db.session.commit()
    print(f"✅ Created {len(applications)} job applications")
    return applications

def seed_verification_requests(employers, universities):
    """Create verification requests"""
    print("\n🔍 Seeding Verification Requests...")
    
    students = [
        'Alexander Thompson', 'Emma Rodriguez', 'Oliver Johnson', 'Ava Williams',
        'William Davis', 'Isabella Martinez', 'James Anderson', 'Sophia Taylor',
        'Benjamin Wilson', 'Mia Moore', 'Lucas Jackson', 'Charlotte White'
    ]
    
    degrees = [
        'Bachelor of Science in Computer Science',
        'Master of Science in Data Science',
        'Bachelor of Engineering in Software Engineering',
        'Master of Business Administration',
        'Bachelor of Science in Information Technology',
        'Master of Science in Artificial Intelligence',
        'Bachelor of Arts in Digital Media',
        'Master of Science in Cybersecurity'
    ]
    
    statuses = ['PENDING', 'APPROVED', 'REJECTED']
    rejection_reasons = [
        'Student records not found in our database',
        'Graduation year does not match our records',
        'Degree information is incorrect',
        None, None, None  # Most approved requests have no rejection reason
    ]
    
    requests = []
    for i in range(15):
        employer = random.choice(employers)
        university = random.choice(universities)
        status = random.choice(statuses)
        
        request = VerificationRequest(
            employer_id=employer.id,
            university_id=university.id,
            student_name=random.choice(students),
            degree=random.choice(degrees),
            year=random.randint(2018, 2024),
            status=status,
            cert_hash=f'0x{random.randbytes(32).hex()}' if status == 'APPROVED' else None,
            rejection_reason=random.choice(rejection_reasons) if status == 'REJECTED' else None,
            created_at=datetime.utcnow() - timedelta(days=random.randint(1, 60))
        )
        db.session.add(request)
        requests.append(request)
    
    db.session.commit()
    print(f"✅ Created {len(requests)} verification requests")
    return requests

def seed_all():
    """Run all seeding functions"""
    print("\n" + "="*60)
    print("🌱 Starting Database Seeding for CertiVerify")
    print("="*60)
    
    with app.app_context():
        # Seed in order of dependencies
        users = seed_users()
        applicants = seed_applicants(users)
        employers = seed_employers(users)
        universities = seed_universities(users)
        jobs = seed_jobs(employers)
        applications = seed_applications(jobs, applicants)
        requests = seed_verification_requests(employers, universities)
        
        print("\n" + "="*60)
        print("✨ Database Seeding Complete!")
        print("="*60)
        print("\n📊 Summary:")
        print(f"   • {len([u for u in users if u['role'] == 'applicant'])} Applicants")
        print(f"   • {len([u for u in users if u['role'] == 'employer'])} Employers")
        print(f"   • {len([u for u in users if u['role'] == 'university'])} Universities")
        print(f"   • {len(jobs)} Job Postings")
        print(f"   • {len(applications)} Job Applications")
        print(f"   • {len(requests)} Verification Requests")
        print("\n🔑 Test Credentials (password: password123):")
        print("   Applicant: john.doe@email.com")
        print("   Employer:  hr@techcorp.com")
        print("   University: admin@stanford.edu")
        print("="*60 + "\n")

if __name__ == '__main__':
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == '--clear':
        clear_database()
    
    seed_all()
