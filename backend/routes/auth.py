from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt
from models.models import db, User, Applicant, Employer, University, TokenBlocklist

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    
    # 1. Check if user already exists to prevent database errors
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"msg": "Email already registered"}), 400

    # 2. Hash password and create the base User
    hashed_pw = generate_password_hash(data['password'])
    user = User(email=data['email'], password=hashed_pw, role=data['role'])
    db.session.add(user)
    db.session.commit() # Commit here to get the user.id
    
    # 3. Create the specific sub-profile based on the role
    # Note: We use data.get('name') to match your frontend input ID
    if data['role'] == 'applicant':
        db.session.add(Applicant(user_id=user.id, full_name=data.get('name')))
    elif data['role'] == 'employer':
        db.session.add(Employer(user_id=user.id, company_name=data.get('name')))
    elif data['role'] == 'university':
        db.session.add(University(user_id=user.id, uni_name=data.get('name')))
    
    db.session.commit()

    # 4. GENERATE TOKEN so the frontend can log them in immediately
    # JWT spec requires 'sub' (identity) to be a string
    token = create_access_token(identity=str(user.id), additional_claims={"role": user.role})
    
    return jsonify({
        "msg": "Registered successfully",
        "access_token": token,
        "role": user.role,
        "name": data.get('name')
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(email=data['email']).first()
    if user and check_password_hash(user.password, data['password']):
        token = create_access_token(identity=str(user.id), additional_claims={"role": user.role})
        return jsonify(access_token=token, role=user.role), 200
    return jsonify({"msg": "Bad credentials"}), 401


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Revoke the current JWT by adding its JTI to the blocklist."""
    jti = get_jwt().get('jti')
    if not jti:
        return jsonify({"msg": "Invalid token"}), 400

    # Persist revoked token
    try:
        db.session.add(TokenBlocklist(jti=jti))
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify({"msg": "Failed to revoke token"}), 500

    return jsonify({"msg": "Successfully logged out"}), 200