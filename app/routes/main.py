
from flask import Blueprint, render_template, redirect, url_for, request, g, jsonify
import sqlite3

bp = Blueprint('main', __name__)

# Route for /index to render the landing page
@bp.route('/index')
def index_page():
    return render_template('index.html')

@bp.route('/')
def index():
    # Always redirect to dashboard for the root URL
    return redirect(url_for('main.dashboard'))

@bp.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

def home():
    # This will show index.html only when logged in (Firebase Auth)
    # Expect Firebase UID from frontend (e.g., header 'X-User-UID')
    firebase_uid = request.headers.get('X-User-UID')
    if not firebase_uid:
        return redirect(url_for('main.dashboard'))
    # Fetch connected devices for this user
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
            "location": {"lat": 0.0, "lng": 0.0}  # Optionally fetch real location if available
        }
        device_list.append(device_data)
    conn.close()
    # user_name can be fetched from frontend or Firebase if needed
    return render_template('index.html', devices=device_list, user_name='User')

@bp.route('/map/<device_id>')
def show_map(device_id):
    # You can fetch device info from the database if needed
    return render_template('map.html', device_id=device_id)

@bp.route('/get_location/<device_id>')
def get_location(device_id):
    # Fetch the latest location for the device from the database
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
    conn.close()
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