from flask import Blueprint, request, jsonify
from ..utils.database import get_db

bp = Blueprint('api', __name__, url_prefix='/api')

@bp.route('/location/<device_id>', methods=['POST'])
def update_location(device_id):
    data = request.get_json()
    if not data or 'lat' not in data or 'lng' not in data:
        return jsonify({'status': 'error', 'message': 'Invalid data'}), 400

    lat = data['lat']
    lng = data['lng']

    db = get_db()
    db.execute(
        'UPDATE connected_devices SET last_latitude = ?, last_longitude = ?, last_seen = CURRENT_TIMESTAMP WHERE device_code = ?',
        (lat, lng, device_id)
    )
    db.commit()
    return jsonify({'status': 'ok'})
