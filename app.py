from flask import Flask, request, jsonify, render_template, redirect, url_for, session, flash
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import secrets
import qrcode
import json
from io import BytesIO
import base64

app = Flask(__name__)
app.secret_key = 'your-secret-key'


@app.route("/login", methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        conn = sqlite3.connect('unilocator.db')
        cursor = conn.cursor()
        
        try:
            cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
            user = cursor.fetchone()
            
            if user and check_password_hash(user[3], password):
                session['user_id'] = user[0]
                session['user_name'] = user[1]
                return redirect(url_for('index'))
            else:
                flash("Invalid email or password", "error")
        except Exception as e:
            flash(f"An error occurred: {str(e)}", "error")
        finally:
            conn.close()
            
        return redirect(url_for('login'))
        
    return render_template('login.html')

@app.route("/register", methods=['GET', 'POST'])
def register():
    if 'user_id' in session:
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        password = request.form.get('password')
        
        if not all([name, email, password]):
            flash("All fields are required", "error")
            return redirect(url_for('register'))
            
        conn = sqlite3.connect('unilocator.db')
        cursor = conn.cursor()
        
        try:
            cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
            if cursor.fetchone():
                flash("Email already registered", "error")
                return redirect(url_for('register'))
            
            hashed_password = generate_password_hash(password)
            cursor.execute("INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
                         (name, email, hashed_password))
            conn.commit()
            flash("Registration successful! Please log in.", "success")
            return redirect(url_for('login'))
            
        except Exception as e:
            flash(f"An error occurred: {str(e)}", "error")
            return redirect(url_for('register'))
        finally:
            conn.close()
            
    return render_template('register.html')  # Changed from auth.html to register.html
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

@app.route("/index")
@login_required
def index():
    if 'user_id' not in session:
        return redirect(url_for('auth'))
    devices = list(device_locations.keys())
    return render_template("index.html", devices=devices)

@app.route("/device/<device_id>")
def show_device_map(device_id):
    return render_template("map.html", device_id=device_id)

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
@app.route("/")
def home():
    if 'user_id' in session:
        return redirect(url_for('index'))
    return render_template("Dashboard.html")  # Changed from index.html to Dashboard.html

# Add a logout route
@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for('home'))

@app.route("/add-device", methods=['GET', 'POST'])
@login_required
def add_device():
    if request.method == 'POST':
        # Generate a unique 8-character code
        unique_code = secrets.token_urlsafe(6)
        user_id = session['user_id']
        
        # Create connection data
        connection_data = {
            "server_url": "http://your-server:5000",
            "user_id": user_id,
            "device_code": unique_code
        }
        
        # Generate QR code
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(json.dumps(connection_data))
        qr.make(fit=True)
        
        # Create QR code image
        img_buffer = BytesIO()
        qr_image = qr.make_image(fill_color="black", back_color="white")
        qr_image.save(img_buffer, format="PNG")
        qr_code = base64.b64encode(img_buffer.getvalue()).decode()
        
        # Store the pending device code in database
        conn = sqlite3.connect('unilocator.db')
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO pending_devices (user_id, device_code, created_at)
            VALUES (?, ?, datetime('now'))
        """, (user_id, unique_code))
        conn.commit()
        conn.close()
        
        return jsonify({
            "unique_code": unique_code,
            "qr_code": qr_code
        })
    
    return render_template("add_device.html")

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)
