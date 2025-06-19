
from flask import Blueprint, request, jsonify, session
from flask_socketio import emit
from ..utils.database import get_db
from .auth import login_required
import logging

logger = logging.getLogger(__name__)
bp = Blueprint('devices', __name__, url_prefix='/devices')

@bp.route('/add', methods=['POST'])
@login_required
def add_device():
    if not request.is_json:
        return jsonify({'error': 'Content-Type must be application/json'}), 400
        
    data = request.get_json()
    device_code = data.get('device_code')
    device_name = data.get('device_name')
    user_id = session.get('user_id')

    logger.debug(f"Adding device: {device_name} ({device_code}) for user {user_id}")

    if not all([device_code, device_name, user_id]):
        return jsonify({'error': 'Missing required data'}), 400

    try:
        db = get_db()
        cursor = db.cursor()
        
        cursor.execute('SELECT id FROM devices WHERE device_code = ?', (device_code,))
        if cursor.fetchone():
            return jsonify({'error': 'Device already exists'}), 409

        cursor.execute(
            'INSERT INTO devices (device_code, device_name, user_id) VALUES (?, ?, ?)',
            (device_code, device_name, user_id)
        )
        device_id = cursor.lastrowid
        db.commit()
        
        device_data = {
            'id': device_id,
            'device_code': device_code,
            'device_name': device_name
        }
        
        emit('device_added', device_data, broadcast=True)
        return jsonify({'success': True, 'device': device_data}), 201

    except Exception as e:
        logger.error(f"Database error: {e}")
        return jsonify({'error': str(e)}), 500

@bp.route('/list', methods=['GET'])
@login_required
def list_devices():
    db = get_db()
    devices = db.execute(
        'SELECT id, device_code, device_name FROM devices WHERE user_id = ?',
        (session['user_id'],)
    ).fetchall()
    return jsonify([dict(device) for device in devices])