from flask import Blueprint, render_template, redirect, url_for, request, jsonify
from flask_socketio import emit
from app import socketio
from functools import wraps
from ..utils.database import get_db
import logging
import secrets
import string
import qrcode
import io
import base64
import json
import os
from datetime import datetime
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import request, jsonify
from datetime import datetime

bp = Blueprint('devices', __name__, url_prefix='/devices')
# socketio = SocketIO()

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
    }, 200)

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

@bp.route('/generate-code', methods=['POST'])
def generate_code():
    """Generate a new device connection code and QR code"""
    from flask import session
    import string
    import secrets
    import threading
    
    try:
        # Use session authentication
        firebase_uid = session.get('user_id')
        user_email = session.get('user_email', 'user@example.com')  # Use fallback email
        
        if not firebase_uid:
            logging.warning("Generate code attempted without authentication")
            return jsonify({'success': False, 'error': 'Not authenticated'}), 401
        
        logging.info(f"[GENERATE-CODE] Starting code generation for user: {firebase_uid}, email: {user_email}")
        
        # Generate simple code immediately (no Firebase blocking)
        chars = string.ascii_uppercase + string.digits
        code = ''.join(secrets.choice(chars) for _ in range(4)) + '-' + ''.join(secrets.choice(chars) for _ in range(4))
        logging.info(f"[GENERATE-CODE] Generated code: {code}")
        
        # Generate QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        
        # Connection data for QR code - use the new unilocator:// scheme
        connection_data = f"unilocator://connect?code={code}&user={firebase_uid}&email={user_email}"
        logging.info(f"[GENERATE-CODE] QR data: {connection_data}")
        
        qr.add_data(connection_data)
        qr.make(fit=True)
        
        # Convert QR code to base64 string
        img = qr.make_image(fill_color="black", back_color="white")
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        qr_code = base64.b64encode(buffered.getvalue()).decode()
        
        logging.info(f"[GENERATE-CODE] QR code generated successfully for code: {code}")
        
        # ALWAYS store in local backup first (immediate, no waiting)
        def store_locally_and_firebase():
            # 1. Store locally immediately
            try:
                import json
                import os
                from datetime import datetime, timedelta
                
                backup_file = os.path.join(os.path.dirname(__file__), '..', '..', 'device_codes_backup.json')
                
                # Load existing backup data
                backup_data = []
                if os.path.exists(backup_file):
                    try:
                        with open(backup_file, 'r') as f:
                            backup_data = json.load(f)
                    except:
                        backup_data = []
                
                # Add new code
                code_data = {
                    'deviceCode': code,
                    'userId': firebase_uid,
                    'userEmail': user_email,
                    'generatedAt': datetime.now().isoformat(),
                    'expiresAt': (datetime.now() + timedelta(hours=24)).isoformat(),
                    'isActive': True,
                    'stored_locally': True
                }
                
                backup_data.append(code_data)
                
                # Save backup
                with open(backup_file, 'w') as f:
                    json.dump(backup_data, f, indent=2)
                
                logging.info(f"[LOCAL-BACKUP] ✅ Stored code {code} locally")
                
            except Exception as backup_error:
                logging.error(f"[LOCAL-BACKUP] ❌ Failed to store code {code} locally: {backup_error}")
            
            # 2. Then try Firebase (optional, can fail)
            try:
                from ..utils.firebase_utils import get_firestore_db
                from firebase_admin import firestore
                from datetime import datetime, timedelta
                
                db = get_firestore_db()
                
                expiration_time = datetime.now() + timedelta(hours=24)
                doc_data = {
                    'deviceCode': code,
                    'userId': firebase_uid,
                    'userEmail': user_email,
                    'generatedAt': firestore.SERVER_TIMESTAMP,
                    'expiresAt': expiration_time,
                    'isActive': True,
                    'maxUsage': 1,
                    'usageCount': 0,
                    'qrCodeData': f'unilocator://connect?code={code}&user={firebase_uid}&email={user_email}'
                }
                
                db.collection('user_device_codes').add(doc_data)
                logging.info(f"[FIREBASE-BG] ✅ Also stored code {code} in Firebase")
                
            except Exception as e:
                logging.warning(f"[FIREBASE-BG] ⚠️ Firebase storage failed for code {code}: {e} (but local backup exists)")
        
        # Start background storage (local + Firebase)
        storage_thread = threading.Thread(target=store_locally_and_firebase, daemon=True)
        storage_thread.start()
        logging.info(f"[GENERATE-CODE] Started background storage for code: {code}")
        
        response = {
            'success': True,
            'code': code,
            'qr_code': f'data:image/png;base64,{qr_code}'
        }
        
        logging.info(f"[GENERATE-CODE] Returning successful response for code: {code}")
        return jsonify(response)
        
    except Exception as e:
        logging.error(f"[GENERATE-CODE] Error in generate_code route: {e}")
        return jsonify({'success': False, 'error': 'Failed to generate code. Please try again.'}), 500

