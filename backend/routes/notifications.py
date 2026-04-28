# ─── Notification Routes ──────────────────────────────────────────────────────
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.models import db, Notification

notifications_bp = Blueprint('notifications', __name__)

# ─── Helper: Create a Notification (called from other routes) ─────────────────
def create_notification(user_id, title, message, type='info'):
    notif = Notification(user_id=user_id, title=title, message=message, type=type)
    db.session.add(notif)
    # Note: caller is responsible for committing the session

# ─── Get Notifications (latest 30) ───────────────────────────────────────────
@notifications_bp.route('', methods=['GET'])
@jwt_required()
def get_notifications():
    user_id = int(get_jwt_identity())
    notifs = Notification.query.filter_by(user_id=user_id)\
        .order_by(Notification.created_at.desc()).limit(30).all()
    return jsonify([{
        "id": n.id,
        "title": n.title,
        "message": n.message,
        "type": n.type,
        "is_read": n.is_read,
        "created_at": n.created_at.isoformat()
    } for n in notifs]), 200

# ─── Get Unread Count ─────────────────────────────────────────────────────────
@notifications_bp.route('/unread-count', methods=['GET'])
@jwt_required()
def unread_count():
    user_id = int(get_jwt_identity())
    count = Notification.query.filter_by(user_id=user_id, is_read=False).count()
    return jsonify({"count": count}), 200

# ─── Mark All as Read ─────────────────────────────────────────────────────────
@notifications_bp.route('/mark-read', methods=['POST'])
@jwt_required()
def mark_all_read():
    user_id = int(get_jwt_identity())
    Notification.query.filter_by(user_id=user_id, is_read=False)\
        .update({"is_read": True})
    db.session.commit()
    return jsonify({"message": "All notifications marked as read"}), 200

# ─── Mark Single Notification as Read ────────────────────────────────────────
@notifications_bp.route('/<int:notif_id>/read', methods=['POST'])
@jwt_required()
def mark_one_read(notif_id):
    user_id = int(get_jwt_identity())
    notif = Notification.query.filter_by(id=notif_id, user_id=user_id).first()
    if notif:
        notif.is_read = True
        db.session.commit()
    return jsonify({"message": "Marked as read"}), 200
