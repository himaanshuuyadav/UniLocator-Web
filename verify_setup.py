import flask
import flask_socketio
from importlib.metadata import version
from importlib.metadata import version, PackageNotFoundError

import flask
import flask_socketio
import qrcode
from PIL import Image

# Use importlib.metadata to get package versions
try:
    flask_version = version("flask")
    print("Flask version:", flask_version)
except PackageNotFoundError:
    print("Flask is not installed.")

try:
    socketio_version = version("flask-socketio")
    print("Flask-SocketIO version:", socketio_version)
except PackageNotFoundError:
    print("Flask-SocketIO is not installed.")

print("All dependencies loaded successfully!")

def check_imports():
    imports = {
        'Flask': 'flask',
        'Flask-SocketIO': 'flask_socketio',
        'Pillow': 'PIL',
        'QRCode': 'qrcode'
    }
    
    results = []
    for name, module in imports.items():
        try:
            __import__(module)
            results.append(f"✓ {name} successfully imported")
        except ImportError as e:
            results.append(f"✗ {name} import failed: {str(e)}")
    
    return results

def check_dependencies():
    try:
        # Import required packages
        import flask
        import flask_socketio
        import gevent
        import geventwebsocket
        import qrcode
        from PIL import Image

        # Print dependency versions
        print("\nDependency Check Results:")
        print("-" * 50)
        try:
            flask_version = version('flask')
            print(f"✓ Flask: {flask_version}")
        except Exception:
            print("✗ Flask version check failed")

        try:
            socketio_version = version('Flask-SocketIO')
            print(f"✓ Flask-SocketIO: {socketio_version}")
        except Exception:
            print("✗ Flask-SocketIO version check failed")

        try:
            gevent_version = version('gevent')
            print(f"✓ Gevent: {gevent_version}")
        except Exception:
            print("✗ Gevent version check failed")

        try:
            pillow_version = version('Pillow')
            print(f"✓ Pillow: {pillow_version}")
        except Exception:
            print("✗ Pillow version check failed")

        print("-" * 50)
        print("✓ All required packages are installed!")
        return True

    except ImportError as e:
        print(f"\n✗ Import Error: {e}")
        return False

def main():
    print("Checking dependencies...")
    print("-" * 50)
    
    results = check_imports()
    for result in results:
        print(result)
    
    print("-" * 50)

if __name__ == "__main__":
    check_dependencies()