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
    
    # Register blueprints
    from .routes import auth, devices, main, api
    app.register_blueprint(auth.bp, url_prefix='/auth')
    app.register_blueprint(devices.bp, url_prefix='/devices')  # Add this line
    app.register_blueprint(main.bp)
    app.register_blueprint(api.bp)
    
    return app