import hashlib

def generate_hash(name, uni, degree, year, certificate_id=None):
    """
    Generates a SHA-256 hash for certificate verification.
    Input: Student Full Name | University | Degree Program | Graduation Year | Certificate ID
    """
    if certificate_id:
        block_data = f"{name}|{uni}|{degree}|{year}|{certificate_id}"
    else:
        block_data = f"{name}|{uni}|{degree}|{year}"
    return hashlib.sha256(block_data.encode()).hexdigest()