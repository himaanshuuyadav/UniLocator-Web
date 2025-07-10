from flask import Flask
from flask_socketio import SocketIO
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from .config import Config

socketio = SocketIO()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Enable CORS for all routes
    CORS(app, resources={r"/*": {"origins": "*"}})
    
    # Initialize SocketIO
    socketio.init_app(app, cors_allowed_origins="*")
    
    # Setup Flask-JWT-Extended
    app.config['JWT_SECRET_KEY'] = 'your-very-secret-key'  # Use a strong secret!
    jwt = JWTManager(app)
    
    # Set secret key and session cookie settings
    app.config['SECRET_KEY'] = Config.SECRET_KEY
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
    app.config['SESSION_COOKIE_SECURE'] = False  # Set to True if using HTTPS
    
    # Register blueprints
    from .routes import devices, main, api, auth
    app.register_blueprint(devices.bp, url_prefix='/devices')
    app.register_blueprint(main.bp)
    app.register_blueprint(api.bp)
    app.register_blueprint(auth.bp)
    
    # Serve Firebase web auth static files
    import os
    from flask import send_from_directory

    @app.route('/firebase_auth/web/<path:filename>')
    def firebase_web_auth_static(filename):
        firebase_web_dir = os.path.join(app.root_path, '..', 'firebase_auth', 'web')
        return send_from_directory(firebase_web_dir, filename)

    return app