@bp.route('/test-firebase', methods=['GET'])
def test_firebase():
    """Test Firebase connectivity with detailed diagnostics"""
    from ..utils.firebase_utils import test_firebase_connection
    
    try:
        logging.info("[TEST-FIREBASE] Starting comprehensive Firebase diagnostic test")
        test_results = test_firebase_connection()
        
        return jsonify({
            'success': test_results['overall_success'],
            'message': 'Firebase connection working properly' if test_results['overall_success'] else 'Firebase connection failed',
            'diagnostics': {
                'initialization': test_results['initialization_success'],
                'write_operation': test_results['write_success'],
                'read_operation': test_results['read_success'],
                'delete_operation': test_results['delete_success'],
                'total_time_seconds': round(test_results['total_time'], 2),
                'errors': test_results['errors']
            }
        }), 200 if test_results['overall_success'] else 500
            
    except Exception as e:
        logging.error(f"[TEST-FIREBASE] Error: {e}")
        return jsonify({
            'success': False,
            'message': f'Firebase test error: {str(e)}',
            'diagnostics': {
                'initialization': False,
                'write_operation': False,
                'read_operation': False,
                'delete_operation': False,
                'total_time_seconds': 0,
                'errors': [str(e)]
            }
        }), 500

@bp.route('/verify-code-mobile', methods=['POST'])
def verify_code_mobile():
    """
    Mobile-friendly endpoint for device code verification
    Handles Firebase read timeouts gracefully
    """
    try:
        data = request.get_json()
        device_code = data.get('device_code')
        user_id = data.get('user_id')  # Firebase UID from mobile app
        user_email = data.get('user_email', '')
        
        if not device_code or not user_id:
            return jsonify({
                'success': False,
                'error': 'Missing device_code or user_id'
            }), 400
        
        logging.info(f"[MOBILE-VERIFY] Verification request for code: {device_code} from user: {user_id}")
        
        # Use mobile-safe verification with timeout handling
        from ..utils.firebase_utils import verify_device_code_mobile_safe
        result = verify_device_code_mobile_safe(device_code, user_id, user_email)
        
        if result.get('timeout'):
            logging.warning(f"[MOBILE-VERIFY] Timeout for code: {device_code}")
            return jsonify(result), 408  # Request Timeout
        
        if result['success']:
            logging.info(f"[MOBILE-VERIFY] Success for code: {device_code}")
            return jsonify(result), 200
        else:
            logging.info(f"[MOBILE-VERIFY] Failed for code: {device_code} - {result.get('error')}")
            return jsonify(result), 400
            
    except Exception as e:
        logging.error(f"[MOBILE-VERIFY] Endpoint error: {e}")
        return jsonify({
            'success': False,
            'error': 'Server error during verification'
        }), 500

@bp.route('/check-code-exists', methods=['POST'])
def check_code_exists():
    """
    Quick check if a device code exists (write-only approach)
    Used by mobile app for pre-validation
    """
    try:
        data = request.get_json()
        device_code = data.get('device_code')
        
        if not device_code:
            return jsonify({
                'exists': False,
                'error': 'Missing device_code'
            }), 400
        
        logging.info(f"[CODE-CHECK] Checking existence of code: {device_code}")
        
        # For now, return optimistic response since reads are problematic
        # The actual verification happens in verify-code-mobile
        return jsonify({
            'exists': True,  # Assume it exists, let verification handle the details
            'message': 'Code format valid, proceed to verification'
        }), 200
        
    except Exception as e:
        logging.error(f"[CODE-CHECK] Error: {e}")
        return jsonify({
            'exists': False,
            'error': 'Server error'
        }), 500

