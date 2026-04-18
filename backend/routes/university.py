from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.models import db, VerificationRequest, University, User
from utils.helpers import generate_hash
from utils.decorators import role_required

university_bp = Blueprint('university_bp', __name__)

@university_bp.route('/profile', methods=['GET'])
@jwt_required()
@role_required('university')
def get_university_profile():
    user_id = int(get_jwt_identity())
    university = University.query.filter_by(user_id=user_id).first()

    if not university:
        return jsonify({"error": "University profile not found"}), 404

    return jsonify({
        "id": university.id,
        "uni_name": university.uni_name,
        "uni_email": university.uni_email,
        "uni_code": university.uni_code,
        "created_at": university.created_at.isoformat() if university.created_at else None,
        "updated_at": university.updated_at.isoformat() if university.updated_at else None
    }), 200

@university_bp.route('/profile', methods=['PUT'])
@jwt_required()
@role_required('university')
def update_university_profile():
    user_id = int(get_jwt_identity())
    university = University.query.filter_by(user_id=user_id).first()

    if not university:
        return jsonify({"error": "University profile not found"}), 404

    data = request.get_json()
    if 'uni_name' in data:
        university.uni_name = data['uni_name']
    if 'uni_email' in data:
        university.uni_email = data['uni_email']
    if 'uni_code' in data:
        university.uni_code = data['uni_code']

    db.session.commit()
    return jsonify({"message": "University profile updated successfully"}), 200

@university_bp.route('/verification-requests', methods=['GET'])
@jwt_required()
@role_required('university')
def get_pending_verification_requests():
    user_id = int(get_jwt_identity())
    university = University.query.filter_by(user_id=user_id).first()

    if not university:
        return jsonify({"error": "University profile not found"}), 404

    reqs = VerificationRequest.query.filter_by(
        university_id=university.id,
        status='PENDING'
    ).all()

    output = []
    for req in reqs:
        output.append({
            "id": req.id,
            "student_name": req.student_name,
            "degree": req.degree,
            "year": req.year,
            "status": req.status,
            "created_at": req.created_at.isoformat() if req.created_at else None
        })

    return jsonify(output), 200

@university_bp.route('/all-verification-requests', methods=['GET'])
@jwt_required()
@role_required('university')
def get_all_verification_requests():
    user_id = int(get_jwt_identity())
    university = University.query.filter_by(user_id=user_id).first()

    if not university:
        return jsonify({"error": "University profile not found"}), 404

    reqs = VerificationRequest.query.filter_by(university_id=university.id).all()

    output = []
    for req in reqs:
        output.append({
            "id": req.id,
            "student_name": req.student_name,
            "degree": req.degree,
            "year": req.year,
            "status": req.status,
            "cert_hash": req.cert_hash,
            "created_at": req.created_at.isoformat() if req.created_at else None,
            "updated_at": req.updated_at.isoformat() if req.updated_at else None
        })

    return jsonify(output), 200

@university_bp.route('/verify-request/<int:request_id>', methods=['POST'])
@jwt_required()
@role_required('university')
def verify_certificate(request_id):
    user_id = int(get_jwt_identity())
    university = University.query.filter_by(user_id=user_id).first()

    if not university:
        return jsonify({"error": "University profile not found"}), 404

    req = VerificationRequest.query.get_or_404(request_id)

    if req.university_id != university.id:
        return jsonify({"error": "Not authorized to process this request"}), 403

    data = request.get_json()
    status = data.get('status')

    if status not in ['VERIFIED', 'REJECTED']:
        return jsonify({"error": "Invalid status"}), 400

    if status == 'VERIFIED':
        cert_hash = generate_hash(req.student_name, university.uni_name or 'University', req.degree, req.year)
        req.status = 'VERIFIED'
        req.cert_hash = cert_hash
    else:
        req.status = 'REJECTED'
        req.rejection_reason = data.get('reason', 'No reason provided')

    db.session.commit()
    return jsonify({
        "message": "Verification processed",
        "status": req.status,
        "cert_hash": req.cert_hash
    }), 200

@university_bp.route('/certificate-verification/<cert_hash>', methods=['GET'])
def verify_certificate_by_hash(cert_hash):
    """Public endpoint to verify a certificate by its blockchain hash (no auth required)."""
    req = VerificationRequest.query.filter_by(cert_hash=cert_hash).first()

    if not req:
        return jsonify({"error": "Certificate not found"}), 404

    if req.status != 'VERIFIED':
        return jsonify({"error": "Certificate is not verified"}), 400

    # Look up the actual university name from the DB
    university = University.query.get(req.university_id)
    uni_name = university.uni_name if university else 'University'

    expected_hash = generate_hash(req.student_name, uni_name, req.degree, req.year)
    hash_valid = expected_hash == req.cert_hash

    if not hash_valid:
        return jsonify({"error": "Certificate hash is invalid (tampering detected)"}), 400

    return jsonify({
        "student_name": req.student_name,
        "degree": req.degree,
        "year": req.year,
        "cert_hash": req.cert_hash,
        "hash_valid": hash_valid,
        "issued_date": req.updated_at.isoformat() if req.updated_at else None,
        "message": "Certificate verified successfully"
    }), 200
