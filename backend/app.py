from flask import Flask
import os
from config import Config
from models.models import db
from flask_jwt_extended import JWTManager
from flask_cors import CORS  # 1. Import CORS
from routes.auth import auth_bp
from routes.university import university_bp
from routes.employer import employer_bp
from routes.applicant import applicant_bp
from routes.notifications import notifications_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)  # 2. Enable CORS for all routes
    
    db.init_app(app)
    jwt = JWTManager(app)

    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        """Called whenever a protected endpoint is accessed to check if token is revoked."""
        jti = jwt_payload.get('jti')
        if not jti:
            return True
        from models.models import TokenBlocklist
        return TokenBlocklist.query.filter_by(jti=jti).first() is not None

    # Blueprints
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(university_bp, url_prefix='/university')
    app.register_blueprint(employer_bp, url_prefix='/employer')
    app.register_blueprint(applicant_bp, url_prefix='/applicant')
    app.register_blueprint(notifications_bp, url_prefix='/notifications')

    with app.app_context():
        # ensure the directory for the sqlite file exists
        uri = app.config.get('SQLALCHEMY_DATABASE_URI', '')
        if uri.startswith('sqlite:///'):
            db_path = uri.replace('sqlite:///', '')
            db_dir = os.path.dirname(db_path)
            if db_dir and not os.path.exists(db_dir):
                os.makedirs(db_dir, exist_ok=True)
        db.create_all()
    
    return app

if __name__ == '__main__':
    app = create_app()
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)