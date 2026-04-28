# ─── Employer Routes ──────────────────────────────────────────────────────────
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.models import db, Job, VerificationRequest, Employer, JobApplication, Applicant, User
from utils.decorators import role_required

employer_bp = Blueprint('employer', __name__)

# ═══════════════════════════════════════════════════════════════════════════════
# JOB MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════

# ─── Create Job ───────────────────────────────────────────────────────────────
@employer_bp.route('/jobs', methods=['POST'])
@jwt_required()
@role_required('employer')
def create_job():
    data = request.get_json()
    user_id = int(get_jwt_identity())
    employer = Employer.query.filter_by(user_id=user_id).first()

    if not employer:
        return jsonify({"error": "Employer profile not found"}), 404

    # ─── Status validation (DRAFT / OPEN / CLOSED) ───────────────────────────
    status = data.get('status', 'OPEN')
    if status not in ['DRAFT', 'OPEN', 'CLOSED']:
        status = 'OPEN'

    new_job = Job(
        employer_id=employer.id,
        title=data.get('title'),
        description=data.get('description'),
        location=data.get('location'),
        salary_min=data.get('salary_min'),
        salary_max=data.get('salary_max'),
        job_type=data.get('job_type'),
        status=status,
        credential_required=data.get('credential_required', False),
        is_public=data.get('is_public', True),
        ai_matching=data.get('ai_matching', False),
        responsibilities=data.get('responsibilities'),
        req_education=data.get('req_education'),
        req_experience=data.get('req_experience'),
        req_tech_skills=data.get('req_tech_skills'),
        req_soft_skills=data.get('req_soft_skills'),
    )
    db.session.add(new_job)
    db.session.commit()
    return jsonify({"message": "Job created successfully", "job_id": new_job.id}), 201

# ─── Get All Jobs (for this employer) ────────────────────────────────────────
@employer_bp.route('/jobs', methods=['GET'])
@jwt_required()
@role_required('employer')
def get_my_jobs():
    user_id = int(get_jwt_identity())
    employer = Employer.query.filter_by(user_id=user_id).first()

    if not employer:
        return jsonify({"error": "Employer profile not found"}), 404

    jobs = Job.query.filter_by(employer_id=employer.id).all()
    output = []
    for job in jobs:
        output.append({
            "id": job.id,
            "title": job.title,
            "description": job.description,
            "location": job.location,
            "salary_min": job.salary_min,
            "salary_max": job.salary_max,
            "job_type": job.job_type,
            "status": job.status,
            "credential_required": job.credential_required,
            "is_public": job.is_public,
            "ai_matching": job.ai_matching,
            "responsibilities": job.responsibilities,
            "req_education": job.req_education,
            "req_experience": job.req_experience,
            "req_tech_skills": job.req_tech_skills,
            "req_soft_skills": job.req_soft_skills,
            "created_at": job.created_at.isoformat() if job.created_at else None,
            "updated_at": job.updated_at.isoformat() if job.updated_at else None
        })
    return jsonify(output), 200

# ─── Get Single Job ───────────────────────────────────────────────────────────
@employer_bp.route('/job/<int:job_id>', methods=['GET'])
@jwt_required()
@role_required('employer')
def get_job(job_id):
    user_id = int(get_jwt_identity())
    employer = Employer.query.filter_by(user_id=user_id).first()

    job = Job.query.filter_by(id=job_id, employer_id=employer.id).first()
    if not job:
        return jsonify({"error": "Job not found"}), 404

    return jsonify({
        "id": job.id,
        "title": job.title,
        "description": job.description,
        "location": job.location,
        "salary_min": job.salary_min,
        "salary_max": job.salary_max,
        "job_type": job.job_type,
        "status": job.status,
        "created_at": job.created_at.isoformat() if job.created_at else None,
        "updated_at": job.updated_at.isoformat() if job.updated_at else None
    }), 200

