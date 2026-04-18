import hashlib

def generate_hash(name, uni, degree, year):
    """
    Simulates blockchain trust.
    Generates a unique SHA-256 signature for the certificate data.
    """
    block_data = f"{name}|{uni}|{degree}|{year}"
    return hashlib.sha256(block_data.encode()).hexdigest()