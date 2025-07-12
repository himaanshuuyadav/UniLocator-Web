from flask import Blueprint, render_template, redirect, url_for, request, g, jsonify, session
import sqlite3

bp = Blueprint('main', __name__)


# Route for /index to render the landing page (now index.html)
@bp.route('/index')
def index_page():
    return render_template('index.html')


@bp.route('/')
def index():
    # Show the landing page (index.html) for everyone
    return render_template('index.html')



# Dashboard route: Only show if authenticated, else redirect to home
@bp.route('/dashboard')
def dashboard():
    # Use session for authentication
    firebase_uid = session.get('user_id')
    print(f"[DEBUG] /dashboard session['user_id']: {firebase_uid}")
    if not firebase_uid:
        print("[DEBUG] /dashboard: Not authenticated, redirecting to landing page.")
        return redirect(url_for('main.index'))
    try:
        conn = sqlite3.connect('instance/unilocator.db')
        cursor = conn.cursor()
        cursor.execute("""
            SELECT device_code, device_name, connected_at
            FROM connected_devices
            WHERE user_id = ?
            ORDER BY connected_at DESC
        """, (firebase_uid,))
        devices = cursor.fetchall()
        device_list = []
        for device in devices:
            device_data = {
                "code": device[0],
                "name": device[1],
                "connected_at": device[2],
                "location": {"lat": 0.0, "lng": 0.0}
            }
            device_list.append(device_data)
        return render_template('Dashboard.html', devices=device_list, user_name='User')
    except Exception as e:
        print(f"[DEBUG] Error loading dashboard: {e}")
        return render_template('Dashboard.html', devices=[], user_name='User', error="Failed to load dashboard. Please try again later."), 500
    finally:
        try:
            conn.close()
        except Exception:
            pass



# Home route (optional, can be removed if not needed)
@bp.route('/home')
def home():
    try:
        return render_template('index.html')
    except Exception as e:
        print(f"Error rendering home: {e}")
        return "Error loading home page.", 500

@bp.route('/map/<device_id>')
def show_map(device_id):
    try:
        # You can fetch device info from the database if needed
        return render_template('map.html', device_id=device_id)
    except Exception as e:
        print(f"Error rendering map for device {device_id}: {e}")
        return f"Error loading map for device {device_id}.", 500

@bp.route('/get_location/<device_id>')
def get_location(device_id):
    # Fetch the latest location for the device from the database
    try:
        conn = sqlite3.connect('instance/unilocator.db')
        cursor = conn.cursor()
        cursor.execute("""
            SELECT last_latitude, last_longitude, last_battery, last_network
            FROM connected_devices
            WHERE device_code = ?
            ORDER BY connected_at DESC
            LIMIT 1
        """, (device_id,))
        row = cursor.fetchone()
        if row:
            lat = row[0] if row[0] is not None else 0.0
            lng = row[1] if row[1] is not None else 0.0
            battery = row[2] if row[2] is not None else '--'
            network = row[3] if row[3] is not None else '--'
        else:
            lat, lng, battery, network = 0.0, 0.0, '--', '--'
        return jsonify({
            'lat': lat,
            'lng': lng,
            'battery': battery,
            'network': network
        })
    except Exception as e:
        print(f"Error getting location for device {device_id}: {e}")
        return jsonify({'error': 'Failed to get device location.'}), 500
    finally:
        try:
            conn.close()
        except Exception:
            pass


# Authentication routes - serve Firebase auth pages
@bp.route('/login')
def login_page():
    try:
        import os
        from flask import send_from_directory, current_app
        firebase_web_dir = os.path.join(current_app.root_path, '..', 'firebase_auth', 'web')
        return send_from_directory(firebase_web_dir, 'login.html')
    except Exception as e:
        print(f"Error serving login page: {e}")
        return "Error loading login page.", 500

@bp.route('/register')
def register_page():
    try:
        import os
        from flask import send_from_directory, current_app
        firebase_web_dir = os.path.join(current_app.root_path, '..', 'firebase_auth', 'web')
        return send_from_directory(firebase_web_dir, 'register.html')
    except Exception as e:
        print(f"Error serving register page: {e}")
        return "Error loading register page.", 500

# Profile route: Redirect to dashboard since profile is now integrated
@bp.route('/profile')
def profile():
    # Use session for authentication
    firebase_uid = session.get('user_id')
    print(f"[DEBUG] /profile session['user_id']: {firebase_uid}")
    if not firebase_uid:
        print("[DEBUG] /profile: Not authenticated, redirecting to landing page.")
        return redirect(url_for('main.index'))
    
    # Profile is now integrated into the dashboard, redirect there
    return redirect(url_for('main.dashboard') + '#profile')

