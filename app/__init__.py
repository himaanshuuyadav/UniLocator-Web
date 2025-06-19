from flask import Flask
from flask_socketio import SocketIO
from .config import Config

socketio = SocketIO()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Initialize SocketIO
    socketio.init_app(app, cors_allowed_origins="*")
    
    # Register blueprints
    from .routes import auth, devices, main
    app.register_blueprint(auth.bp)
    app.register_blueprint(devices.bp)
    app.register_blueprint(main.bp)
    
    return app