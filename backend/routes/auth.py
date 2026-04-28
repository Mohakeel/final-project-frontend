# ─── Authentication Routes ────────────────────────────────────────────────────
from flask import Blueprint, request, jsonify, current_app, send_file
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt, get_jwt_identity
from models.models import db, User, Applicant, Employer, University, TokenBlocklist
from werkzeug.utils import secure_filename
import os
import random
import string

auth_bp = Blueprint('auth', __name__)

# ─── Generate Unique University Code ──────────────────────────────────────────
def generate_university_code():
    """Generate a unique 6-character alphanumeric university code (e.g., UNI-A3F9C2)"""
    while True:
        # Generate format: UNI-XXXXXX (6 random alphanumeric characters)
        code = 'UNI-' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        
        # Check if code already exists
        if not University.query.filter_by(uni_code=code).first():
            return code

# ─── Register ─────────────────────────────────────────────────────────────────
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json

    # ─── Duplicate email check ────────────────────────────────────────────────
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"msg": "Email already registered"}), 400

    # ─── Password hashing + base user creation ────────────────────────────────
    hashed_pw = generate_password_hash(data['password'])
    user = User(email=data['email'], password=hashed_pw, role=data['role'])
    db.session.add(user)
    db.session.commit()

    # ─── Role-based sub-profile creation ─────────────────────────────────────
    mobile = data.get('mobile')
    
    if data['role'] == 'applicant':
        db.session.add(Applicant(
            user_id=user.id, 
            full_name=data.get('name'),
            phone=mobile
        ))
    elif data['role'] == 'employer':
        db.session.add(Employer(
            user_id=user.id, 
            company_name=data.get('name'),
            phone=mobile
        ))
    elif data['role'] == 'university':
        # ─── Use provided uni_code or auto-generate ──────────────────────────
        uni_code = data.get('uni_code', '').strip()
        if not uni_code:
            uni_code = generate_university_code()
        else:
            # Check if provided code already exists
            if University.query.filter_by(uni_code=uni_code).first():
                return jsonify({"msg": "University code already exists"}), 400
        
        db.session.add(University(
            user_id=user.id, 
            uni_name=data.get('name'),
            uni_code=uni_code,
            phone=mobile
        ))

    db.session.commit()

    # ─── JWT token generation on register ────────────────────────────────────
    token = create_access_token(identity=str(user.id), additional_claims={"role": user.role})

    return jsonify({
        "msg": "Registered successfully",
        "access_token": token,
        "role": user.role,
        "name": data.get('name')
    }), 201

# ─── Login ────────────────────────────────────────────────────────────────────
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(email=data['email']).first()

    if user and check_password_hash(user.password, data['password']):
        # ─── Fetch display name from role-specific profile ────────────────────
        name = None
        if user.role == 'applicant':
            profile = Applicant.query.filter_by(user_id=user.id).first()
            name = profile.full_name if profile else None
        elif user.role == 'employer':
            profile = Employer.query.filter_by(user_id=user.id).first()
            name = profile.company_name if profile else None
        elif user.role == 'university':
            profile = University.query.filter_by(user_id=user.id).first()
            name = profile.uni_name if profile else None

        # ─── Issue JWT with role embedded ─────────────────────────────────────
        token = create_access_token(identity=str(user.id), additional_claims={"role": user.role})
        return jsonify(access_token=token, role=user.role, name=name), 200

    return jsonify({"msg": "Bad credentials"}), 401

# ─── Logout / Token Revocation ────────────────────────────────────────────────
@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    jti = get_jwt().get('jti')
    if not jti:
        return jsonify({"msg": "Invalid token"}), 400

    try:
        # ─── Add token JTI to blocklist to invalidate it ──────────────────────
        db.session.add(TokenBlocklist(jti=jti))
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"msg": "Failed to revoke token"}), 500

    return jsonify({"msg": "Successfully logged out"}), 200

# ─── Avatar Upload ────────────────────────────────────────────────────────────
@auth_bp.route('/avatar', methods=['POST'])
@jwt_required()
def upload_avatar():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    if 'avatar' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files['avatar']
    # ─── File type validation ─────────────────────────────────────────────────
    ext = file.filename.rsplit('.', 1)[-1].lower()
    if ext not in ['jpg', 'jpeg', 'png', 'webp', 'gif']:
        return jsonify({"error": "Only image files are allowed (jpg, png, webp)"}), 400

    avatar_folder = os.path.join(current_app.root_path, 'uploads', 'avatars')
    os.makedirs(avatar_folder, exist_ok=True)

    filename = secure_filename(f"avatar_{user_id}.{ext}")
    file_path = os.path.join(avatar_folder, filename)
    file.save(file_path)

    user.avatar_path = file_path
    db.session.commit()

    return jsonify({"message": "Avatar uploaded", "avatar_url": f"/auth/avatar/{user_id}"}), 200

# ─── Avatar Serve ─────────────────────────────────────────────────────────────
@auth_bp.route('/avatar/<int:user_id>', methods=['GET'])
def get_avatar(user_id):
    user = User.query.get(user_id)
    if not user or not user.avatar_path or not os.path.exists(user.avatar_path):
        return jsonify({"error": "No avatar"}), 404

    ext = user.avatar_path.rsplit('.', 1)[-1].lower()
    mime = {'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png',
            'webp': 'image/webp', 'gif': 'image/gif'}.get(ext, 'image/jpeg')
    return send_file(user.avatar_path, mimetype=mime)

# ─── Current User Info ────────────────────────────────────────────────────────
@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Not found"}), 404
    return jsonify({
        "id": user.id,
        "role": user.role,
        "has_avatar": bool(user.avatar_path and os.path.exists(user.avatar_path)),
        "avatar_url": f"/auth/avatar/{user.id}" if user.avatar_path else None
    }), 200