# API endpoint for updating profile information
@bp.route('/api/profile/update', methods=['POST'])
def update_profile():
    firebase_uid = session.get('user_id')
    if not firebase_uid:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    try:
        data = request.get_json()
        
        # For now, we'll just return success since user profile data isn't stored in a dedicated table
        # In a full implementation, you'd want to create a user_profiles table
        
        return jsonify({
            'success': True,
            'message': 'Profile updated successfully'
        })
    except Exception as e:
        print(f"[DEBUG] Error updating profile: {e}")
        return jsonify({'success': False, 'error': 'Failed to update profile'}), 500

# API endpoint for getting user stats
@bp.route('/api/profile/stats')
def get_profile_stats():
    firebase_uid = session.get('user_id')
    if not firebase_uid:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    try:
        conn = sqlite3.connect('instance/unilocator.db')
        cursor = conn.cursor()
        
        # Get total devices
        cursor.execute("SELECT COUNT(*) FROM connected_devices WHERE user_id = ?", (firebase_uid,))
        total_devices = cursor.fetchone()[0]
        
        # Get total locations tracked (count of location updates)
        cursor.execute("""
            SELECT COUNT(*) FROM connected_devices 
            WHERE user_id = ? AND (last_latitude IS NOT NULL OR last_longitude IS NOT NULL)
        """, (firebase_uid,))
        locations_tracked = cursor.fetchone()[0]
        
        # Get account age in days
        cursor.execute("SELECT created_at FROM users WHERE firebase_uid = ?", (firebase_uid,))
        user_data = cursor.fetchone()
        account_age = 0
        if user_data and user_data[0]:
            from datetime import datetime
            try:
                created_date = datetime.fromisoformat(user_data[0])
                account_age = (datetime.now() - created_date).days
            except:
                account_age = 0
        
        conn.close()
        
        return jsonify({
            'success': True,
            'stats': {
                'total_devices': total_devices,
                'locations_tracked': locations_tracked,
                'account_age_days': account_age,
                'groups_joined': 0  # Placeholder for future groups feature
            }
        })
    except Exception as e:
        print(f"[DEBUG] Error getting profile stats: {e}")
        return jsonify({'success': False, 'error': 'Failed to get stats'}), 500

# Enhanced Devices API Endpoints
@bp.route('/api/devices/my', methods=['GET'])
def get_my_devices():
    firebase_uid = session.get('user_id')
    if not firebase_uid:
        return jsonify({'success': False, 'message': 'User not authenticated'}), 401
    
    try:
        conn = sqlite3.connect('instance/unilocator.db')
        cursor = conn.cursor()
        
        # Get user's own devices (same account)
        cursor.execute('''
            SELECT device_code, device_name, last_latitude, last_longitude, 
                   connected_at, last_battery, last_network
            FROM connected_devices 
            WHERE user_id = ?
            ORDER BY connected_at DESC
        ''', (firebase_uid,))
        
        devices = []
        for row in cursor.fetchall():
            from datetime import datetime
            last_seen = row[4] or 'Never'
            status = 'offline'
            
            # Determine if device is online (within last 5 minutes)
            if row[4]:
                try:
                    last_seen_dt = datetime.fromisoformat(row[4])
                    minutes_ago = (datetime.now() - last_seen_dt).total_seconds() / 60
                    status = 'online' if minutes_ago < 5 else 'offline'
                except:
                    status = 'offline'
            
            devices.append({
                'id': row[0],
                'name': row[1] or f'Device {row[0][:8]}',
                'type': 'mobile',  # Default type
                'status': status,
                'lastSeen': last_seen,
                'battery': row[5] or 0,
                'network': row[6] or 'Unknown',
                'location': {
                    'lat': row[2] or 0,
                    'lng': row[3] or 0
                }
            })
        
        conn.close()
        return jsonify({'success': True, 'devices': devices})
    
    except Exception as e:
        print(f"Error fetching my devices: {e}")
        return jsonify({'success': False, 'message': 'Failed to fetch devices'}), 500

@bp.route('/api/devices/individual', methods=['GET'])
def get_individual_devices():
    firebase_uid = session.get('user_id')
    if not firebase_uid:
        return jsonify({'success': False, 'message': 'User not authenticated'}), 401
    
    # For now, return empty array - this would be devices manually added by the user
    return jsonify({'success': True, 'devices': []})

@bp.route('/api/devices/groups', methods=['GET'])
def get_device_groups():
    firebase_uid = session.get('user_id')
    if not firebase_uid:
        return jsonify({'success': False, 'message': 'User not authenticated'}), 401
    
    # For now, return empty array - this would be user-created device groups
    return jsonify({'success': True, 'groups': []})

