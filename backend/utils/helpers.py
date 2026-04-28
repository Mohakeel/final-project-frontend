# ─── Hash Utility ───────────────────────────────────────────────────────────
import hashlib

# ─── Name Normalizer ─────────────────────────────────────────────────────────
def normalize_name(name):
    """Normalize a name for consistent hashing: strip whitespace and title case."""
    return ' '.join(name.strip().split()).title()

# ─── SHA-256 Certificate Hash Generator ──────────────────────────────────────
def generate_hash(name, uni, degree, year):
    """
    Generates a SHA-256 hash for certificate verification.
    Input: Student Full Name | University | Degree Program | Graduation Year
    Names are normalized (title case, trimmed) before hashing.
    
    NOTE: Certificate ID is intentionally NOT included in the hash to ensure
    employer verification requests can match certificates without knowing the ID.
    """
    name = normalize_name(name)
    block_data = f"{name}|{uni}|{degree}|{year}"
    return hashlib.sha256(block_data.encode()).hexdigest()
