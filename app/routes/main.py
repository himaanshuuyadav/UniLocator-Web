from flask import Blueprint, render_template, redirect, url_for, session, g
import sqlite3

bp = Blueprint('main', __name__)

@bp.route('/')
def index():
    # Always redirect to dashboard for the root URL
    return redirect(url_for('main.dashboard'))

@bp.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@bp.route('/home')
def home():
    # This will show index.html only when logged in
    if 'user_id' not in session:
        return redirect(url_for('main.dashboard'))
    user_id = session['user_id']
    # Fetch connected devices for this user
    conn = sqlite3.connect('instance/unilocator.db')
    cursor = conn.cursor()
    cursor.execute("""
        SELECT device_code, device_name, connected_at
        FROM connected_devices
        WHERE user_id = ?
        ORDER BY connected_at DESC
    """, (user_id,))
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
    return render_template('index.html', devices=device_list, user_name=session.get('user_name', 'User'))