# ─── Update Job ───────────────────────────────────────────────────────────────
@employer_bp.route('/job/<int:job_id>', methods=['PUT'])
@jwt_required()
@role_required('employer')
def update_job(job_id):
    user_id = int(get_jwt_identity())
    employer = Employer.query.filter_by(user_id=user_id).first()

    job = Job.query.filter_by(id=job_id, employer_id=employer.id).first()
    if not job:
        return jsonify({"error": "Job not found"}), 404

    data = request.get_json()
    if 'title' in data:          job.title = data['title']
    if 'description' in data:    job.description = data['description']
    if 'location' in data:       job.location = data['location']
    if 'salary_min' in data:     job.salary_min = data['salary_min']
    if 'salary_max' in data:     job.salary_max = data['salary_max']
    if 'job_type' in data:       job.job_type = data['job_type']
    if 'status' in data:         job.status = data['status']
    if 'responsibilities' in data: job.responsibilities = data['responsibilities']
    if 'req_education' in data:  job.req_education = data['req_education']
    if 'req_experience' in data: job.req_experience = data['req_experience']
    if 'req_tech_skills' in data: job.req_tech_skills = data['req_tech_skills']
    if 'req_soft_skills' in data: job.req_soft_skills = data['req_soft_skills']

    db.session.commit()
    return jsonify({"message": "Job updated successfully"}), 200

# ─── Delete Job ───────────────────────────────────────────────────────────────
@employer_bp.route('/job/<int:job_id>', methods=['DELETE'])
@jwt_required()
@role_required('employer')
def delete_job(job_id):
    user_id = int(get_jwt_identity())
    employer = Employer.query.filter_by(user_id=user_id).first()

    job = Job.query.filter_by(id=job_id, employer_id=employer.id).first()
    if not job:
        return jsonify({"error": "Job not found"}), 404

    db.session.delete(job)
    db.session.commit()
    return jsonify({"message": "Job deleted successfully"}), 200

# ═══════════════════════════════════════════════════════════════════════════════
# JOB APPLICATIONS
# ═══════════════════════════════════════════════════════════════════════════════

# ─── Get Applications for a Job ───────────────────────────────────────────────
@employer_bp.route('/job/<int:job_id>/applications', methods=['GET'])
@jwt_required()
@role_required('employer')
def get_job_applications(job_id):
    user_id = int(get_jwt_identity())
    employer = Employer.query.filter_by(user_id=user_id).first()

    job = Job.query.filter_by(id=job_id, employer_id=employer.id).first()
    if not job:
        return jsonify({"error": "Job not found"}), 404

    applications = JobApplication.query.filter_by(job_id=job_id).all()
    output = []

    for app in applications:
        applicant = Applicant.query.get(app.applicant_id)
        user = User.query.get(applicant.user_id) if applicant else None
        
        # ─── Include resume information ───────────────────────────────────────
        resume_filename = None
        if applicant and applicant.resume_path:
            import os
            resume_filename = os.path.basename(applicant.resume_path)
        
        output.append({
            "id": app.id,
            "job_id": app.job_id,
            "applicant_id": app.applicant_id,
            "applicant_name": applicant.full_name if applicant else "Unknown",
            "applicant_email": user.email if user else "Unknown",
            "applicant_phone": applicant.phone if applicant else None,
            "resume_filename": resume_filename,
            "has_resume": bool(applicant and applicant.resume_path),
            "status": app.status,
            "cover_letter": app.cover_letter,
            "created_at": app.created_at.isoformat() if app.created_at else None
        })

    return jsonify(output), 200

# ─── Update Application Status ────────────────────────────────────────────────
@employer_bp.route('/application/<int:app_id>/status', methods=['PUT'])
@jwt_required()
@role_required('employer')
def update_application_status(app_id):
    user_id = int(get_jwt_identity())
    employer = Employer.query.filter_by(user_id=user_id).first()

    # ─── Join query to ensure employer owns this application's job ────────────
    application = JobApplication.query.join(Job).filter(
        JobApplication.id == app_id,
        Job.employer_id == employer.id
    ).first()

    if not application:
        return jsonify({"error": "Application not found"}), 404

    data = request.get_json()
    status = data.get('status')

    # ─── Status whitelist validation ──────────────────────────────────────────
    if status not in ['PENDING', 'REVIEWED', 'ACCEPTED', 'REJECTED']:
        return jsonify({"error": "Invalid status"}), 400

    application.status = status

    # ─── Notify applicant of status change ────────────────────────────────────
    try:
        from routes.notifications import create_notification
        applicant = Applicant.query.get(application.applicant_id)
        job = Job.query.get(application.job_id)
        if applicant and job:
            status_msg = {
                'ACCEPTED': ('Application Accepted 🎉', f'Congratulations! Your application for "{job.title}" has been accepted.', 'success'),
                'REJECTED': ('Application Update', f'Your application for "{job.title}" was not selected this time.', 'warning'),
                'REVIEWED': ('Application Reviewed', f'Your application for "{job.title}" is being reviewed.', 'info'),
            }.get(status)
            if status_msg:
                create_notification(applicant.user_id, status_msg[0], status_msg[1], status_msg[2])
    except Exception:
        pass

    db.session.commit()
    return jsonify({"message": f"Application status updated to {status}"}), 200

