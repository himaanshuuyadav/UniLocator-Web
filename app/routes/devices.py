from flask import Blueprint, render_template, redirect, url_for, request, jsonify, session
from flask_socketio import emit, SocketIO
from functools import wraps
from ..utils.database import get_db
from ..models.device import Device
import logging
import secrets
import string
import qrcode
import io
import base64
import json

bp = Blueprint('devices', __name__, url_prefix='/devices')
socketio = SocketIO()

# Login required decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'success': False, 'error': 'Not authenticated'}), 401
        return f(*args, **kwargs)
    return decorated_function

@bp.route('/generate-code', methods=['POST'])
@login_required
def generate_code():
    try:
        # Generate unique 8-character code
        code = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(8))
        
        # Generate QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        connection_data = {
            "server_url": request.host_url.rstrip('/'),
            "user_id": session['user_id'],
            "device_code": code
        }
        qr.add_data(json.dumps(connection_data))
        qr.make(fit=True)
        
        # Convert QR code to base64 string
        img = qr.make_image(fill_color="black", back_color="white")
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        qr_code = base64.b64encode(buffered.getvalue()).decode()
        
        # Store in pending_devices
        db = get_db()
        db.execute(
            'INSERT INTO pending_devices (user_id, device_code, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
            (session['user_id'], code)
        )
        db.commit()
        
        return jsonify({
            'success': True,
            'code': code,
            'qr_code': f'data:image/png;base64,{qr_code}'
        })
        
    except Exception as e:
        logging.error(f"Error generating code: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@bp.route('/verify-device', methods=['POST'])
def verify_device():
    data = request.get_json()
    device_code = data.get('device_code')
    logging.info(f"[DEBUG] Received device_code from Android app: {device_code}")
    # Optionally, check if code exists in pending_devices
    from ..utils.database import get_db
    db = get_db()
    cursor = db.execute('SELECT id FROM pending_devices WHERE device_code = ?', (device_code,))
    exists = cursor.fetchone() is not None
    logging.info(f"[DEBUG] Exists in pending_devices: {exists}")
    return jsonify({
        'received': True,
        'device_code': device_code,
        'exists_in_pending': exists
    })

@bp.route('/connect-device', methods=['POST'])
def connect_device():
    data = request.get_json()
    device_code = data.get('device_code')
    logging.info(f"[CONNECT] Attempting to connect device: {device_code}")
    db = get_db()
    # Check if device exists in pending_devices
    cursor = db.execute('SELECT user_id FROM pending_devices WHERE device_code = ?', (device_code,))
    pending_device = cursor.fetchone()
    if not pending_device:
        logging.info(f"[CONNECT] No pending device found for code: {device_code}")
        return jsonify({
            "success": False,
            "message": "Invalid code"
        }), 200
    user_id = pending_device[0]
    device_name = f"Device_{device_code[:6]}"
    # Add to connected_devices
    db.execute('INSERT INTO connected_devices (user_id, device_code, device_name) VALUES (?, ?, ?)', (user_id, device_code, device_name))
    # Remove from pending_devices
    db.execute('DELETE FROM pending_devices WHERE device_code = ?', (device_code,))
    db.commit()
    logging.info(f"[CONNECT] Device {device_code} connected successfully for user {user_id}")
    # Emit socket event for real-time update
    socketio.emit('device_connected', {
        'device_code': device_code,
        'device_name': device_name,
        'user_id': user_id
    }, broadcast=True)
    return jsonify({
        "success": True,
        "message": "Device connected successfully",
        "device_name": device_name
    }), 200

@bp.route('/remove-device', methods=['POST'])
@login_required
def remove_device():
    data = request.get_json()
    device_code = data.get('device_code')
    user_id = session['user_id']
    db = get_db()
    # Check if device exists and belongs to user
    cursor = db.execute('SELECT id FROM connected_devices WHERE device_code = ? AND user_id = ?', (device_code, user_id))
    device = cursor.fetchone()
    if not device:
        return jsonify({
            'success': False,
            'message': 'Device not found or not authorized.'
        }), 200
    db.execute('DELETE FROM connected_devices WHERE device_code = ? AND user_id = ?', (device_code, user_id))
    db.commit()
    logging.info(f"[REMOVE] Device {device_code} removed for user {user_id}")
    socketio.emit('device_removed', {
        'device_code': device_code,
        'user_id': user_id
    }, broadcast=True)
    return jsonify({
        'success': True,
        'message': 'Device removed successfully.'
    }), 200