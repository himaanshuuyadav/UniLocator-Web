from flask import Flask, request, jsonify, render_template, redirect, url_for, session, flash
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import secrets
import qrcode
import io
import base64
import random
import string
import json
from io import BytesIO  # Add this import
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.secret_key = 'your-secret-key'

# Initialize SocketIO
socketio = SocketIO(app)

def init_db():
    conn = sqlite3.connect('unilocator.db')
    cursor = conn.cursor()
    
    # Create users table first
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create pending_devices table with proper foreign key
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS pending_devices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            device_code TEXT UNIQUE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    
    # Create connected_devices table with proper foreign key
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS connected_devices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            device_code TEXT UNIQUE NOT NULL,
            device_name TEXT NOT NULL,
            connected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    
    # Enable foreign key support
    cursor.execute("PRAGMA foreign_keys = ON")
    
    conn.commit()
    conn.close()


@app.route("/login", methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        conn = sqlite3.connect('unilocator.db')
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, password FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()
        conn.close()
        if user and check_password_hash(user[2], password):
            session.clear()
            session['user_id'] = user[0]
            session['user_name'] = user[1]
            return redirect(url_for('home'))
        else:
            flash("Invalid email or password", "error")
            return render_template("login.html")
    return render_template("login.html")

@app.route("/register", methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        password = request.form.get('password')
        hashed_password = generate_password_hash(password)
        conn = sqlite3.connect('unilocator.db')
        cursor = conn.cursor()
        try:
            cursor.execute("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", (name, email, hashed_password))
            conn.commit()
            user_id = cursor.lastrowid
            session.clear()
            session['user_id'] = user_id
            session['user_name'] = name
            return redirect(url_for('home'))
        except sqlite3.IntegrityError:
            flash("Email already registered", "error")
            return render_template("register.html")
        finally:
            conn.close()
    return render_template("register.html")  # Changed from auth.html to register.html
# Store locations for multiple devices
device_locations = {}  # e.g., {"galaxy_a03": {"lat": ..., "lng": ...}, ...}
device_history = {}    # Optional: {"galaxy_a03": [loc1, loc2, ...], ...}

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))  # Changed from 'auth' to 'login'
        return f(*args, **kwargs)
    return decorated_function

# Remove or comment out this route
# @app.route("/")
# @login_required
# def index():
#     ...

# Update the home route to properly handle both logged-in and non-logged-in states
@app.route("/")
def home():
    if 'user_id' in session:
        # If user is logged in, get their devices
        conn = sqlite3.connect('unilocator.db')
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                SELECT device_code, device_name, connected_at, user_id
                FROM connected_devices 
                WHERE user_id = ?
                ORDER BY connected_at DESC
            """, (session['user_id'],))
            
            devices = cursor.fetchall()
            device_list = []
            for device in devices:
                device_data = {
                    "code": device[0],
                    "name": device[1],
                    "connected_at": device[2],
                    "user_id": device[3],
                    "location": device_locations.get(device[0], {"lat": 0.0, "lng": 0.0})
                }
                device_list.append(device_data)
            
            return render_template(
                "index.html",
                devices=device_list,
                user_name=session.get('user_name', 'User')
            )
        except Exception as e:
            print(f"Database error: {str(e)}")
            return render_template("index.html", devices=[], error=str(e))
        finally:
            conn.close()
    
    # If user is not logged in, show the dashboard
    return render_template("dashboard.html")

@app.route("/device/<device_id>")
def device_details(device_id):
    # Your device details code here
    return render_template("device.html", device_id=device_id)

@app.route("/location/<device_id>", methods=["POST"])
def update_location(device_id):
    data = request.get_json()

    if not data or "lat" not in data or "lng" not in data:
        return jsonify({"status": "error", "message": "Invalid data"}), 400

    lat = data["lat"]
    lng = data["lng"]

    device_locations[device_id] = {"lat": lat, "lng": lng}

    # Store history (optional)
    if device_id not in device_history:
        device_history[device_id] = []
    device_history[device_id].append({"lat": lat, "lng": lng})

    print(f"📍 Updated {device_id} location: {device_locations[device_id]}")
    return jsonify({"status": "ok"})

@app.route("/get_location/<device_id>", methods=["GET"])
def get_location(device_id):
    location = device_locations.get(device_id)
    if location:
        return jsonify(location)
    return jsonify({"error": "Device not found"}), 404

@app.route("/get_history/<device_id>", methods=["GET"])
def get_history(device_id):
    return jsonify(device_history.get(device_id, []))

@app.route("/map/<device_id>")
def show_map(device_id):
    return render_template("map.html", device_id=device_id)

# Add a logout route
@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for('login'))

@app.route("/add-device", methods=['GET', 'POST'])
@login_required
def add_device():
    if request.method == 'POST':
        # Generate a unique 6-character code
        unique_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        user_id = session['user_id']
        
        # Create connection data with proper server URL
        server_url = request.host_url.rstrip('/')  # Get the actual server URL
        connection_data = {
            "server_url": server_url,
            "user_id": user_id,
            "device_code": unique_code
        }
        
        try:
            # Store the pending device code in database first
            conn = sqlite3.connect('unilocator.db')
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO pending_devices (user_id, device_code, created_at)
                VALUES (?, ?, datetime('now'))
            """, (user_id, unique_code))
            conn.commit()

            # Generate QR code after successful database insertion
            qr = qrcode.QRCode(version=1, box_size=10, border=5)
            qr.add_data(json.dumps(connection_data))
            qr.make(fit=True)
            
            # Create QR code image
            img_buffer = BytesIO()
            qr_image = qr.make_image(fill_color="black", back_color="white")
            qr_image.save(img_buffer, format="PNG")
            qr_code = base64.b64encode(img_buffer.getvalue()).decode()
            
            return jsonify({
                "status": "success",
                "unique_code": unique_code,
                "qr_code": f"data:image/png;base64,{qr_code}"
            })
            
        except sqlite3.IntegrityError:
            # Handle case where code already exists
            return jsonify({
                "status": "error",
                "message": "Failed to generate unique code, please try again"
            }), 500
        except Exception as e:
            print(f"Error generating device code: {e}")
            return jsonify({
                "status": "error",
                "message": str(e)
            }), 500
        finally:
            if 'conn' in locals():
                conn.close()
    
    return render_template("add_device.html")

