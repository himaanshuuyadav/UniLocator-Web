from flask import Blueprint, render_template, redirect, url_for, request, jsonify, session
from flask_socketio import emit
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