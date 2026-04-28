# ─── Role-Based Access Control Decorator ─────────────────────────────────────
from flask_jwt_extended import get_jwt
from functools import wraps
from flask import jsonify

# ─── Role Guard ───────────────────────────────────────────────────────────────
def role_required(required_role):
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            # ─── Extract role from JWT claims ─────────────────────────────
            claims = get_jwt()
            if claims.get("role") == required_role:
                return fn(*args, **kwargs)
            # ─── Block access if role does not match ──────────────────────
            return jsonify({"msg": "Access forbidden: Roles only"}), 403
        return decorator
    return wrapper
