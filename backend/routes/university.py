from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.models import db, VerificationRequest, University, User, Certificate
from utils.helpers import generate_hash
from utils.decorators import role_required
import csv
from io import StringIO, BytesIO
import openpyxl

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
            "note": "Not found in blockchain ledger — manual review required",
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
        # Try to find matching certificate in the ledger first
        cert = Certificate.query.filter_by(
            university_id=university.id,
            student_name=req.student_name,
            degree=req.degree,
            graduation_year=req.year
        ).first()

        if cert:
            cert_hash = cert.cert_hash  # Use the stored blockchain hash
        else:
            # Manually approved — generate hash as fallback
            cert_hash = generate_hash(
                req.student_name,
                university.uni_name or 'University',
                req.degree,
                req.year
            )

        req.status = 'VERIFIED'
        req.cert_hash = cert_hash
    else:
        req.status = 'REJECTED'
        req.rejection_reason = data.get('reason', 'No reason provided')

    db.session.commit()

    # Notify employer of the manual decision (non-critical)
    try:
        from routes.notifications import create_notification
        from models.models import Employer as EmpModel
        employer = EmpModel.query.get(req.employer_id)
        if employer:
            if req.status == 'VERIFIED':
                create_notification(employer.user_id, 'Certificate Verified ✅', f'"{req.student_name}" ({req.degree}, {req.year}) has been manually verified by {university.uni_name}.', 'success')
            else:
                create_notification(employer.user_id, 'Verification Rejected', f'"{req.student_name}" ({req.degree}, {req.year}) was rejected by {university.uni_name}.', 'warning')
        db.session.commit()
    except Exception:
        pass

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

# ── Certificate Management ──

@university_bp.route('/certificates', methods=['GET'])
@jwt_required()
@role_required('university')
def get_certificates():
    """Get all certificates issued by this university"""
    user_id = int(get_jwt_identity())
    university = University.query.filter_by(user_id=user_id).first()

    if not university:
        return jsonify({"error": "University profile not found"}), 404

    certs = Certificate.query.filter_by(university_id=university.id).all()
    
    output = []
    for cert in certs:
        output.append({
            "id": cert.id,
            "student_name": cert.student_name,
            "certificate_id": cert.certificate_id,
            "degree": cert.degree,
            "graduation_year": cert.graduation_year,
            "cert_hash": cert.cert_hash,
            "status": cert.status,
            "created_at": cert.created_at.isoformat() if cert.created_at else None
        })
    
    return jsonify(output), 200

@university_bp.route('/certificates', methods=['POST'])
@jwt_required()
@role_required('university')
def create_certificate():
    """Create a single certificate"""
    user_id = int(get_jwt_identity())
    university = University.query.filter_by(user_id=user_id).first()

    if not university:
        return jsonify({"error": "University profile not found"}), 404

    data = request.get_json()

    student_name = data.get('student_name', '').strip()
    degree = data.get('degree', '').strip()
    graduation_year = data.get('graduation_year')
    certificate_id = data.get('certificate_id', '').strip()

    if not student_name or not degree or not graduation_year:
        return jsonify({"error": "student_name, degree, and graduation_year are required"}), 400

    # Generate SHA-256 hash: name | university | degree | year | certificate_id
    cert_hash = generate_hash(
        student_name,
        university.uni_name or 'University',
        degree,
        int(graduation_year),
        certificate_id or None
    )

    # Check duplicate
    if Certificate.query.filter_by(cert_hash=cert_hash).first():
        return jsonify({"error": "A certificate with identical details already exists"}), 409

    cert = Certificate(
        university_id=university.id,
        student_name=student_name,
        certificate_id=certificate_id if certificate_id else None,
        degree=degree,
        graduation_year=int(graduation_year),
        cert_hash=cert_hash,
        status='VERIFIED'
    )
    
    db.session.add(cert)
    db.session.commit()
    
    return jsonify({
        "message": "Certificate created successfully",
        "cert_hash": cert_hash,
        "id": cert.id
    }), 201