# ═══════════════════════════════════════════════════════════════════════════════
# CREDENTIAL VERIFICATION (BLOCKCHAIN-INSPIRED LOGIC)
# ═══════════════════════════════════════════════════════════════════════════════

# ─── Request Verification ─────────────────────────────────────────────────────
@employer_bp.route('/request-verification', methods=['POST'])
@jwt_required()
@role_required('employer')
def request_verification():
    from models.models import Certificate, University
    from utils.helpers import generate_hash, normalize_name

    data = request.get_json()
    user_id = int(get_jwt_identity())
    employer = Employer.query.filter_by(user_id=user_id).first()

    if not employer:
        return jsonify({"error": "Employer profile not found"}), 404

    university_id = data.get('university_id')
    student_name  = normalize_name(data.get('student_name') or '')
    degree        = (data.get('degree') or '').strip()
    year          = data.get('year')

    if not all([university_id, student_name, degree, year]):
        return jsonify({"error": "university_id, student_name, degree, and year are required"}), 400

    university = University.query.get(university_id)
    if not university:
        return jsonify({"error": "University not found"}), 404

    # ─── Step 1: Generate SHA-256 hash from employer's input ─────────────────
    candidate_hash = generate_hash(
        student_name,
        university.uni_name or 'University',
        degree,
        int(year)
    )

    # ─── Step 2: Look up hash in the certificate ledger ──────────────────────
    matched_cert = Certificate.query.filter_by(
        cert_hash=candidate_hash,
        university_id=university_id
    ).first()

    # ─── Step 3: Auto-verify if hash matches, else send for manual review ─────
    if matched_cert:
        status    = 'VERIFIED'
        cert_hash = candidate_hash
        message   = "Certificate verified automatically via blockchain hash match"
    else:
        status    = 'PENDING'
        cert_hash = None
        message   = "Certificate not found in blockchain ledger. Request sent to university for manual review."

    new_request = VerificationRequest(
        employer_id=employer.id,
        university_id=university_id,
        student_name=student_name,
        degree=degree,
        year=int(year),
        status=status,
        cert_hash=cert_hash
    )
    db.session.add(new_request)

    # ─── Notify relevant parties ──────────────────────────────────────────────
    try:
        from routes.notifications import create_notification
        if matched_cert:
            create_notification(employer.user_id, 'Certificate Verified ✅', f'"{student_name}" ({degree}, {year}) was automatically verified via blockchain.', 'success')
        else:
            create_notification(university.user_id, 'New Verification Request', f'{employer.company_name or "An employer"} requested verification for {student_name} ({degree}, {year}).', 'info')
            create_notification(employer.user_id, 'Verification Request Sent', f'Certificate for "{student_name}" not found in blockchain. Request sent to {university.uni_name} for manual review.', 'warning')
    except Exception:
        pass

    db.session.commit()

    return jsonify({
        "message": message,
        "status": status,
        "cert_hash": cert_hash,
        "auto_verified": matched_cert is not None
    }), 201

# ─── Get All Verification Requests (for this employer) ───────────────────────
@employer_bp.route('/verification-requests', methods=['GET'])
@jwt_required()
@role_required('employer')
def get_verification_requests():
    from models.models import University
    user_id = int(get_jwt_identity())
    employer = Employer.query.filter_by(user_id=user_id).first()

    if not employer:
        return jsonify({"error": "Employer profile not found"}), 404

    requests = VerificationRequest.query.filter_by(employer_id=employer.id).all()
    output = []

    for req in requests:
        university = University.query.get(req.university_id)
        output.append({
            "id": req.id,
            "student_name": req.student_name,
            "degree": req.degree,
            "year": req.year,
            "status": req.status,
            "cert_hash": req.cert_hash,
            "university_name": university.uni_name if university else "Unknown",
            "auto_verified": req.cert_hash is not None and req.status == 'VERIFIED',
            "created_at": req.created_at.isoformat() if req.created_at else None,
            "updated_at": req.updated_at.isoformat() if req.updated_at else None
        })

    return jsonify(output), 200

