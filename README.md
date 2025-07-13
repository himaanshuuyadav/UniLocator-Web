# UniLocator 📍

**UniLocator** is an advanced web application for real-time device tracking and management. Built with **Python**, **Flask**, and **Firebase**, it offers a seamless experience for monitoring device locations, managing connections, and accessing location history through a modern, responsive interface. Whether for personal use or fleet management,## 🐛 Issues & Support

Found a bug or have a feature request? 

1. **Check existing issues** in the GitHub repository
2. **Create a new issue** with detailed information:
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Python version, browser)
   - Firebase project configuration (without sensitive data)
3. **For Firebase-related issues**: Include browser console errors
4. **For authentication issues**: Check Firebase Console for error logs

## 🚀 Deployment

### Production Checklist

- [ ] Set up Firebase project with production configuration
- [ ] Configure secure Firestore rules
- [ ] Set up environment variables for sensitive data
- [ ] Enable Firebase App Check
- [ ] Configure proper CORS settings
- [ ] Set up SSL/HTTPS
- [ ] Configure backup strategies for data

### Recommended Hosting

- **Backend**: Railway, Heroku, or Google Cloud Run
- **Frontend**: Firebase Hosting (for static assets)
- **Database**: Firebase Firestore (already cloud-hosted)iLocator combines cutting-edge technology with an intuitive design to keep you connected to your devices.

## 🚀 Features

- **Real-Time Tracking**: Monitor device locations with precise latitude and longitude updates on an interactive map powered by Leaflet.
- **Device Management**: Add devices via QR codes or unique codes, view connected devices, and track their status.
- **Location History**: Access and analyze historical device movements.
- **Firebase Authentication**: Secure user registration and login system with Firebase Auth and real-time database.
- **Real-Time Updates**: Instant notifications for device connections and location changes via Socket.IO WebSockets.
- **QR Code Integration**: Generate and scan QR codes for quick device pairing.
- **Responsive Design**: Sleek, mobile-friendly UI with particle animations (particles.js) and smooth scrolling.
- **Cloud Database**: Firebase Firestore for scalable, real-time data storage and synchronization.
- **Cross-Platform Support**: Web-based interface accessible on desktops, tablets, and smartphones.

## 🛠️ Tech Stack

| Component | Technology | Purpose |
| --- | --- | --- |
| **Backend** | Python (Primary Language), Flask, Flask-SocketIO | Server-side logic, API, real-time communication |
| **Database** | Firebase Firestore, SQLite (local development) | Cloud database, user data, device information |
| **Authentication** | Firebase Authentication | Secure user registration, login, session management |
| **Frontend** | HTML, CSS, JavaScript, Leaflet, particles.js | User interface, interactive maps, animations |
| **Libraries** | qrcode, gevent, Pillow | QR code generation, WebSocket support, image processing |
| **Styling** | Custom CSS, Font Awesome | Modern UI design, icons |
| **Deployment** | Configured for `0.0.0.0:5000` | Development server |

**Primary Language**: Python (\~70% of codebase), with JavaScript (\~20%) and HTML/CSS (\~10%) for frontend.

## 📸 Screenshots

| Dashboard | Add Device Modal | Live Map |
| --- | --- | --- |
|  |  |  |

*Note: Replace placeholder screenshot paths with actual images for best results.*

## 📦 Installation & Setup

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Git
- A Google account for Firebase setup
- Node.js (optional, for frontend development)

### Step 1: Clone the Repository

```bash
git clone https://github.com/himaanshuuyadav/Unilocator.git
cd Unilocator
```

### Step 2: Set Up Firebase Project

1. **Create Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Create a project" or "Add project"
   - Enter project name (e.g., "unilocator-yourname")
   - Follow the setup wizard (disable Google Analytics if not needed)

2. **Enable Authentication**:
   - In Firebase Console, go to **Authentication** → **Get started**
   - Go to **Sign-in method** tab
   - Enable **Email/Password** provider
   - Click **Save**

