from app import create_app
from app.utils.database import init_db
import os

def main():
    app = create_app()
    
    with app.app_context():
        # Ensure instance directory exists
        os.makedirs('instance', exist_ok=True)
        
        # Initialize database
        init_db()
        print(f"Database initialized successfully at: {app.config['DATABASE']}")
        print(f"Using schema from: {app.config['SCHEMA_PATH']}")

if __name__ == "__main__":
    main()