@university_bp.route('/certificates/bulk', methods=['POST'])
@jwt_required()
@role_required('university')
def bulk_upload_certificates():
    """Bulk upload certificates from CSV or Excel"""
    user_id = int(get_jwt_identity())
    university = University.query.filter_by(user_id=user_id).first()

    if not university:
        return jsonify({"error": "University profile not found"}), 404

    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files['file']
    filename = file.filename.lower()
    
    if not (filename.endswith('.csv') or filename.endswith('.xlsx') or filename.endswith('.xls')):
        return jsonify({"error": "Only CSV and Excel files are supported"}), 400
    
    try:
        created_count = 0
        errors = []
        
        # Parse file based on type
        if filename.endswith('.csv'):
            # CSV parsing
            stream = StringIO(file.stream.read().decode("UTF8"), newline=None)
            csv_reader = csv.DictReader(stream)
            rows = list(csv_reader)
        else:
            # Excel parsing
            workbook = openpyxl.load_workbook(BytesIO(file.read()))
            sheet = workbook.active
            
            # Get headers from first row
            headers = [str(cell.value).strip() if cell.value else '' for cell in sheet[1]]
            
            # Validate headers
            required_headers = ['Student Name', 'Degree Program', 'Graduation Year']
            missing_headers = [h for h in required_headers if h not in headers]
            if missing_headers:
                return jsonify({
                    "error": f"Missing required columns: {', '.join(missing_headers)}. Expected: Student Name, Student ID, Degree Program, Graduation Year, Certificate Hash"
                }), 400
            
            # Get data rows
            rows = []
            for row in sheet.iter_rows(min_row=2, values_only=True):
                # Skip completely empty rows
                if all(cell is None or str(cell).strip() == '' for cell in row):
                    continue
                    
                row_dict = {}
                for i, header in enumerate(headers):
                    if i < len(row) and header:
                        row_dict[header] = row[i]
                rows.append(row_dict)
        
        if len(rows) == 0:
            return jsonify({"error": "No data rows found in file"}), 400
        
        # Process rows
        for row_num, row in enumerate(rows, start=2):
            try:
                student_name = str(row.get('Student Name', '') or '').strip()
                certificate_id = str(row.get('Certificate ID', '') or row.get('Student ID', '') or '').strip()
                degree = str(row.get('Degree Program', '') or '').strip()
                grad_year_raw = row.get('Graduation Year', '')
                
                # Handle graduation year
                if not grad_year_raw or str(grad_year_raw).strip() == '':
                    errors.append(f"Row {row_num}: Missing graduation year")
                    continue
                
                try:
                    grad_year = int(float(str(grad_year_raw)))
                except (ValueError, TypeError):
                    errors.append(f"Row {row_num}: Invalid graduation year '{grad_year_raw}' (must be a number)")
                    continue
                
                if not student_name:
                    errors.append(f"Row {row_num}: Missing Student Name")
                    continue
                    
                if not degree:
                    errors.append(f"Row {row_num}: Missing Degree Program")
                    continue
                
                # Generate SHA-256 hash: name | university | degree | year | certificate_id
                cert_hash = generate_hash(
                    student_name,
                    university.uni_name or 'University',
                    degree,
                    grad_year,
                    certificate_id or None
                )
                
                # Check if certificate already exists
                existing = Certificate.query.filter_by(cert_hash=cert_hash).first()
                if existing:
                    errors.append(f"Row {row_num}: Duplicate - {student_name} already has this certificate")
                    continue
                
                cert = Certificate(
                    university_id=university.id,
                    student_name=student_name,
                    certificate_id=certificate_id if certificate_id else None,
                    degree=degree,
                    graduation_year=grad_year,
                    cert_hash=cert_hash,
                    status='VERIFIED'
                )
                
                db.session.add(cert)
                created_count += 1
                
            except Exception as e:
                errors.append(f"Row {row_num}: {str(e)}")
        
        db.session.commit()
        
        return jsonify({
            "message": f"Bulk upload completed",
            "created": created_count,
            "errors": errors
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to process file: {str(e)}"}), 500

@university_bp.route('/certificates/<int:cert_id>', methods=['DELETE'])
@jwt_required()
@role_required('university')
def delete_certificate(cert_id):
    """Delete a certificate"""
    user_id = int(get_jwt_identity())
    university = University.query.filter_by(user_id=user_id).first()

    if not university:
        return jsonify({"error": "University profile not found"}), 404

    cert = Certificate.query.filter_by(id=cert_id, university_id=university.id).first()
    
    if not cert:
        return jsonify({"error": "Certificate not found"}), 404
    
    db.session.delete(cert)
    db.session.commit()
    
    return jsonify({"message": "Certificate deleted successfully"}), 200
