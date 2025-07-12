# Firebase Setup Guide for UniLocator Flutter App

This guide explains how to set up Firebase for the UniLocator Flutter application using the existing Firebase project configuration.

## 📋 Prerequisites

- Flutter SDK installed and configured
- Android Studio or VS Code with Flutter extensions
- Access to the existing Firebase project (`unilocator-a542b`)

## 🔥 Firebase Project Configuration

The app is already configured to use the existing Firebase project:
- **Project ID**: `unilocator-a542b`
- **Package Name**: `com.pramanshav.unilocator`

## 🛠️ Setup Steps

### 1. Firebase Core Initialization

The app automatically initializes Firebase in `main.dart`:

```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  runApp(const UniLocatorApp());
}
```

### 2. Android Configuration

The `google-services.json` file is already configured and placed in:
```
android/app/google-services.json
```

### 3. Required Permissions

The following permissions are already configured in `AndroidManifest.xml`:

```xml
<!-- Location permissions -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />

<!-- Camera and storage for profile pictures -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />

<!-- Network permissions -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

## 📊 Firestore Database Structure

The app uses the following Firestore collections:

### Users Collection (`users`)
```json
{
  "userId": {
    "username": "string",
    "email": "string", 
    "profileImageUrl": "string (optional)",
    "isOnline": "boolean",
    "latitude": "number (optional)",
    "longitude": "number (optional)",
    "address": "string (optional)",
    "lastSeen": "timestamp",
    "isLocationSharingEnabled": "boolean",
    "isDarkThemeEnabled": "boolean",
    "locationUpdateInterval": "number (seconds)",
    "notificationsEnabled": "boolean",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

### Devices Collection (`devices`)
```json
{
  "deviceId": {
    "name": "string",
    "userId": "string",
    "type": "string (phone, tablet, laptop, watch, earbuds, other)",
    "isOnline": "boolean",
    "latitude": "number (optional)",
    "longitude": "number (optional)", 
    "address": "string (optional)",
    "lastSeen": "timestamp",
    "batteryLevel": "number (optional)",
    "networkType": "string (optional)",
    "deviceInfo": "string (optional)",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

### Friends Collection (`friends`)
```json
{
  "friendshipId": {
    "userId": "string",
    "friendId": "string",
    "name": "string",
    "email": "string",
    "profileImageUrl": "string (optional)",
    "isOnline": "boolean",
    "latitude": "number (optional)",
    "longitude": "number (optional)",
    "address": "string (optional)",
    "lastSeen": "timestamp",
    "isLocationShared": "boolean",
    "isFavorite": "boolean", 
    "status": "string (pending, accepted, blocked)",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

## 🔐 Security Rules

Apply these Firestore security rules in the Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can read and write their own devices
    match /devices/{deviceId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Friends collection rules
    match /friends/{friendId} {
      // Users can read friendships where they are either user or friend
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         resource.data.friendId == request.auth.uid);
      
      // Users can create friend requests
      allow create: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      
      // Users can update friendships they are part of
      allow update: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         resource.data.friendId == request.auth.uid);
      
      // Users can delete friendships they are part of  
      allow delete: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         resource.data.friendId == request.auth.uid);
    }
  }
}
```

## 🗂️ Firebase Storage Rules

For profile image uploads:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Profile images
    match /profile_images/{imageId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🚀 Running the App

1. **Install Dependencies**:
   ```bash
   cd Application/unilocator
   flutter pub get
   ```

2. **Run the App**:
   ```bash
   flutter run
   ```

3. **Build for Release**:
   ```bash
   flutter build apk --release
   ```

## 🔧 Configuration Notes

### Firebase Authentication
- The app uses Firebase Auth for user registration and login
- User profile data is automatically synced with Firestore
- Real-time authentication state changes are handled

### Real-time Updates
- All data uses Firestore real-time listeners
- Changes are automatically reflected in the UI
- Offline support is built-in with Firestore

### Location Services
- Location permissions are requested when needed
- User location updates are stored in Firestore
- Location sharing can be toggled per friend

## 🎯 Key Features

### Authentication
- ✅ Email/password registration and login
- ✅ Real-time auth state management
- ✅ User profile management
- ✅ Automatic user data creation

### Device Management  
- ✅ Add/edit/delete devices
- ✅ Real-time device status updates
- ✅ Device type categorization
- ✅ Battery level tracking
- ✅ Location tracking per device

### Friends System
- ✅ Send/receive friend requests
- ✅ Accept/reject friend requests  
- ✅ Toggle location sharing per friend
- ✅ Favorite friends
- ✅ Real-time friend status

### Settings
- ✅ Dark/light theme toggle
- ✅ Location update intervals
- ✅ Notification preferences
- ✅ Privacy settings

## 🐛 Troubleshooting

### Common Issues

1. **Build Errors**:
   ```bash
   flutter clean
   flutter pub get
   flutter build apk
   ```

2. **Permission Denied Errors**:
   - Check Firestore security rules
   - Ensure user is authenticated
   - Verify document ownership

3. **Location Not Working**:
   - Check location permissions in device settings
   - Ensure location services are enabled
   - Verify network connectivity

4. **Firebase Connection Issues**:
   - Verify `google-services.json` is in correct location
   - Check Firebase project configuration
   - Ensure internet connectivity

## 📱 Testing

### Test User Accounts
Create test accounts to verify:
- User registration/login
- Device management
- Friend requests
- Location sharing
- Real-time updates

### Test Scenarios
1. Register new user → Add devices → Send friend request
2. Accept friend request → Share location → Test real-time updates
3. Toggle settings → Verify persistence across app restarts
4. Test offline functionality → Verify data sync when online

## 🔄 Data Migration

If migrating from the existing web app:
- User accounts will work seamlessly
- Device data structure is compatible
- Friend relationships are preserved
- Settings may need to be reconfigured

## 📞 Support

For issues or questions:
1. Check Firebase Console for errors
2. Review Flutter logs: `flutter logs`
3. Verify Firestore rules and data structure
4. Test with different user accounts

The Firebase setup is designed to work seamlessly with the existing database while providing a modern Flutter experience with real-time updates and offline support.