@bp.route('/api/devices/add', methods=['POST'])
def add_device():
    firebase_uid = session.get('user_id')
    if not firebase_uid:
        return jsonify({'success': False, 'message': 'User not authenticated'}), 401
    
    try:
        data = request.get_json()
        device_code = data.get('deviceCode')
        device_name = data.get('deviceName', f'Device {device_code[:8] if device_code else "Unknown"}')
        
        if not device_code:
            return jsonify({'success': False, 'message': 'Device code is required'}), 400
        
        conn = sqlite3.connect('instance/unilocator.db')
        cursor = conn.cursor()
        
        from datetime import datetime
        # Add device to database
        cursor.execute('''
            INSERT INTO connected_devices (device_code, user_id, device_name, connected_at)
            VALUES (?, ?, ?, ?)
        ''', (device_code, firebase_uid, device_name, datetime.now().isoformat()))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Device added successfully'})
    
    except Exception as e:
        print(f"Error adding device: {e}")
        return jsonify({'success': False, 'message': 'Failed to add device'}), 500

# Friends & Social API Endpoints
@bp.route('/api/friends', methods=['GET'])
def get_friends():
    firebase_uid = session.get('user_id')
    if not firebase_uid:
        return jsonify({'success': False, 'message': 'User not authenticated'}), 401
    
    try:
        # For now, return mock data - this would integrate with Firebase users
        friends = [
            {
                'id': 'user001',
                'username': 'alex_smith',
                'displayName': 'Alex Smith',
                'avatar': '/static/img/user-solid.svg',
                'status': 'online',
                'lastSeen': 'Online',
                'mutualFriends': 5,
                'isOnline': True
            },
            {
                'id': 'user002',
                'username': 'sarah_jones',
                'displayName': 'Sarah Jones',
                'avatar': '/static/img/user-solid.svg',
                'status': 'offline',
                'lastSeen': '2 hours ago',
                'mutualFriends': 3,
                'isOnline': False
            }
        ]
        
        return jsonify({'success': True, 'friends': friends})
    
    except Exception as e:
        print(f"Error fetching friends: {e}")
        return jsonify({'success': False, 'message': 'Failed to fetch friends'}), 500

@bp.route('/api/friends/search', methods=['POST'])
def search_friends():
    firebase_uid = session.get('user_id')
    if not firebase_uid:
        return jsonify({'success': False, 'message': 'User not authenticated'}), 401
    
    try:
        data = request.get_json()
        query = data.get('query', '').strip()
        
        if not query:
            return jsonify({'success': False, 'message': 'Search query is required'}), 400
        
        # Mock Firebase search - this would search Firebase users by username/email
        results = [
            {
                'id': 'user004',
                'username': 'john_doe',
                'displayName': 'John Doe',
                'avatar': '/static/img/user-solid.svg',
                'mutualFriends': 2,
                'isFriend': False
            },
            {
                'id': 'user005',
                'username': 'emma_watson',
                'displayName': 'Emma Watson',
                'avatar': '/static/img/user-solid.svg',
                'mutualFriends': 0,
                'isFriend': False
            }
        ]
        
        # Filter results based on query
        filtered_results = [
            user for user in results 
            if query.lower() in user['username'].lower() or 
               query.lower() in user['displayName'].lower()
        ]
        
        return jsonify({'success': True, 'users': filtered_results})
    
    except Exception as e:
        print(f"Error searching friends: {e}")
        return jsonify({'success': False, 'message': 'Failed to search users'}), 500

@bp.route('/api/friends/request', methods=['POST'])
def send_friend_request():
    firebase_uid = session.get('user_id')
    if not firebase_uid:
        return jsonify({'success': False, 'message': 'User not authenticated'}), 401
    
    try:
        data = request.get_json()
        target_user_id = data.get('userId')
        
        if not target_user_id:
            return jsonify({'success': False, 'message': 'Invalid request'}), 400
        
        # This would create a friend request in the database
        return jsonify({'success': True, 'message': 'Friend request sent successfully'})
    
    except Exception as e:
        print(f"Error sending friend request: {e}")
        return jsonify({'success': False, 'message': 'Failed to send friend request'}), 500

@bp.route('/api/friends/requests', methods=['GET'])
def get_friend_requests():
    firebase_uid = session.get('user_id')
    if not firebase_uid:
        return jsonify({'success': False, 'message': 'User not authenticated'}), 401
    
    try:
        # Return empty for now - this would fetch pending friend requests
        return jsonify({'success': True, 'requests': []})
    
    except Exception as e:
        print(f"Error fetching friend requests: {e}")
        return jsonify({'success': False, 'message': 'Failed to fetch friend requests'}), 500

