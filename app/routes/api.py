from flask import Blueprint, request, jsonify
from ..utils.database import get_db
from datetime import datetime

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

@bp.route('/fetch-devices-debug', methods=['POST'])
def fetch_devices_debug():
    """
    Debug endpoint to fetch devices using multiple strategies
    Returns detailed debug information and device data
    """
    from flask import session
    from ..utils.firebase_utils import fetch_user_devices_debug
    from ..utils.firebase_rest import get_rest_client
    import logging
    from datetime import datetime
    
    try:
        # Get user ID from session
        user_id = session.get('user_id')
        
        if not user_id:
            return jsonify({
                'success': False,
                'error': 'User not authenticated - please login again',
                'debug_info': {
                    'session_data': {k: v for k, v in dict(session).items() if k != 'csrf_token'},
                    'timestamp': datetime.now().isoformat(),
                    'message': 'Session may have expired. Please refresh and login again.'
                }
            }), 401
        
        logging.info(f"[DEBUG API] Starting device fetch for user: {user_id}")
        
        # Try multiple strategies
        strategies_results = {}
        
        # Strategy 1: Firebase REST API
        try:
            logging.info("[DEBUG API] Trying Strategy 1: Firebase REST API")
            rest_client = get_rest_client()
            if rest_client and rest_client.credentials:
                rest_result = rest_client.fetch_user_devices(user_id)
                strategies_results['rest_api'] = rest_result
                logging.info(f"[DEBUG API] REST API result: {rest_result['success']}")
            else:
                strategies_results['rest_api'] = {
                    'success': False,
                    'error': 'REST client not initialized',
                    'logs': ['❌ Firebase REST client initialization failed']
                }
        except Exception as e:
            logging.error(f"[DEBUG API] REST API error: {e}")
            strategies_results['rest_api'] = {
                'success': False,
                'error': str(e),
                'logs': [f'❌ REST API exception: {e}']
            }
        
        # Strategy 2: Admin SDK (if REST fails)
        if not strategies_results.get('rest_api', {}).get('success'):
            try:
                logging.info("[DEBUG API] Trying Strategy 2: Admin SDK")
                admin_result = fetch_user_devices_debug(user_id)
                strategies_results['admin_sdk'] = admin_result
                logging.info(f"[DEBUG API] Admin SDK result: {admin_result['success']}")
            except Exception as e:
                logging.error(f"[DEBUG API] Admin SDK error: {e}")
                strategies_results['admin_sdk'] = {
                    'success': False,
                    'error': str(e),
                    'logs': [f'❌ Admin SDK exception: {e}']
                }
        
        # Determine best result
        best_result = None
        for strategy, result in strategies_results.items():
            if result.get('success'):
                best_result = result
                best_result['strategy_used'] = strategy
                break
        
        if not best_result:
            # If all strategies failed, return combined logs
            all_logs = []
            all_errors = []
            for strategy, result in strategies_results.items():
                all_logs.extend(result.get('logs', []))
                if result.get('error'):
                    all_errors.append(f"{strategy}: {result['error']}")
            
            return jsonify({
                'success': False,
                'error': 'All strategies failed',
                'strategies_tried': list(strategies_results.keys()),
                'all_errors': all_errors,
                'debug_logs': all_logs,
                'strategies_results': strategies_results
            })
        
        return jsonify(best_result)
        
    except Exception as e:
        logging.error(f"[DEBUG API] Critical error: {e}")
        return jsonify({
            'success': False,
            'error': f'Critical error: {str(e)}',
            'debug_info': {
                'timestamp': datetime.now().isoformat(),
                'user_id': user_id if 'user_id' in locals() else 'unknown'
            }
        }), 500
        
        # Fetch devices with debug info
        debug_result = fetch_user_devices_debug(user_id)
        
        # Log the result
        logging.info(f"[DEBUG API] Device fetch completed. Success: {debug_result['success']}, Count: {debug_result['document_count']}")
        
        return jsonify({
            'success': debug_result['success'],
            'user_id': user_id,
            'device_count': debug_result['document_count'],
            'devices': debug_result['devices'],
            'debug_info': debug_result,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        error_msg = str(e)
        logging.error(f"[DEBUG API] Error in fetch-devices-debug: {error_msg}")
        
        return jsonify({
            'success': False,
            'error': error_msg,
            'debug_info': {
                'error_type': type(e).__name__,
                'timestamp': datetime.now().isoformat(),
                'user_id': session.get('user_id', 'Not found')
            }
        }), 500

@bp.route('/test-firebase-simple', methods=['POST'])
def test_firebase_simple():
    """
    Simple Firebase connectivity test without complex queries
    """
    from flask import session
    from ..utils.firebase_utils import get_firestore_db
    import logging
    from datetime import datetime
    
    debug_result = {
        'timestamp': datetime.now().isoformat(),
        'steps': [],
        'success': False,
        'user_id': None,
        'error': None
    }
    
    try:
        # Step 1: Check user authentication
        user_id = session.get('user_id')
        debug_result['user_id'] = user_id
        debug_result['steps'].append(f"[1] ✅ User ID from session: {user_id}")
        
        if not user_id:
            debug_result['error'] = 'User not authenticated - please login again'
            debug_result['debug_info'] = {
                'session_data': {k: v for k, v in dict(session).items() if k != 'csrf_token'},
                'message': 'Session may have expired. Please refresh and login again.'
            }
            return jsonify(debug_result), 401
            
        # Step 2: Get Firebase connection
        debug_result['steps'].append("[2] Connecting to Firestore...")
        db = get_firestore_db()
        debug_result['steps'].append("[2] ✅ Firestore connection established")
        
        # Step 3: Test basic collection access (simplified)
        debug_result['steps'].append("[3] Testing user_devices collection access...")
        user_devices_ref = db.collection('user_devices')
        debug_result['steps'].append("[3] ✅ Referenced user_devices collection")
        
        # Step 4: Try a simple count operation instead of listing all collections
        try:
            debug_result['steps'].append("[4] Attempting simple document count...")
            # Use a simple limit query instead of collections listing
            docs = user_devices_ref.limit(1).get()
            doc_count = len(docs)
            debug_result['steps'].append(f"[4] ✅ Simple query successful, found {doc_count} sample documents")
            
            if doc_count > 0:
                debug_result['steps'].append("[5] Checking document structure...")
                sample_doc = docs[0]
                sample_data = sample_doc.to_dict()
                
                debug_result['steps'].append(f"[5] Sample document ID: {sample_doc.id}")
                debug_result['steps'].append(f"[5] Sample document keys: {list(sample_data.keys())}")
                
                # Check if userId field exists
                if 'userId' in sample_data:
                    debug_result['steps'].append(f"[5] ✅ userId field found: {sample_data['userId']}")
                    
                    # Check if it matches our user
                    if sample_data['userId'] == user_id:
                        debug_result['steps'].append("[5] ✅ Found device belonging to current user!")
                    else:
                        debug_result['steps'].append(f"[5] ⚠️ Sample device belongs to different user: {sample_data['userId']}")
                else:
                    debug_result['steps'].append("[5] ⚠️ No userId field in documents")
            else:
                debug_result['steps'].append("[5] ⚠️ No devices found in user_devices collection")
                
        except Exception as query_error:
            debug_result['steps'].append(f"[4] ❌ Query failed: {query_error}")
            debug_result['collection_exists'] = False
        
        debug_result['success'] = True
        debug_result['steps'].append("[FINAL] ✅ Firebase connectivity test completed successfully")
        
    except Exception as e:
        error_msg = str(e)
        debug_result['error'] = error_msg
        debug_result['steps'].append(f"[ERROR] ❌ {error_msg}")
        logging.error(f"Firebase simple test error: {error_msg}")
    
    return jsonify(debug_result)

@bp.route('/test-firebase-direct', methods=['POST'])
def test_firebase_direct():
    """
    Direct Firebase test - bypasses collections() call and goes straight to user_devices
    """
    from flask import session
    from ..utils.firebase_utils import get_firestore_db
    import logging
    from datetime import datetime
    
    debug_result = {
        'timestamp': datetime.now().isoformat(),
        'steps': [],
        'success': False,
        'user_id': None,
        'error': None
    }
    
    try:
        # Step 1: Check user authentication
        user_id = session.get('user_id')
        debug_result['user_id'] = user_id
        debug_result['steps'].append(f"[1] ✅ User ID from session: {user_id}")
        
        if not user_id:
            debug_result['error'] = 'User not authenticated - please login again'
            return jsonify(debug_result), 401
            
        # Step 2: Get Firebase connection
        debug_result['steps'].append("[2] Connecting to Firestore...")
        db = get_firestore_db()
        debug_result['steps'].append("[2] ✅ Firestore connection established")
        
        # Step 3: Direct test of user_devices collection
        debug_result['steps'].append("[3] Testing user_devices collection directly...")
        user_devices_ref = db.collection('user_devices')
        debug_result['steps'].append("[3] ✅ user_devices collection reference created")
        
        # Step 4: Try to get just 1 document to test collection access
        debug_result['steps'].append("[4] Attempting to get 1 document from user_devices...")
        
        import time
        start_time = time.time()
        
        # Use get() with limit instead of stream() 
        docs = user_devices_ref.limit(1).get()
        
        elapsed = time.time() - start_time
        debug_result['steps'].append(f"[4] ✅ Query completed in {elapsed:.2f} seconds")
        
        doc_count = len(docs)
        debug_result['steps'].append(f"[4] Found {doc_count} documents in collection")
        
        if doc_count > 0:
            sample_doc = docs[0]
            sample_data = sample_doc.to_dict()
            debug_result['steps'].append(f"[5] Sample document ID: {sample_doc.id}")
            debug_result['steps'].append(f"[5] Sample document keys: {list(sample_data.keys())}")
            
            # Check if this is our user's device
            doc_user_id = sample_data.get('userId', 'Not found')
            debug_result['steps'].append(f"[5] Sample document userId: {doc_user_id}")
            
            if doc_user_id == user_id:
                debug_result['steps'].append("[5] ✅ Found device belonging to current user!")
            else:
                debug_result['steps'].append("[5] ⚠️ Sample device belongs to different user")
        else:
            debug_result['steps'].append("[5] ⚠️ No documents found in user_devices collection")
        
        debug_result['success'] = True
        debug_result['steps'].append("[FINAL] ✅ Direct Firebase test completed successfully")
        
    except Exception as e:
        error_msg = str(e)
        debug_result['error'] = error_msg
        debug_result['steps'].append(f"[ERROR] ❌ {error_msg}")
        logging.error(f"Firebase direct test error: {error_msg}")
    
    return jsonify(debug_result)

@bp.route('/test-basic-auth', methods=['POST'])
def test_basic_auth():
    """
    Ultra-simple authentication test - no Firebase queries
    """
    from flask import session
    from datetime import datetime
    
    result = {
        'timestamp': datetime.now().isoformat(),
        'success': True,
        'user_id': session.get('user_id'),
        'session_keys': list(session.keys()),
        'session_data': {k: v for k, v in dict(session).items() if k != 'csrf_token'},
        'message': 'Basic auth test completed'
    }
    
    return jsonify(result)

@bp.route('/test-web-sdk', methods=['POST'])
def test_web_sdk():
    """
    Test Firebase Web SDK connectivity from client-side
    This endpoint just validates session, actual work is done in JavaScript
    """
    from flask import session
    from datetime import datetime
    import logging
    
    try:
        user_id = session.get('user_id')
        
        if not user_id:
            return jsonify({
                'success': False,
                'error': 'User not authenticated',
                'message': 'Please login first'
            }), 401
        
        logging.info(f"[WEB SDK TEST] User {user_id} testing Web SDK")
        
        return jsonify({
            'success': True,
            'user_id': user_id,
            'message': 'Session valid, proceed with Web SDK test',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logging.error(f"[WEB SDK TEST] Error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/test-simple-connection', methods=['POST'])
def test_simple_connection():
    """
    Ultra-simple Firebase connectivity test
    Tests basic connection without complex authentication
    """
    from ..utils.simple_firebase_test import simple_firebase_test, test_with_api_key
    import logging
    from datetime import datetime
    
    try:
        logging.info("[SIMPLE TEST] Starting simple Firebase test")
        
        results = []
        
        # Test 1: Basic connectivity
        basic_result = simple_firebase_test()
        results.append({
            'test': 'basic_connectivity',
            'result': basic_result
        })
        
        # Test 2: API key test
        api_result = test_with_api_key()
        results.append({
            'test': 'api_key_test',
            'result': api_result
        })
        
        # Determine overall success
        overall_success = any(test['result']['success'] for test in results)
        
        return jsonify({
            'success': overall_success,
            'timestamp': datetime.now().isoformat(),
            'tests': results,
            'summary': {
                'total_tests': len(results),
                'passed_tests': sum(1 for test in results if test['result']['success'])
            }
        })
        
    except Exception as e:
        logging.error(f"[SIMPLE TEST] Error: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@bp.route('/fetch-devices-production', methods=['POST'])
def fetch_devices_production():
    """
    Production endpoint to fetch devices using the working REST API method
    Returns devices in format ready for dashboard display
    """
    from flask import session
    from ..utils.firebase_rest import get_rest_client
    import logging
    from datetime import datetime
    
    try:
        # Get user ID from session
        user_id = session.get('user_id')
        
        if not user_id:
            return jsonify({
                'success': False,
                'error': 'User not authenticated'
            }), 401
        
        logging.info(f"[PRODUCTION] Fetching devices for user: {user_id}")
        
        # Use the working REST API method
        rest_client = get_rest_client()
        if not rest_client or not rest_client.credentials:
            return jsonify({
                'success': False,
                'error': 'Firebase REST client not available'
            }), 500
        
        result = rest_client.fetch_user_devices(user_id)
        
        if result['success']:
            # Format devices for dashboard display using the correct Firebase structure
            formatted_devices = []
            for device in result['devices']:
                device_info = device.get('deviceInfo', {})
                formatted_device = {
                    'id': device.get('deviceId', 'Unknown'),
                    'name': device.get('deviceName', 'Unknown Device'),  # Direct field
                    'device_code': device.get('deviceId', 'Unknown'),
                    'device_name': device.get('deviceName', 'Unknown Device'),  # Direct field
                    'model': device.get('deviceModel', 'Unknown Model'),  # Direct field
                    'brand': device_info.get('brand', 'Unknown').title(),  # From deviceInfo
                    'manufacturer': device_info.get('manufacturer', 'Unknown').title(),  # From deviceInfo
                    'product': device_info.get('product', 'Unknown'),  # From deviceInfo
                    'android_version': device.get('androidVersion', 'Unknown'),  # Direct field
                    'app_version': device.get('appVersion', 'Unknown'),  # Direct field
                    'device_type': device.get('deviceType', 'android'),  # Direct field
                    'is_active': device.get('isActive', False),  # Direct field
                    'os_version': f"Android {device.get('androidVersion', 'Unknown')}",
                    'connected_at': device.get('registeredAt', 'Unknown'),  # registeredAt field
                    'last_seen': device.get('lastSeenAt', 'Unknown'),  # lastSeenAt field
                    'location': {
                        'lat': device.get('lastLocation', {}).get('latitude', 0),
                        'lng': device.get('lastLocation', {}).get('longitude', 0)
                    },
                    'status': 'connected' if device.get('isActive', False) else 'offline'
                }
                formatted_devices.append(formatted_device)
            
            logging.info(f"[PRODUCTION] Successfully formatted {len(formatted_devices)} devices")
            
            return jsonify({
                'success': True,
                'devices': formatted_devices,
                'count': len(formatted_devices),
                'user_id': user_id
            })
        else:
            logging.error(f"[PRODUCTION] Device fetch failed: {result['error']}")
            return jsonify({
                'success': False,
                'error': result['error'],
                'logs': result.get('logs', [])
            }), 500
            
    except Exception as e:
        logging.error(f"[PRODUCTION] Critical error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/debug-device-data', methods=['POST'])
def debug_device_data():
    """
    Debug endpoint to see the raw Firebase device data structure
    """
    from flask import session
    from ..utils.firebase_rest import get_rest_client
    import logging
    from datetime import datetime
    
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'success': False, 'error': 'Not authenticated'}), 401
        
        logging.info(f"[DEBUG DATA] Fetching raw device data for user: {user_id}")
        
        rest_client = get_rest_client()
        if not rest_client or not rest_client.credentials:
            return jsonify({'success': False, 'error': 'REST client not available'}), 500
        
        result = rest_client.fetch_user_devices(user_id)
        
        if result['success']:
            # Return the raw device data for inspection
            return jsonify({
                'success': True,
                'raw_devices': result['devices'],
                'device_count': len(result['devices']),
                'sample_device': result['devices'][0] if result['devices'] else None,
                'all_device_keys': [list(device.keys()) for device in result['devices'][:2]]  # First 2 devices' keys
            })
        else:
            return jsonify({
                'success': False,
                'error': result['error'],
                'logs': result.get('logs', [])
            })
            
    except Exception as e:
        logging.error(f"[DEBUG DATA] Error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
