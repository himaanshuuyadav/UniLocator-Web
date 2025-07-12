# Firebase Setup Guide for UniLocator

This guide will help you set up Firebase for the UniLocator Flutter project using the existing Firebase project without creating a new database.

## Prerequisites

- Flutter SDK installed
- Firebase CLI installed (`npm install -g firebase-tools`)
- Access to the existing Firebase project (unilocator-a542b)

## Firebase Project Configuration

The project is already configured with Firebase project ID: `unilocator-a542b`

### Firebase Collections Structure

The app uses the following Firestore collections:

#### 1. Users Collection (`users`)
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

#### 2. Devices Collection (`devices`)
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

#### 3. Friends Collection (`friends`)
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

## Security Rules

Add these Firestore Security Rules to ensure proper access control:

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
      // Users can read friendships where they are either the user or the friend
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

## Firebase Storage Rules

Add these Storage Security Rules for profile images:

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

## Firebase Configuration Files

### Android Configuration
The Android app is already configured with `google-services.json` located at:
```
Application/unilocator/android/app/google-services.json
```

### iOS Configuration (if needed)
If you plan to support iOS, download `GoogleService-Info.plist` from Firebase Console and place it at:
```
Application/unilocator/ios/Runner/GoogleService-Info.plist
```

### Web Configuration
The web configuration is already set up in:
```
firebase_auth/config/firebase-config.js
```

## Flutter Dependencies

The following Firebase dependencies are already added to `pubspec.yaml`:

```yaml
dependencies:
  firebase_core: ^2.24.2
  firebase_auth: ^4.17.8
  cloud_firestore: ^4.15.8
  firebase_storage: ^11.6.9
```

## Adding New Fields to Existing Collections

To add new fields to existing collections without breaking the existing web application:

### 1. Adding Device Fields
```dart
// Add new fields to the Device model
class Device {
  // ... existing fields
  final String? newField;
  final bool? anotherField;
  
  // Update fromFirestore method
  factory Device.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return Device(
      // ... existing fields
      newField: data['newField'],
      anotherField: data['anotherField'] ?? false,
    );
  }
  
  // Update toFirestore method
  Map<String, dynamic> toFirestore() {
    return {
      // ... existing fields
      'newField': newField,
      'anotherField': anotherField,
    };
  }
}
```

### 2. Adding Friend Fields
```dart
// Add new fields to the Friend model
class Friend {
  // ... existing fields
  final String? customField;
  final DateTime? lastInteraction;
  
  // Update constructors and methods accordingly
}
```

### 3. Adding User Fields
```dart
// Add new fields to the AppUser model
class AppUser {
  // ... existing fields
  final Map<String, dynamic>? preferences;
  final List<String>? interests;
  
  // Update constructors and methods accordingly
}
```

## Firebase Indexes

For optimal performance, create these composite indexes in Firestore:

1. **Devices Collection**
   - Fields: `userId` (Ascending), `updatedAt` (Descending)
   - Fields: `userId` (Ascending), `isOnline` (Ascending), `updatedAt` (Descending)

2. **Friends Collection**
   - Fields: `userId` (Ascending), `status` (Ascending), `updatedAt` (Descending)
   - Fields: `friendId` (Ascending), `status` (Ascending), `createdAt` (Descending)

3. **Users Collection**
   - Fields: `email` (Ascending)
   - Fields: `isOnline` (Ascending), `lastSeen` (Descending)

## Environment Setup

1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Firebase in project** (if not already done):
   ```bash
   cd Application/unilocator
   firebase init
   ```

4. **Deploy Security Rules**:
   ```bash
   firebase deploy --only firestore:rules
   firebase deploy --only storage
   ```

## Testing Firebase Connection

To test if Firebase is properly connected:

1. **Run the Flutter app**:
   ```bash
   cd Application/unilocator
   flutter run
   ```

2. **Check Firebase Console**:
   - Go to Firebase Console > Authentication > Users
   - Register a new user through the app
   - Verify the user appears in the console

3. **Check Firestore**:
   - Go to Firebase Console > Firestore Database
   - Verify collections are created when data is added

## Common Issues and Solutions

### 1. Permission Denied
- Ensure security rules are properly set
- Check if user is authenticated before accessing data

### 2. Index Errors
- Create required indexes in Firestore Console
- Wait for indexes to build (can take a few minutes)

### 3. Authentication Issues
- Verify `google-services.json` is in the correct location
- Ensure Firebase project is properly configured

### 4. Build Errors
- Run `flutter clean` and `flutter pub get`
- Ensure all dependencies are up to date

## Additional Features to Implement

### 1. Real-time Location Updates
```dart
// In LocationService
StreamSubscription<LocationData>? _locationSubscription;

Future<void> startLocationTracking() async {
  _locationSubscription = _location.onLocationChanged.listen((locationData) {
    // Update user location in Firebase
    FirebaseService().updateUserLocation(
      latitude: locationData.latitude!,
      longitude: locationData.longitude!,
    );
  });
}
```

### 2. Push Notifications
Add `firebase_messaging` dependency and configure for:
- Friend requests
- Location updates
- Device status changes

### 3. Offline Support
Firebase automatically handles offline data caching, but you can enhance it:
- Enable offline persistence
- Handle offline states in UI
- Sync data when back online

## Best Practices

1. **Data Modeling**:
   - Use subcollections for large datasets
   - Denormalize data for read efficiency
   - Use batch writes for multiple operations

2. **Security**:
   - Always validate data on the client and server
   - Use proper security rules
   - Implement user authentication

3. **Performance**:
   - Use pagination for large lists
   - Implement proper indexing
   - Cache frequently accessed data

4. **Cost Optimization**:
   - Monitor Firebase usage
   - Optimize queries to reduce reads
   - Use Firebase Local Emulator for development

## Support

For issues or questions:
1. Check Firebase Console for errors
2. Review Flutter logs
3. Consult Firebase documentation
4. Check Stack Overflow for similar issues

This setup ensures your UniLocator app integrates seamlessly with Firebase while maintaining compatibility with the existing web application.