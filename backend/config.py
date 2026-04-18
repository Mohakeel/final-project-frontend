import os

# base directory of the backend package (used to build absolute paths)
basedir = os.path.abspath(os.path.dirname(__file__))

# make sure the instance directory exists so SQLite can create the file
instance_dir = os.path.join(basedir, 'instance')
os.makedirs(instance_dir, exist_ok=True)

class Config:
    SECRET_KEY = 'your-secret-key' # Change this for production
    # use an absolute path so SQLAlchemy doesn't depend on working directory
    SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(instance_dir, 'database.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = 'jwt-secret-key'
    JWT_TOKEN_LOCATION = ['headers']
    JWT_HEADER_NAME = 'Authorization'
    JWT_HEADER_TYPE = 'Bearer'
    UPLOAD_FOLDER = 'uploads/resumes'