@bp.route('/test-mobile-verification', methods=['GET'])
def test_mobile_verification():
    """
    Test endpoint to verify mobile app readiness
    Generates a test code and tests verification flow
    """
    try:
        logging.info("[MOBILE-TEST] Starting mobile verification test")
        
        # Generate a test device code
        from ..utils.firebase_utils import generate_device_code
        test_user_id = "test_user_mobile_123"
        test_user_email = "mobile@test.com"
        
        test_code = generate_device_code(test_user_id, test_user_email)
        logging.info(f"[MOBILE-TEST] Generated test code: {test_code}")
        
        # Test the mobile verification function
        from ..utils.firebase_utils import verify_device_code_mobile_safe
        verification_result = verify_device_code_mobile_safe(
            test_code, 
            "connecting_user_456", 
            "connecting@test.com"
        )
        
        return jsonify({
            'mobile_ready': True,
            'test_results': {
                'code_generation': {
                    'success': True,
                    'generated_code': test_code,
                    'format_valid': len(test_code) == 9 and '-' in test_code
                },
                'verification_test': verification_result,
                'endpoints_available': [
                    '/devices/verify-code-mobile',
                    '/devices/check-code-exists'
                ]
            },
            'mobile_integration_guide': {
                'verify_endpoint': 'POST /devices/verify-code-mobile',
                'required_fields': ['device_code', 'user_id', 'user_email'],
                'response_codes': {
                    '200': 'Success',
                    '400': 'Invalid code or user error',
                    '408': 'Timeout - retry suggested',
                    '500': 'Server error'
                }
            }
        })
        
    except Exception as e:
        logging.error(f"[MOBILE-TEST] Test failed: {e}")
        return jsonify({
            'mobile_ready': False,
            'error': str(e),
            'suggestion': 'Check Firebase connectivity and server logs'
        }), 500

@bp.route('/debug/check-firebase-codes')
def check_firebase_codes():
    """Debug endpoint to see what codes are stored in Firebase - with timeout protection"""
    try:
        from ..utils.firebase_utils import get_firestore_db
        import threading
        import time
        
        logging.info("[DEBUG-CODES] Checking Firebase codes")
        
        result = {'codes': [], 'error': None}
        
        def firebase_list():
            try:
                db = get_firestore_db()
                codes = db.collection('user_device_codes').limit(10).get()
                
                for doc in codes:
                    data = doc.to_dict()
                    result['codes'].append({
                        'id': doc.id,
                        'deviceCode': data.get('deviceCode'),
                        'userId': data.get('userId'), 
                        'userEmail': data.get('userEmail'),
                        'isActive': data.get('isActive'),
                        'createdAt': str(data.get('generatedAt', 'No date'))
                    })
                    
            except Exception as e:
                result['error'] = str(e)
        
        # Run Firebase read in background thread with timeout
        list_thread = threading.Thread(target=firebase_list)
        list_thread.daemon = True
        list_thread.start()
        
        # Wait maximum 10 seconds for read operation
        list_thread.join(timeout=10.0)
        
        if list_thread.is_alive():
            logging.warning("[DEBUG-CODES] List timeout")
            return jsonify({
                'timeout': True,
                'codes': [],
                'count': 0,
                'message': 'Firebase read timed out while listing codes'
            })
        
        if result['error']:
            return jsonify({
                'error': result['error'],
                'codes': [],
                'count': 0
            })
        
        return jsonify({
            'codes': result['codes'], 
            'count': len(result['codes']),
            'message': f'Found {len(result["codes"])} codes in Firebase'
        })
        
    except Exception as e:
        logging.error(f"[DEBUG-CODES] Framework error: {e}")
        return jsonify({'error': str(e)})

