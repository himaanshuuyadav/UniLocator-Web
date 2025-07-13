import logging
from app import create_app, socketio

# Configure logging
logging.basicConfig(
    level=logging.INFO,  # or DEBUG for more verbosity
    format='%(asctime)s %(levelname)s %(message)s'
)

app = create_app()

if __name__ == '__main__':
    print("Starting UniLocator server...")
    print("Open http://10.250.43.156:5000 in your browser.")
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)