# Chat API Endpoints
@bp.route('/api/chat/messages/<user_id>', methods=['GET'])
def get_chat_messages(user_id):
    firebase_uid = session.get('user_id')
    if not firebase_uid:
        return jsonify({'success': False, 'message': 'User not authenticated'}), 401
    
    try:
        # Mock chat history - this would fetch from database
        messages = [
            {
                'id': 'msg001',
                'senderId': user_id,
                'text': 'Hey! How are you?',
                'timestamp': '2024-01-15T10:30:00Z',
                'type': 'received'
            },
            {
                'id': 'msg002',
                'senderId': firebase_uid,
                'text': "Hi! I'm doing great, thanks! How about you?",
                'timestamp': '2024-01-15T10:32:00Z',
                'type': 'sent'
            }
        ]
        
        return jsonify({'success': True, 'messages': messages})
    
    except Exception as e:
        print(f"Error fetching chat messages: {e}")
        return jsonify({'success': False, 'message': 'Failed to fetch messages'}), 500

@bp.route('/api/chat/send', methods=['POST'])
def send_chat_message():
    firebase_uid = session.get('user_id')
    if not firebase_uid:
        return jsonify({'success': False, 'message': 'User not authenticated'}), 401
    
    try:
        data = request.get_json()
        message_text = data.get('message')
        recipient_id = data.get('recipientId')
        
        if not message_text or not recipient_id:
            return jsonify({'success': False, 'message': 'Message and recipient required'}), 400
        
        # This would save the message to database and emit via WebSocket
        import time
        message_id = f"msg_{int(time.time())}"
        
        from datetime import datetime
        return jsonify({
            'success': True, 
            'messageId': message_id,
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        print(f"Error sending message: {e}")
        return jsonify({'success': False, 'message': 'Failed to send message'}), 500

# Groups API Endpoints
@bp.route('/api/groups/create', methods=['POST'])
def create_group():
    firebase_uid = session.get('user_id')
    if not firebase_uid:
        return jsonify({'success': False, 'message': 'User not authenticated'}), 401
    
    try:
        data = request.get_json()
        group_name = data.get('name')
        group_description = data.get('description', '')
        group_privacy = data.get('privacy', 'private')
        
        if not group_name:
            return jsonify({'success': False, 'message': 'Group name is required'}), 400
        
        # This would create group in database
        import time
        group_id = f"group_{int(time.time())}"
        
        return jsonify({
            'success': True, 
            'groupId': group_id,
            'message': 'Group created successfully'
        })
    
    except Exception as e:
        print(f"Error creating group: {e}")
        return jsonify({'success': False, 'message': 'Failed to create group'}), 500

@bp.route('/api/groups', methods=['GET'])
def get_groups():
    firebase_uid = session.get('user_id')
    if not firebase_uid:
        return jsonify({'success': False, 'message': 'User not authenticated'}), 401
    
    try:
        # Return empty for now - this would fetch user's groups
        return jsonify({'success': True, 'groups': []})
    
    except Exception as e:
        print(f"Error fetching groups: {e}")
        return jsonify({'success': False, 'message': 'Failed to fetch groups'}), 500

# Live Map API Endpoints
@bp.route('/api/map/devices', methods=['GET'])
def get_map_devices():
    firebase_uid = session.get('user_id')
    if not firebase_uid:
        return jsonify({'success': False, 'message': 'User not authenticated'}), 401
    
    try:
        device_filter = request.args.get('filter', 'all')
        
        conn = sqlite3.connect('instance/unilocator.db')
        cursor = conn.cursor()
        
        # Get all devices for map display
        cursor.execute('''
            SELECT device_code, device_name, last_latitude, last_longitude, 
                   connected_at, user_id
            FROM connected_devices 
            WHERE last_latitude IS NOT NULL AND last_longitude IS NOT NULL
            ORDER BY connected_at DESC
        ''', ())
        
        devices = []
        for row in cursor.fetchall():
            device_category = 'my-device' if row[5] == firebase_uid else 'friend-device'
            
            devices.append({
                'id': row[0],
                'name': row[1] or f'Device {row[0][:8]}',
                'type': 'mobile',
                'category': device_category,
                'location': {
                    'lat': row[2],
                    'lng': row[3]
                },
                'lastSeen': row[4] or 'Never'
            })
        
        # Filter devices based on request
        if device_filter != 'all':
            if device_filter == 'my-devices':
                devices = [d for d in devices if d['category'] == 'my-device']
            elif device_filter == 'friends':
                devices = [d for d in devices if d['category'] == 'friend-device']
            elif device_filter == 'groups':
                devices = [d for d in devices if d['category'] == 'group-device']
        
        conn.close()
        return jsonify({'success': True, 'devices': devices})
    
    except Exception as e:
        print(f"Error fetching map devices: {e}")
        return jsonify({'success': False, 'message': 'Failed to fetch map devices'}), 500