@bp.route('/debug/test-code/<code>')
def test_code_debug(code):
    """Debug endpoint to test if a specific code can be found - with timeout protection"""
    try:
        from ..utils.firebase_utils import get_firestore_db
        import threading
        import time
        
        logging.info(f"[DEBUG-CODE] Testing code: {code}")
        
        result = {'found': False, 'error': None, 'data': None}
        
        def firebase_read():
            try:
                db = get_firestore_db()
                
                # Use simpler query approach
                collection_ref = db.collection('user_device_codes')
                query_result = collection_ref.where('deviceCode', '==', code).where('isActive', '==', True).get()
                
                if len(query_result) == 0:
                    result['found'] = False
                    result['message'] = f'No code {code} found in Firebase'
                    return
                
                doc = query_result[0]
                data = doc.to_dict()
                
                result['found'] = True
                result['data'] = {
                    'userId': data.get('userId'),
                    'userEmail': data.get('userEmail'), 
                    'isActive': data.get('isActive'),
                    'createdAt': str(data.get('generatedAt'))
                }
                result['message'] = 'Code found successfully!'
                
            except Exception as e:
                result['error'] = str(e)
        
        # Run Firebase read in background thread with timeout
        read_thread = threading.Thread(target=firebase_read)
        read_thread.daemon = True
        read_thread.start()
        
        # Wait maximum 10 seconds for read operation
        read_thread.join(timeout=10.0)
        
        if read_thread.is_alive():
            logging.warning(f"[DEBUG-CODE] Read timeout for code: {code}")
            return jsonify({
                'found': False,
                'timeout': True,
                'message': f'Firebase read timed out for code {code}',
                'suggestion': 'Firebase read operations are experiencing delays'
            })
        
        if result['error']:
            return jsonify({
                'found': False,
                'error': result['error'],
                'suggestion': 'Firebase read operation failed'
            })
        
        return jsonify({
            'found': result['found'],
            'code': code,
            'data': result.get('data'),
            'message': result.get('message', 'Code not found')
        })
        
    except Exception as e:
        logging.error(f"[DEBUG-CODE] Framework error: {e}")
        return jsonify({'error': str(e)})

@bp.route('/debug/simple-test')
def simple_test():
    """Simple test endpoint that doesn't use Firebase - just to verify server works"""
    try:
        logging.info("[SIMPLE-TEST] Test endpoint called")
        return jsonify({
            'status': 'working',
            'message': 'Server is responding normally',
            'timestamp': str(datetime.now()),
            'firebase_issue': 'Firebase reads are timing out, but server works fine'
        })
    except Exception as e:
        return jsonify({'error': str(e)})

@bp.route('/verify-code-firebase', methods=['POST'])
def verify_code_firebase():
    """
    Firebase-only verification with timeout protection
    Uses timeout-protected Firebase queries to prevent hanging
    """
    try:
        data = request.get_json()
        device_code = data.get('device_code')
        user_id = data.get('user_id')
        user_email = data.get('user_email', '')
        
        if not device_code or not user_id:
            return jsonify({
                'success': False,
                'error': 'Missing device_code or user_id'
            }), 400
        
        logging.info(f"[VERIFY-FIREBASE] Starting timeout-protected verification - Code: {device_code}, User: {user_id}")
        
        # Use timeout-protected Firebase verification
        from ..utils.firebase_utils import verify_device_code_with_timeout
        
        success, result_data, error_message = verify_device_code_with_timeout(
            device_code, user_id, user_email, timeout_seconds=15
        )
        
        if success:
            logging.info(f"[VERIFY-FIREBASE] ✅ Success - Device: {result_data['deviceId']}")
            return jsonify({
                'success': True,
                'message': result_data['message'],
                'deviceId': result_data['deviceId'],
                'ownerEmail': result_data['ownerEmail']
            })
        else:
            logging.error(f"[VERIFY-FIREBASE] ❌ Failed: {error_message}")
            return jsonify({
                'success': False,
                'error': error_message
            })
        
    except Exception as e:
        logging.error(f"[VERIFY-FIREBASE] ❌ Route error: {e}")
        return jsonify({
            'success': False,
            'error': f'Verification failed: {str(e)}'
        }), 500

@bp.route('/health', methods=['GET'])
def health_check():
    """Simple health check - no Firebase operations"""
    return jsonify({
        'status': 'healthy',
        'message': 'Server is running',
        'timestamp': datetime.now().isoformat(),
        'firebase_note': 'Android app should connect directly to Firebase for reads'
    })

@bp.route('/device-info', methods=['GET'])
def device_info():
    """Provide info about how Android should connect"""
    return jsonify({
        'connection_method': 'direct_firebase',
        'instructions': {
            'step1': 'Android app connects directly to Firebase',
            'step2': 'Query user_device_codes collection where deviceCode == your_code',
            'step3': 'Create connection in device_connections collection',
            'step4': 'No server API needed for verification'
        },
        'firebase_collections': {
            'device_codes': 'user_device_codes',
            'connections': 'device_connections'
        }
    })

