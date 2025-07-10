from flask import Blueprint, request, redirect, url_for, session, jsonify, Response
from datetime import datetime
import sqlite3
import json
import sqlite3
import json
from datetime import datetime

bp = Blueprint('auth', __name__)

@bp.route('/login', methods=['POST'])
def login():
    # Expect JSON with {"firebase_uid": ...}
    data = request.get_json()
    firebase_uid = data.get('firebase_uid')
    print(f"[DEBUG] /login called. firebase_uid: {firebase_uid}")
    if not firebase_uid:
        print("[DEBUG] /login failed: Missing firebase_uid")
        return jsonify({'success': False, 'error': 'Missing firebase_uid'}), 400
    # Set session cookie
    session['user_id'] = firebase_uid
    print(f"[DEBUG] /login success. session['user_id']: {session.get('user_id')}")
    return jsonify({'success': True, 'redirect': url_for('main.dashboard')})

@bp.route('/logout', methods=['POST'])
def logout():
    print(f"[DEBUG] /logout called. session before clear: {session.get('user_id')}")
    session.pop('user_id', None)
    print(f"[DEBUG] /logout success. session after clear: {session.get('user_id')}")
    return jsonify({'success': True, 'redirect': url_for('main.index')})

@bp.route('/download-data', methods=['GET'])
def download_data():
    firebase_uid = session.get('user_id')
    if not firebase_uid:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    try:
        conn = sqlite3.connect('instance/unilocator.db')
        cursor = conn.cursor()
        
        # Get user data
        cursor.execute("SELECT * FROM users WHERE firebase_uid = ?", (firebase_uid,))
        user_data = cursor.fetchone()
        
        # Get devices data
        cursor.execute("SELECT * FROM connected_devices WHERE user_id = ?", (firebase_uid,))
        devices_data = cursor.fetchall()
        
        conn.close()
        
        # Format data for download
        export_data = {
            'user_id': firebase_uid,
            'export_date': str(datetime.now()),
            'user_info': user_data,
            'devices': devices_data
        }
        
        response = Response(
            json.dumps(export_data, indent=2),
            mimetype='application/json',
            headers={"Content-Disposition": "attachment;filename=unilocator-data.json"}
        )
        return response
        
    except Exception as e:
        print(f"[DEBUG] Error downloading data: {e}")
        return jsonify({'success': False, 'error': 'Failed to export data'}), 500

@bp.route('/save-setting', methods=['POST'])
def save_setting():
    firebase_uid = session.get('user_id')
    if not firebase_uid:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    data = request.get_json()
    setting_name = data.get('setting')
    setting_value = data.get('value')
    
    print(f"[DEBUG] Saving setting {setting_name}: {setting_value} for user {firebase_uid}")
    
    # In a real implementation, you'd save this to a user_settings table
    # For now, just return success
    return jsonify({'success': True})

@bp.route('/delete-account', methods=['POST'])
def delete_account():
    firebase_uid = session.get('user_id')
    if not firebase_uid:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    try:
        conn = sqlite3.connect('instance/unilocator.db')
        cursor = conn.cursor()
        
        # Delete user's devices
        cursor.execute("DELETE FROM connected_devices WHERE user_id = ?", (firebase_uid,))
        
        # Delete user
        cursor.execute("DELETE FROM users WHERE firebase_uid = ?", (firebase_uid,))
        
        conn.commit()
        conn.close()
        
        # Clear session
        session.pop('user_id', None)
        
        return jsonify({'success': True})
        
    except Exception as e:
        print(f"[DEBUG] Error deleting account: {e}")
        return jsonify({'success': False, 'error': 'Failed to delete account'}), 500