# ═══════════════════════════════════════════════════════════════════════════════
# EMPLOYER PROFILE
# ═══════════════════════════════════════════════════════════════════════════════

# ─── Get Profile ──────────────────────────────────────────────────────────────
@employer_bp.route('/profile', methods=['GET'])
@jwt_required()
@role_required('employer')
def get_employer_profile():
    user_id = int(get_jwt_identity())
    employer = Employer.query.filter_by(user_id=user_id).first()

    if not employer:
        return jsonify({"error": "Employer profile not found"}), 404

    # ─── Fetch email from User table ─────────────────────────────────────────
    user = User.query.get(user_id)

    return jsonify({
        "id": employer.id,
        "email": user.email if user else None,
        "company_name": employer.company_name,
        "company_email": employer.company_email,
        "phone": employer.phone,
        "industry": employer.industry,
        "created_at": employer.created_at.isoformat() if employer.created_at else None,
        "updated_at": employer.updated_at.isoformat() if employer.updated_at else None
    }), 200

# ─── Update Profile ───────────────────────────────────────────────────────────
@employer_bp.route('/profile', methods=['PUT'])
@jwt_required()
@role_required('employer')
def update_employer_profile():
    user_id = int(get_jwt_identity())
    employer = Employer.query.filter_by(user_id=user_id).first()

    if not employer:
        return jsonify({"error": "Employer profile not found"}), 404

    data = request.get_json()
    if 'company_name' in data:  employer.company_name = data['company_name']
    if 'company_email' in data: employer.company_email = data['company_email']
    if 'phone' in data:         employer.phone = data['phone']
    if 'industry' in data:      employer.industry = data['industry']

    db.session.commit()
    return jsonify({"message": "Employer profile updated successfully"}), 200

# ─── Get Universities List (for verification form dropdown) ───────────────────
@employer_bp.route('/universities', methods=['GET'])
@jwt_required()
@role_required('employer')
def get_universities():
    from models.models import University
    universities = University.query.all()
    output = []
    for uni in universities:
        output.append({
            "id": uni.id,
            "uni_name": uni.uni_name,
            "uni_code": uni.uni_code
        })
    return jsonify(output), 200

# ═══════════════════════════════════════════════════════════════════════════════
# RESUME ACCESS
# ═══════════════════════════════════════════════════════════════════════════════

# ─── View Applicant Resume ────────────────────────────────────────────────────
@employer_bp.route('/applicant/<int:applicant_id>/resume', methods=['GET'])
@jwt_required()
@role_required('employer')
def view_applicant_resume(applicant_id):
    from flask import send_file
    import os
    from flask import current_app
    
    user_id = int(get_jwt_identity())
    employer = Employer.query.filter_by(user_id=user_id).first()
    
    if not employer:
        return jsonify({"error": "Employer profile not found"}), 404
    
    # ─── Verify employer has access (applicant applied to one of their jobs) ──
    application_exists = JobApplication.query.join(Job).filter(
        JobApplication.applicant_id == applicant_id,
        Job.employer_id == employer.id
    ).first()
    
    if not application_exists:
        return jsonify({"error": "You don't have access to this applicant's resume"}), 403
    
    # ─── Get resume file ──────────────────────────────────────────────────────
    applicant = Applicant.query.get(applicant_id)
    if not applicant or not applicant.resume_path:
        return jsonify({"error": "Resume not found"}), 404
    
    file_path = applicant.resume_path
    if not os.path.isabs(file_path):
        file_path = os.path.join(current_app.root_path, file_path)
    
    if not os.path.exists(file_path):
        return jsonify({"error": "Resume file not found on server"}), 404
    
    return send_file(file_path, mimetype='application/pdf', as_attachment=False)