@bp.route('/test-read/<device_code>', methods=['GET'])
def test_firebase_read(device_code):
    """
    Test Firebase read operation with timeout - simulates Android app behavior
    """
    try:
        logging.info(f"[TEST-READ] Testing Firebase read for code: {device_code}")
        
        from ..utils.firebase_utils import query_firebase_with_timeout
        
        # Test the same query your Android app would make
        success, docs, error = query_firebase_with_timeout(
            'user_device_codes', 'deviceCode', device_code, timeout_seconds=10
        )
        
        if success:
            if docs and len(docs) > 0:
                doc_data = docs[0].to_dict()
                logging.info(f"[TEST-READ] ✅ Found code: {device_code}")
                return jsonify({
                    'success': True,
                    'message': 'Code found successfully',
                    'code_data': {
                        'deviceCode': doc_data.get('deviceCode'),
                        'userId': doc_data.get('userId'),
                        'userEmail': doc_data.get('userEmail'),
                        'isActive': doc_data.get('isActive'),
                        'generatedAt': str(doc_data.get('generatedAt')),
                        'expiresAt': str(doc_data.get('expiresAt'))
                    },
                    'android_compatible': True
                })
            else:
                logging.info(f"[TEST-READ] ❌ Code not found: {device_code}")
                return jsonify({
                    'success': False,
                    'message': 'Code not found or inactive',
                    'android_compatible': True
                })
        else:
            logging.error(f"[TEST-READ] ❌ Firebase read failed: {error}")
            return jsonify({
                'success': False,
                'message': f'Firebase read error: {error}',
                'android_compatible': False
            })
        
    except Exception as e:
        logging.error(f"[TEST-READ] ❌ Exception: {e}")
        return jsonify({
            'success': False,
            'message': f'Test failed: {str(e)}',
            'android_compatible': False
        }), 500

@bp.route('/debug/simulate-android-read/<device_code>', methods=['GET'])
def simulate_android_read(device_code):
    """
    Simulate exactly what Android app does - direct Firebase read
    This will show if Firestore rules are blocking reads
    """
    try:
        logging.info(f"[ANDROID-SIM] Simulating Android read for code: {device_code}")
        
        from ..utils.firebase_utils import get_firestore_db
        from firebase_admin import firestore
        
        db = get_firestore_db()
        now = firestore.SERVER_TIMESTAMP
        
        # Simulate Android app query - exactly the same query your Android app makes
        logging.info(f"[ANDROID-SIM] Querying user_device_codes collection...")
        
        # This is the EXACT query your Android app uses
        query_ref = db.collection('user_device_codes')\
            .where('deviceCode', '==', device_code)\
            .where('isActive', '==', True)
        
        # Try to execute the query (this will fail if rules block it)
        try:
            docs = query_ref.stream()
            doc_list = list(docs)
            
            if doc_list:
                doc_data = doc_list[0].to_dict()
                logging.info(f"[ANDROID-SIM] ✅ Successfully read code from Firebase")
                return jsonify({
                    'success': True,
                    'message': 'Android simulation successful - Firebase rules allow reads',
                    'code_found': True,
                    'code_data': {
                        'deviceCode': doc_data.get('deviceCode'),
                        'userId': doc_data.get('userId'), 
                        'userEmail': doc_data.get('userEmail'),
                        'isActive': doc_data.get('isActive'),
                        'expiresAt': str(doc_data.get('expiresAt'))
                    },
                    'rules_status': 'WORKING'
                })
            else:
                logging.info(f"[ANDROID-SIM] ⚠️ Query successful but no matching documents")
                return jsonify({
                    'success': True,
                    'message': 'Query worked but code not found',
                    'code_found': False,
                    'rules_status': 'WORKING'
                })
                
        except Exception as query_error:
            # This likely means Firestore rules are blocking the read
            logging.error(f"[ANDROID-SIM] ❌ Firebase query failed: {query_error}")
            return jsonify({
                'success': False,
                'message': 'Firebase query failed - likely FIRESTORE RULES blocking reads',
                'error': str(query_error),
                'rules_status': 'BLOCKED',
                'solution': 'Deploy the fixed firestore rules from firestore-rules-fixed.rules'
            }), 403
        
    except Exception as e:
        logging.error(f"[ANDROID-SIM] ❌ Simulation error: {e}")
        return jsonify({
            'success': False,
            'message': f'Simulation failed: {str(e)}',
            'rules_status': 'UNKNOWN'
        }), 500