3. **Enable Firestore Database**:
   - In Firebase Console, go to **Firestore Database** → **Create database**
   - Choose **Start in test mode** (we'll secure it later)
   - Select a location closest to your users
   - Click **Done**

4. **Get Web App Configuration**:
   - In Firebase Console, go to **Project Settings** (gear icon)
   - Scroll down to "Your apps" section
   - Click **Web app icon** (`</>`) to add a web app
   - Enter app nickname (e.g., "UniLocator Web")
   - **Copy the Firebase config object** (you'll need this)

5. **Configure Authorized Domains**:
   - In Firebase Console, go to **Authentication** → **Settings** → **Authorized domains**
   - Add the following domains:
     - `localhost`
     - `127.0.0.1`
     - Your local IP (e.g., `192.168.1.100` or `10.250.43.156`)

6. **Set Up Firestore Security Rules**:
   - In Firebase Console, go to **Firestore Database** → **Rules**
   - Replace the rules with:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Allow authenticated users to read/write their data
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```
   - Click **Publish**

### Step 3: Configure Firebase in Your Project

1. **Create Firebase Configuration File**:
   ```bash
   # Navigate to the firebase_auth/web directory
   cd firebase_auth/web
   
   # Copy the template file
   cp firebase-config-cdn.template.js firebase-config-cdn.js
   ```

2. **Update Firebase Configuration**:
   - Open `firebase_auth/web/firebase-config-cdn.js`
   - Replace the placeholder values with your Firebase config:
   ```javascript
   const firebaseConfig = {
     apiKey: "your-api-key-here",
     authDomain: "your-project-id.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project-id.firebasestorage.app",
     messagingSenderId: "your-sender-id",
     appId: "your-app-id",
     measurementId: "your-measurement-id"
   };
   ```

3. **Update ES6 Module Configuration** (if using):
   - Open `firebase_auth/config/firebase-config.js`
   - Update with the same Firebase config values

### Step 4: Set Up Python Environment

1. **Create Virtual Environment**:
   ```bash
   # Go back to project root
   cd ../..
   
   # Create virtual environment
   python -m venv venv
   
   # Activate virtual environment
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

2. **Install Python Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
   
   Or install manually:
   ```bash
   pip install flask flask-socketio gevent qrcode pillow
   ```

### Step 5: Initialize Local Database

```bash
python init_db.py
```

### Step 6: Configure Application Settings

1. **Update Flask Configuration**:
   - Open `app/config.py`
   - Update any necessary configuration settings

2. **Verify Setup**:
   ```bash
   python verify_setup.py
   ```

### Step 7: Run the Application

```bash
python run.py
```

The application will start on `http://localhost:5000` or your configured IP address.

### Step 8: Test the Setup

1. **Open your browser** and navigate to the application URL
2. **Register a new account** using the signup form
3. **Login** with your credentials
4. **Verify** that you can access the dashboard

### Troubleshooting

- **Firebase Auth errors**: Check authorized domains in Firebase Console
- **Firestore errors**: Verify security rules are published
- **Connection issues**: Ensure your IP is added to authorized domains
- **Python errors**: Check that all dependencies are installed in the virtual environment

## 📖 Usage

1. **Create an Account**

   - Visit the application URL (e.g., `http://localhost:5000`).
   - Click "Sign up" and provide your email and password to register.
   - You'll be automatically logged in after successful registration.

2. **Log In**

   - If you already have an account, click "Login" and enter your credentials.
   - Firebase handles authentication securely in the background.

3. **Add a Device**

   - From the dashboard, click "Add New Device".
   - Follow the modal steps to set up device pairing.
   - Choose a connection method (QR code or unique code).
   - Use the mobile app to scan/enter the code for device connection.

4. **Track Devices**

   - View all connected devices on the main dashboard.
   - Click a device to access its details or view its live location on the map.
   - Location updates are synchronized in real-time through Firebase.

5. **Debug Database** (Development)

   - Run `python db_checker.py` to view local database schema and data.
   - Check Firebase Console for cloud database information.

## 📁 Project Structure

```
UniLocator/
├── app/                    # Main Flask application
│   ├── __init__.py        # Flask app factory
│   ├── config.py          # Application configuration
│   ├── models/            # Data models
│   │   ├── __init__.py
│   │   ├── device.py      # Device model
│   │   └── user.py        # User model
│   ├── routes/            # Flask routes/blueprints
│   │   ├── __init__.py
│   │   ├── api.py         # API endpoints
│   │   ├── auth.py        # Authentication routes
│   │   ├── devices.py     # Device management routes
│   │   └── main.py        # Main application routes
│   ├── static/            # Static assets
│   │   ├── css/           # Stylesheets
│   │   │   ├── Dashboard.css
│   │   │   ├── add_device.css
│   │   │   ├── auth.css
│   │   │   ├── main.css
│   │   │   └── map.css
│   │   ├── js/            # JavaScript files
│   │   │   ├── Dashboard.js
│   │   │   ├── add_device.js
│   │   │   ├── auth.js
│   │   │   ├── main.js
│   │   │   ├── map.js
│   │   │   ├── particles-config.js
│   │   │   ├── particles.js
│   │   │   └── smooth-scroll.js
│   │   └── img/           # Images
│   │       ├── empty-devices.svg
│   │       └── galaxy_a03.png
│   ├── templates/         # HTML templates
│   │   ├── base.html      # Base template
│   │   ├── Dashboard.html # Main dashboard
│   │   ├── index.html     # Landing page
│   │   ├── map.html       # Device map view
│   │   └── auth/          # Authentication templates
│   │       ├── login.html
│   │       └── register.html
│   └── utils/             # Utility modules
│       ├── __init__.py
│       └── database.py    # Database utilities
├── firebase_auth/         # Firebase authentication setup
│   ├── config/            # Firebase configurations
│   │   ├── firebase-config.js          # ES6 module config
│   │   └── firebase-config.template.js # Template file
│   ├── web/               # Web-specific Firebase files
│   │   ├── auth-helper.js              # Authentication helper
│   │   ├── auth-service.js             # Auth service (ES6)
│   │   ├── auth-service-cdn.js         # Auth service (CDN)
│   │   ├── auth-service-secure.js      # Secure auth service
│   │   ├── firebase-config-cdn.js      # CDN configuration
│   │   ├── firebase-config-cdn.template.js # Template
│   │   ├── firebase-init-cdn.html      # CDN initialization
│   │   ├── login.html                  # Login page
│   │   └── register.html               # Registration page
│   └── README.md          # Firebase setup instructions
├── instance/              # Instance-specific files
│   ├── schema.sql         # Database schema
│   └── unilocator.db      # SQLite database (local)
├── tests/                 # Test files
│   └── __init__.py
├── backup/                # Backup files
│   ├── app.py             # Legacy app file
│   ├── db checker.py      # Database checker
│   └── locations.json     # Sample location data
├── __pycache__/           # Python cache files
├── init_db.py             # Database initialization
├── run.py                 # Application entry point
├── verify_setup.py        # Setup verification script
├── requirements.txt       # Python dependencies
├── README.md              # Project documentation (this file)
└── .gitignore             # Git ignore rules
```

## 🌟 Why UniLocator?

- **Modern Architecture**: Flask backend with Firebase cloud services for scalability
- **Real-Time Synchronization**: Firebase Firestore ensures data consistency across devices
- **Secure Authentication**: Firebase Auth provides enterprise-grade security
- **Developer-Friendly**: Well-documented Python codebase with modular design
- **User-Centric**: Intuitive interface with real-time feedback and responsive design
- **Scalable**: Cloud-first architecture ready for production deployment
- **Open Source**: Free to use and modify under the MIT License

## 🔧 Development

### Environment Variables

For production deployment, consider using environment variables:

```bash
# .env file (create this, don't commit to git)
FLASK_ENV=development
FLASK_DEBUG=True
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_API_KEY=your-api-key
```

### Development Mode

```bash
# Enable debug mode
export FLASK_DEBUG=1  # Linux/macOS
set FLASK_DEBUG=1     # Windows

# Run with auto-reload
python run.py
```

### Security Considerations

- Never commit Firebase API keys to version control
- Use environment variables for sensitive configuration
- Implement proper Firestore security rules for production
- Enable Firebase App Check for additional security

## 🤝 Contributing

We welcome contributions to make UniLocator even better! To contribute:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/awesome-feature`).
3. Commit your changes (`git commit -m 'Add awesome feature'`).
4. Push to the branch (`git push origin feature/awesome-feature`).
5. Open a pull request.

Please follow PEP 8 for Python code and include clear documentation.

## 🐛 Issues & Support

Found a bug or have a feature request? Open an issue with details, and we’ll address it promptly.

## 📜 License

This project is licensed under the MIT License. Feel free to use, modify, and distribute as needed.

## 👨‍💻 Author

Developed by Himaanshu Yadav.\
Connect with me on LinkedIn or open an issue for feedback!

---

# ⭐ **Star this repository** if you find UniLocator useful!\\

### Happy tracking! 🚀