@app.route("/connect-device", methods=['POST'])
def connect_device():
    data = request.get_json()
    if not data or 'device_code' not in data:
        return jsonify({"status": "error", "message": "Missing device code"}), 400

    device_code = data['device_code']
    conn = sqlite3.connect('unilocator.db')
    cursor = conn.cursor()
    
    try:
        # Check if device exists in pending_devices
        cursor.execute("""
            SELECT user_id FROM pending_devices 
            WHERE device_code = ? 
        """, (device_code,))
        pending_device = cursor.fetchone()
        
        if not pending_device:
            return jsonify({"status": "error", "message": "Invalid code"}), 404
            
        user_id = pending_device[0]
        device_name = f"Device_{device_code[:6]}"
        
        # Add to connected_devices
        cursor.execute("""
            INSERT INTO connected_devices (user_id, device_code, device_name)
            VALUES (?, ?, ?)
        """, (user_id, device_code, device_name))
        
        # Remove from pending_devices
        cursor.execute("DELETE FROM pending_devices WHERE device_code = ?", (device_code,))
        conn.commit()

        # Emit socket event for real-time update
        socketio.emit('device_connected', {
            'device_code': device_code,
            'device_name': device_name,
            'user_id': user_id
        }, room=str(user_id))
        
        return jsonify({
            "status": "success",
            "message": "Device connected successfully",
            "device_name": device_name
        })
        
    except Exception as e:
        print(f"Error connecting device: {e}")
        conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        conn.close()

@app.route("/check-connection", methods=['POST'])
def check_connection():
    data = request.get_json()
    device_code = data.get('device_code')
    
    if not device_code:
        return jsonify({"connected": False}), 400
        
    conn = sqlite3.connect('unilocator.db')
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT id FROM connected_devices 
            WHERE device_code = ?
        """, (device_code,))
        device = cursor.fetchone()
        
        return jsonify({
            "connected": bool(device)
        })
    finally:
        conn.close()
        
@app.route('/generate-device-code', methods=['POST'])
@login_required
def generate_device_code():
    # Generate a unique 6-character code
    code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    
    # Generate QR code
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(code)
    qr.make(fit=True)
    
    # Create QR code image
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert image to base64
    img_buffer = io.BytesIO()
    img.save(img_buffer, format='PNG')
    img_str = base64.b64encode(img_buffer.getvalue()).decode()
    
    return jsonify({
        'unique_code': code,
        'qr_code': f'data:image/png;base64,{img_str}'
    })
    
if __name__ == "__main__":
    # Initialize database
    init_db()
    
    # Create test user if not exists
    conn = sqlite3.connect('unilocator.db')
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            INSERT OR IGNORE INTO users (name, email, password)
            VALUES (?, ?, ?)
        """, ('Test User', 'test@example.com', generate_password_hash('password123')))
        conn.commit()
    finally:
        conn.close()
    
    app.run(host='0.0.0.0', port=5000, debug=True)
