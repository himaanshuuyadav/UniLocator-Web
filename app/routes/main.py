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
        return render_template('dashboard.html', devices=device_list, user_name='User')
    except Exception as e:
        print(f"[DEBUG] Error loading dashboard: {e}")
        return render_template('dashboard.html', devices=[], user_name='User', error="Failed to load dashboard. Please try again later."), 500
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

# Profile route: Only show if authenticated
@bp.route('/profile')
def profile():
    # Use session for authentication
    firebase_uid = session.get('user_id')
    print(f"[DEBUG] /profile session['user_id']: {firebase_uid}")
    if not firebase_uid:
        print("[DEBUG] /profile: Not authenticated, redirecting to landing page.")
        return redirect(url_for('main.index'))
    
    try:
        conn = sqlite3.connect('instance/unilocator.db')
        cursor = conn.cursor()
        
        # Get user info if available
        cursor.execute("""
            SELECT firebase_uid, created_at
            FROM users
            WHERE firebase_uid = ?
        """, (firebase_uid,))
        user_data = cursor.fetchone()
        
        # Get device count for the user
        cursor.execute("""
            SELECT COUNT(*) FROM connected_devices WHERE user_id = ?
        """, (firebase_uid,))
        device_count = cursor.fetchone()[0]
        
        conn.close()
        
        profile_data = {
            'user_id': firebase_uid,
            'created_at': user_data[1] if user_data else 'Unknown',
            'device_count': device_count
        }
        
        return render_template('profile.html', profile=profile_data)
    except Exception as e:
        print(f"[DEBUG] Error loading profile: {e}")
        return redirect(url_for('main.dashboard'))