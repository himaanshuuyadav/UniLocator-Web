from flask import Blueprint, render_template, redirect, url_for, request, jsonify, session
from flask_socketio import emit
from functools import wraps
from ..utils.database import get_db
import logging
import secrets
import string
import qrcode
import io
import base64

bp = Blueprint('devices', __name__, url_prefix='/devices')

@bp.route('/generate-code', methods=['POST'])
def generate_code():
    try:
        if 'user_id' not in session:
            return jsonify({'success': False, 'error': 'Not authenticated'}), 401
            
        # Generate unique code
        code = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(8))
        
        # Generate QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(code)
        qr.make(fit=True)
        
        # Convert QR code to base64 string
        img = qr.make_image(fill_color="black", back_color="white")
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        qr_code = base64.b64encode(buffered.getvalue()).decode()
        
        # Store in pending_devices
        db = get_db()
        db.execute(
            'INSERT INTO pending_devices (code, user_id, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
            (code, session['user_id'])
        )
        db.commit()
        
        return jsonify({
            'success': True,
            'code': code,
            'qr_code': f'data:image/png;base64,{qr_code}'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500