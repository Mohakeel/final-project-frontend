from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.models import db, Job, VerificationRequest, Employer, JobApplication, Applicant, User
from utils.decorators import role_required

employer_bp = Blueprint('employer', __name__)

# Job Management Routes
@employer_bp.route('/jobs', methods=['POST'])
@jwt_required()
@role_required('employer')
def create_job():
    data = request.get_json()
    user_id = int(get_jwt_identity())
    employer = Employer.query.filter_by(user_id=user_id).first()
    
    if not employer:
        return jsonify({"error": "Employer profile not found"}), 404
    
    new_job = Job(
        employer_id=employer.id,
        title=data.get('title'),
        description=data.get('description'),
        location=data.get('location'),
        salary_min=data.get('salary_min'),
        salary_max=data.get('salary_max'),
        job_type=data.get('job_type'),
        status='OPEN'
    )
    db.session.add(new_job)
    db.session.commit()
    return jsonify({"message": "Job posted successfully", "job_id": new_job.id}), 201

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
            "created_at": job.created_at.isoformat() if job.created_at else None,
            "updated_at": job.updated_at.isoformat() if job.updated_at else None
        })
    return jsonify(output), 200

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
    if 'title' in data:
        job.title = data['title']
    if 'description' in data:
        job.description = data['description']
    if 'location' in data:
        job.location = data['location']
    if 'salary_min' in data:
        job.salary_min = data['salary_min']
    if 'salary_max' in data:
        job.salary_max = data['salary_max']
    if 'job_type' in data:
        job.job_type = data['job_type']
    if 'status' in data:
        job.status = data['status']
    
    db.session.commit()
    return jsonify({"message": "Job updated successfully"}), 200

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

# Job Applications Routes
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
        output.append({
            "id": app.id,
            "job_id": app.job_id,
            "applicant_id": app.applicant_id,
            "applicant_name": applicant.full_name if applicant else "Unknown",
            "applicant_email": user.email if user else "Unknown",
            "status": app.status,
            "cover_letter": app.cover_letter,
            "created_at": app.created_at.isoformat() if app.created_at else None
        })
    
    return jsonify(output), 200

@employer_bp.route('/application/<int:app_id>/status', methods=['PUT'])
@jwt_required()
@role_required('employer')
def update_application_status(app_id):
    user_id = int(get_jwt_identity())
    employer = Employer.query.filter_by(user_id=user_id).first()
    
    application = JobApplication.query.join(Job).filter(
        JobApplication.id == app_id,
        Job.employer_id == employer.id
    ).first()
    
    if not application:
        return jsonify({"error": "Application not found"}), 404
    
    data = request.get_json()
    status = data.get('status')
    
    if status not in ['PENDING', 'REVIEWED', 'ACCEPTED', 'REJECTED']:
        return jsonify({"error": "Invalid status"}), 400
    
    application.status = status
    db.session.commit()
    
    return jsonify({"message": f"Application status updated to {status}"}), 200

# Verification Routes
@employer_bp.route('/request-verification', methods=['POST'])
@jwt_required()
@role_required('employer')
def request_verification():
    data = request.get_json()
    user_id = int(get_jwt_identity())
    employer = Employer.query.filter_by(user_id=user_id).first()
    
    if not employer:
        return jsonify({"error": "Employer profile not found"}), 404
    
    new_request = VerificationRequest(
        employer_id=employer.id,
        university_id=data['university_id'],
        student_name=data['student_name'],
        degree=data['degree'],
        year=data['year'],
        status='PENDING'
    )
    db.session.add(new_request)
    db.session.commit()
    return jsonify({"message": "Verification request sent to University"}), 201

@employer_bp.route('/verification-requests', methods=['GET'])
@jwt_required()
@role_required('employer')
def get_verification_requests():
    user_id = int(get_jwt_identity())
    employer = Employer.query.filter_by(user_id=user_id).first()
    
    if not employer:
        return jsonify({"error": "Employer profile not found"}), 404
    
    requests = VerificationRequest.query.filter_by(employer_id=employer.id).all()
    output = []
    
    for req in requests:
        output.append({
            "id": req.id,
            "student_name": req.student_name,
            "degree": req.degree,
            "year": req.year,
            "status": req.status,
            "cert_hash": req.cert_hash,
            "created_at": req.created_at.isoformat() if req.created_at else None
        })
    
    return jsonify(output), 200

# Employer Profile Routes
@employer_bp.route('/profile', methods=['GET'])
@jwt_required()
@role_required('employer')
def get_employer_profile():
    user_id = int(get_jwt_identity())
    employer = Employer.query.filter_by(user_id=user_id).first()
    
    if not employer:
        return jsonify({"error": "Employer profile not found"}), 404
    
    return jsonify({
        "id": employer.id,
        "company_name": employer.company_name,
        "company_email": employer.company_email,
        "industry": employer.industry,
        "created_at": employer.created_at.isoformat() if employer.created_at else None,
        "updated_at": employer.updated_at.isoformat() if employer.updated_at else None
    }), 200

@employer_bp.route('/profile', methods=['PUT'])
@jwt_required()
@role_required('employer')
def update_employer_profile():
    user_id = int(get_jwt_identity())
    employer = Employer.query.filter_by(user_id=user_id).first()
    
    if not employer:
        return jsonify({"error": "Employer profile not found"}), 404
    
    data = request.get_json()
    if 'company_name' in data:
        employer.company_name = data['company_name']
    if 'company_email' in data:
        employer.company_email = data['company_email']
    if 'industry' in data:
        employer.industry = data['industry']
    
    db.session.commit()
    return jsonify({"message": "Employer profile updated successfully"}), 200