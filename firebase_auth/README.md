# Firebase Authentication Setup

## Security Notice
This project uses Firebase Authentication. The actual Firebase configuration keys are kept private for security reasons.

## Setup Instructions

### 1. Create your Firebase project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Enable Authentication with Email/Password provider
4. Enable Firestore Database

### 2. Get your configuration
1. In Firebase Console, go to Project Settings > General
2. Scroll down to "Your apps" section
3. Click on the web app icon or "Add app" if none exists
4. Copy the Firebase configuration object

### 3. Configure the project
1. Copy `firebase_auth/config/firebase-config.template.js` to `firebase-config.js`
2. Replace the placeholder values with your actual Firebase config
3. Or create a `.env` file in the root directory with your config values

### 4. Files to keep private
**Never commit these files to git:**
- `firebase_auth/config/firebase-config.js` (contains actual keys)
- `.env` (contains environment variables)
- Any file with actual Firebase API keys

### 5. Security Rules for Firestore
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Add other collection rules as needed
  }
}
```

### 6. Usage
```javascript
import authService from './firebase_auth/web/auth-service-secure.js';

// Login
const result = await authService.login(email, password);
if (result.success) {
  console.log('Login successful:', result.user);
} else {
  console.error('Login failed:', result.error);
}

// Register
const result = await authService.register(email, password, username);

// Logout
await authService.logout();

// Check if logged in
if (authService.isLoggedIn()) {
  const user = authService.getCurrentUser();
}
```

## Important Security Notes
1. **API Key**: While the Firebase API key is not a secret, it should still be protected from abuse
2. **Domain Restrictions**: Configure authorized domains in Firebase Console
3. **Security Rules**: Always implement proper Firestore security rules
4. **Environment Variables**: Use environment variables in production
5. **HTTPS**: Always use HTTPS in production
