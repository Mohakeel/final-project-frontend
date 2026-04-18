import os
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.models import db, Applicant, Job, JobApplication
from utils.decorators import role_required
from werkzeug.utils import secure_filename

applicant_bp = Blueprint('applicant', __name__)

@applicant_bp.route('/profile', methods=['GET'])
@jwt_required()
@role_required('applicant')
def get_profile():
    user_id = int(get_jwt_identity())
    applicant = Applicant.query.filter_by(user_id=user_id).first()
    
    if not applicant:
        return jsonify({"error": "Applicant profile not found"}), 404
    
    return jsonify({
        "id": applicant.id,
        "full_name": applicant.full_name,
        "phone": applicant.phone,
        "resume_path": applicant.resume_path,
        "email_verified": applicant.email_verified,
        "created_at": applicant.created_at.isoformat() if applicant.created_at else None,
        "updated_at": applicant.updated_at.isoformat() if applicant.updated_at else None
    }), 200

@applicant_bp.route('/profile', methods=['PUT'])
@jwt_required()
@role_required('applicant')
def update_profile():
    user_id = int(get_jwt_identity())
    applicant = Applicant.query.filter_by(user_id=user_id).first()
    
    if not applicant:
        return jsonify({"error": "Applicant profile not found"}), 404
    
    data = request.get_json()
    if 'full_name' in data:
        applicant.full_name = data['full_name']
    if 'phone' in data:
        applicant.phone = data['phone']
    
    db.session.commit()
    return jsonify({"message": "Profile updated successfully"}), 200

@applicant_bp.route('/upload-resume', methods=['POST'])
@jwt_required()
@role_required('applicant')
def upload_resume():
    if 'resume' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['resume']
    user_id = int(get_jwt_identity())
    applicant = Applicant.query.filter_by(user_id=user_id).first()
    
    if not applicant:
        return jsonify({"error": "Applicant not found"}), 404
    
    if file:
        filename = secure_filename(f"user_{user_id}_{file.filename}")
        upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads/resumes')
        if not os.path.isabs(upload_folder):
            upload_folder = os.path.join(current_app.root_path, upload_folder)
        os.makedirs(upload_folder, exist_ok=True)

        file_path = os.path.join(upload_folder, filename)
        file.save(file_path)
        
        applicant.resume_path = file_path
        db.session.commit()
        return jsonify({"message": "Resume uploaded successfully", "path": file_path}), 200
    
    return jsonify({"error": "Failed to upload resume"}), 400

@applicant_bp.route('/resume', methods=['PUT'])
@jwt_required()
@role_required('applicant')
def update_resume():
    if 'resume' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    user_id = int(get_jwt_identity())
    applicant = Applicant.query.filter_by(user_id=user_id).first()
    
    if not applicant:
        return jsonify({"error": "Applicant not found"}), 404
    
    # Delete old resume if it exists
    if applicant.resume_path and os.path.exists(applicant.resume_path):
        try:
            os.remove(applicant.resume_path)
        except Exception:
            pass
    
    file = request.files['resume']
    if file:
        filename = secure_filename(f"user_{user_id}_{file.filename}")
        upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads/resumes')
        if not os.path.isabs(upload_folder):
            upload_folder = os.path.join(current_app.root_path, upload_folder)
        os.makedirs(upload_folder, exist_ok=True)

        file_path = os.path.join(upload_folder, filename)
        file.save(file_path)
        
        applicant.resume_path = file_path
        db.session.commit()
        return jsonify({"message": "Resume updated successfully", "path": file_path}), 200
    
    return jsonify({"error": "Failed to update resume"}), 400

@applicant_bp.route('/resume', methods=['DELETE'])
@jwt_required()
@role_required('applicant')
def delete_resume():
    user_id = int(get_jwt_identity())
    applicant = Applicant.query.filter_by(user_id=user_id).first()
    
    if not applicant:
        return jsonify({"error": "Applicant not found"}), 404
    
    if not applicant.resume_path:
        return jsonify({"error": "No resume to delete"}), 400
    
    # Delete file from system
    try:
        if os.path.exists(applicant.resume_path):
            os.remove(applicant.resume_path)
    except Exception:
        pass
    
    applicant.resume_path = None
    db.session.commit()
    return jsonify({"message": "Resume deleted successfully"}), 200

@applicant_bp.route('/view-jobs', methods=['GET'])
@jwt_required()
def get_jobs():
    jobs = Job.query.filter_by(status='OPEN').all()
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
            "created_at": job.created_at.isoformat() if job.created_at else None
        })
    return jsonify(output), 200

@applicant_bp.route('/job/<int:job_id>', methods=['GET'])
@jwt_required()
def get_job_detail(job_id):
    job = Job.query.get_or_404(job_id)
    
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

@applicant_bp.route('/apply-job/<int:job_id>', methods=['POST'])
@jwt_required()
@role_required('applicant')
def apply_for_job(job_id):
    user_id = int(get_jwt_identity())
    applicant = Applicant.query.filter_by(user_id=user_id).first()
    
    if not applicant:
        return jsonify({"error": "Applicant not found"}), 404
    
    job = Job.query.get_or_404(job_id)
    
    # Check if already applied
    existing_application = JobApplication.query.filter_by(
        job_id=job_id, 
        applicant_id=applicant.id
    ).first()
    
    if existing_application:
        return jsonify({"error": "Already applied for this job"}), 400
    
    data = request.get_json()
    application = JobApplication(
        job_id=job_id,
        applicant_id=applicant.id,
        cover_letter=data.get('cover_letter', '')
    )
    
    db.session.add(application)
    db.session.commit()
    
    return jsonify({"message": "Application submitted successfully", "application_id": application.id}), 201

@applicant_bp.route('/applications', methods=['GET'])
@jwt_required()
@role_required('applicant')
def get_my_applications():
    user_id = int(get_jwt_identity())
    applicant = Applicant.query.filter_by(user_id=user_id).first()
    
    if not applicant:
        return jsonify({"error": "Applicant not found"}), 404
    
    applications = JobApplication.query.filter_by(applicant_id=applicant.id).all()
    output = []
    
    for app in applications:
        job = Job.query.get(app.job_id)
        output.append({
            "id": app.id,
            "job_id": app.job_id,
            "job_title": job.title if job else "Unknown",
            "status": app.status,
            "cover_letter": app.cover_letter,
            "created_at": app.created_at.isoformat() if app.created_at else None
        })
    
    return jsonify(output), 200

@applicant_bp.route('/application/<int:app_id>', methods=['DELETE'])
@jwt_required()
@role_required('applicant')
def withdraw_application(app_id):
    user_id = int(get_jwt_identity())
    applicant = Applicant.query.filter_by(user_id=user_id).first()
    
    if not applicant:
        return jsonify({"error": "Applicant not found"}), 404
    
    application = JobApplication.query.filter_by(id=app_id, applicant_id=applicant.id).first()
    
    if not application:
        return jsonify({"error": "Application not found"}), 404
    
    db.session.delete(application)
    db.session.commit()
    
    return jsonify({"message": "Application withdrawn successfully"}), 200