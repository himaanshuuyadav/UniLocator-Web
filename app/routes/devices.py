from flask import Blueprint, render_template, redirect, url_for, request, jsonify
from flask_socketio import emit
from app import socketio
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
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import request, jsonify


bp = Blueprint('devices', __name__, url_prefix='/devices')
# socketio = SocketIO()

@bp.route('/generate-code', methods=['POST'])
def generate_code():
    from flask import session
    
    try:
        # Use session authentication instead of headers
        firebase_uid = session.get('user_id')
        if not firebase_uid:
            return jsonify({'success': False, 'error': 'Not authenticated'}), 401
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
            "user_id": firebase_uid,
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
            (firebase_uid, code)
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
    device_name = data.get('device_name') or f"Device_{device_code[:6]}"
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
    })
    return jsonify({
        "success": True,
        "message": "Device connected successfully",
        "device_name": device_name
    }), 200

@bp.route('/remove-device', methods=['POST'])
def remove_device():
    from flask import session
    
    data = request.get_json()
    device_code = data.get('device_code')
    
    # Use session authentication instead of headers
    firebase_uid = session.get('user_id')
    if not firebase_uid:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    db = get_db()
    # Check if device exists and belongs to user
    cursor = db.execute('SELECT id FROM connected_devices WHERE device_code = ? AND user_id = ?', (device_code, firebase_uid))
    device = cursor.fetchone()
    
    if not device:
        return jsonify({
            'success': False,
            'message': 'Device not found or not authorized.'
        }), 200
    
    db.execute('DELETE FROM connected_devices WHERE device_code = ? AND user_id = ?', (device_code, firebase_uid))
    db.commit()
    
    logging.info(f"[REMOVE] Device {device_code} removed for user {firebase_uid}")
    
    socketio.emit('device_removed', {
        'device_code': device_code,
        'user_id': firebase_uid
    })
    
    return jsonify({
        'success': True,
        'message': 'Device removed successfully.'
    }), 200

@bp.route('/location/<device_code>', methods=['POST'])
@jwt_required()
def update_location(device_code):
    user_id = get_jwt_identity()
    data = request.get_json()
    lat = data.get('lat')
    lng = data.get('lng')
    db = get_db()
    cursor = db.execute('SELECT user_id FROM connected_devices WHERE device_code = ?', (device_code,))
    row = cursor.fetchone()
    if not row or row[0] != user_id:
        return jsonify({'success': False, 'error': 'Unauthorized or device not found.'}), 403
    db.execute(
        '''UPDATE connected_devices
           SET last_latitude = ?, last_longitude = ?, last_seen = CURRENT_TIMESTAMP
           WHERE device_code = ?''',
        (lat, lng, device_code)
    )
    db.commit()
    return jsonify({'success': True})

@bp.route('/battery/<device_code>', methods=['POST'])
@jwt_required()
def update_battery(device_code):
    user_id = get_jwt_identity()
    data = request.get_json()
    battery = data.get('battery')
    db = get_db()
    cursor = db.execute('SELECT user_id FROM connected_devices WHERE device_code = ?', (device_code,))
    row = cursor.fetchone()
    if not row or row[0] != user_id:
        return jsonify({'success': False, 'error': 'Unauthorized or device not found.'}), 403
    db.execute(
        '''UPDATE connected_devices
           SET last_battery = ?, last_seen = CURRENT_TIMESTAMP
           WHERE device_code = ?''',
        (battery, device_code)
    )
    db.commit()
    return jsonify({'success': True})

@bp.route('/network/<device_code>', methods=['POST'])
@jwt_required()
def update_network(device_code):
    user_id = get_jwt_identity()
    data = request.get_json()
    network = data.get('network')
    db = get_db()
    cursor = db.execute('SELECT user_id FROM connected_devices WHERE device_code = ?', (device_code,))
    row = cursor.fetchone()
    if not row or row[0] != user_id:
        return jsonify({'success': False, 'error': 'Unauthorized or device not found.'}), 403
    db.execute(
        '''UPDATE connected_devices
           SET last_network = ?, last_seen = CURRENT_TIMESTAMP
           WHERE device_code = ?''',
        (network, device_code)
    )
    db.commit()
    return jsonify({'success': True})

@bp.route('/list', methods=['GET'])
@jwt_required()
def list_devices():
    user_id = get_jwt_identity()
    db = get_db()
    devices = db.execute(
        'SELECT device_name, device_code, last_seen FROM connected_devices WHERE user_id = ?',
        (user_id,)
    ).fetchall()
    result = []
    for device in devices:
        result.append({
            "device_name": device["device_name"],
            "device_code": device["device_code"],
            "last_seen": device["last_seen"]
        })
    return jsonify(result)

@bp.route('/add', methods=['POST'])
def add_device():
    from flask import session
    
    # Check session authentication
    firebase_uid = session.get('user_id')
    if not firebase_uid:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    try:
        data = request.get_json()
        device_code = data.get('device_code')
        device_name = data.get('device_name', f"Device_{device_code[:6]}" if device_code else "New Device")
        
        if not device_code:
            return jsonify({'success': False, 'error': 'Device code is required'}), 400
        
        logging.info(f"[ADD_DEVICE] Adding device {device_code} for user {firebase_uid}")
        
        db = get_db()
        
        # Check if device code already exists in connected_devices
        cursor = db.execute('SELECT device_code FROM connected_devices WHERE device_code = ?', (device_code,))
        if cursor.fetchone():
            return jsonify({'success': False, 'error': 'Device already connected'}), 400
        
        # Add device to connected_devices directly
        db.execute('''
            INSERT INTO connected_devices (user_id, device_code, device_name, connected_at) 
            VALUES (?, ?, ?, datetime('now'))
        ''', (firebase_uid, device_code, device_name))
        db.commit()
        
        logging.info(f"[ADD_DEVICE] Device {device_code} added successfully for user {firebase_uid}")
        
        # Emit socket event for real-time update
        socketio.emit('device_connected', {
            'device_code': device_code,
            'device_name': device_name,
            'user_id': firebase_uid
        })
        
        return jsonify({
            'success': True,
            'message': 'Device added successfully',
            'device': {
                'code': device_code,
                'name': device_name
            }
        })
        
    except Exception as e:
        logging.error(f"[ADD_DEVICE] Error adding device: {e}")
        return jsonify({'success': False, 'error': 'Failed to add device'}), 500

@bp.route('/disconnect-all', methods=['POST'])
def disconnect_all_devices():
    from flask import session
    import sqlite3
    
    try:
        firebase_uid = session.get('user_id')
        if not firebase_uid:
            return jsonify({'success': False, 'error': 'Not authenticated'}), 401
        
        conn = sqlite3.connect('instance/unilocator.db')
        cursor = conn.cursor()
        
        # Delete all devices for the user
        cursor.execute("DELETE FROM connected_devices WHERE user_id = ?", (firebase_uid,))
        deleted_count = cursor.rowcount
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True, 
            'message': f'Disconnected {deleted_count} device(s) successfully'
        })
        
    except Exception as e:
        print(f"[DEBUG] Error disconnecting all devices: {e}")
        return jsonify({'success': False, 'error': 'Failed to disconnect devices'}), 500