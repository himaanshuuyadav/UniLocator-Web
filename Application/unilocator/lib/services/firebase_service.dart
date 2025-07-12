import 'dart:io';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';
import '../models/user.dart';
import '../models/device.dart';
import '../models/friend.dart';

class FirebaseService {
  static final FirebaseService _instance = FirebaseService._internal();
  factory FirebaseService() => _instance;
  FirebaseService._internal();

  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseStorage _storage = FirebaseStorage.instance;

  // Auth getters
  User? get currentUser => _auth.currentUser;
  bool get isAuthenticated => currentUser != null;
  Stream<User?> get authStateChanges => _auth.authStateChanges();

  // Collections
  CollectionReference get _usersCollection => _firestore.collection('users');
  CollectionReference get _devicesCollection => _firestore.collection('devices');
  CollectionReference get _friendsCollection => _firestore.collection('friends');

  // Authentication Methods
  Future<Map<String, dynamic>> signUp({
    required String email,
    required String password,
    required String username,
  }) async {
    try {
      UserCredential userCredential = await _auth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );

      User? user = userCredential.user;
      if (user != null) {
        await user.updateDisplayName(username);

        // Create user document in Firestore
        final appUser = AppUser(
          id: user.uid,
          username: username,
          email: email,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        );

        await _usersCollection.doc(user.uid).set(appUser.toFirestore());

        return {'success': true, 'user': user};
      }
      return {'success': false, 'error': 'User creation failed'};
    } on FirebaseAuthException catch (e) {
      return {'success': false, 'error': _getAuthErrorMessage(e.code)};
    } catch (e) {
      return {'success': false, 'error': 'An unexpected error occurred: $e'};
    }
  }

  Future<Map<String, dynamic>> signIn({
    required String email,
    required String password,
  }) async {
    try {
      UserCredential userCredential = await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );

      // Update user online status
      if (userCredential.user != null) {
        await _usersCollection.doc(userCredential.user!.uid).update({
          'isOnline': true,
          'lastSeen': FieldValue.serverTimestamp(),
        });
      }

      return {'success': true, 'user': userCredential.user};
    } on FirebaseAuthException catch (e) {
      return {'success': false, 'error': _getAuthErrorMessage(e.code)};
    } catch (e) {
      return {'success': false, 'error': 'An unexpected error occurred: $e'};
    }
  }

  Future<void> signOut() async {
    if (currentUser != null) {
      // Update user offline status
      await _usersCollection.doc(currentUser!.uid).update({
        'isOnline': false,
        'lastSeen': FieldValue.serverTimestamp(),
      });
    }
    await _auth.signOut();
  }

  // User Methods
  Future<AppUser?> getCurrentUserData() async {
    if (currentUser == null) return null;

    try {
      DocumentSnapshot doc = await _usersCollection.doc(currentUser!.uid).get();
      if (doc.exists) {
        return AppUser.fromFirestore(doc);
      }
    } catch (e) {
      print('Error getting user data: $e');
    }
    return null;
  }

  Stream<AppUser?> getCurrentUserStream() {
    if (currentUser == null) return Stream.value(null);

    return _usersCollection
        .doc(currentUser!.uid)
        .snapshots()
        .map((doc) => doc.exists ? AppUser.fromFirestore(doc) : null);
  }

  Future<bool> updateUserData(AppUser user) async {
    try {
      await _usersCollection.doc(user.id).update(user.toFirestore());
      return true;
    } catch (e) {
      print('Error updating user data: $e');
      return false;
    }
  }

  Future<bool> updateUserLocation({
    required double latitude,
    required double longitude,
    String? address,
  }) async {
    if (currentUser == null) return false;

    try {
      await _usersCollection.doc(currentUser!.uid).update({
        'latitude': latitude,
        'longitude': longitude,
        'address': address,
        'lastSeen': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      });
      return true;
    } catch (e) {
      print('Error updating user location: $e');
      return false;
    }
  }

  Future<String?> uploadProfileImage(File imageFile) async {
    if (currentUser == null) return null;

    try {
      String fileName = 'profile_${currentUser!.uid}_${DateTime.now().millisecondsSinceEpoch}.jpg';
      Reference ref = _storage.ref().child('profile_images').child(fileName);
      
      UploadTask uploadTask = ref.putFile(imageFile);
      TaskSnapshot snapshot = await uploadTask;
      
      String downloadUrl = await snapshot.ref.getDownloadURL();
      
      // Update user profile image URL
      await _usersCollection.doc(currentUser!.uid).update({
        'profileImageUrl': downloadUrl,
        'updatedAt': FieldValue.serverTimestamp(),
      });
      
      return downloadUrl;
    } catch (e) {
      print('Error uploading profile image: $e');
      return null;
    }
  }

  // Device Methods
  Future<List<Device>> getUserDevices() async {
    if (currentUser == null) return [];

    try {
      QuerySnapshot snapshot = await _devicesCollection
          .where('userId', isEqualTo: currentUser!.uid)
          .orderBy('updatedAt', descending: true)
          .get();

      return snapshot.docs.map((doc) => Device.fromFirestore(doc)).toList();
    } catch (e) {
      print('Error getting user devices: $e');
      return [];
    }
  }

  Stream<List<Device>> getUserDevicesStream() {
    if (currentUser == null) return Stream.value([]);

    return _devicesCollection
        .where('userId', isEqualTo: currentUser!.uid)
        .orderBy('updatedAt', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs.map((doc) => Device.fromFirestore(doc)).toList());
  }

  Future<bool> addDevice(Device device) async {
    try {
      await _devicesCollection.add(device.toFirestore());
      return true;
    } catch (e) {
      print('Error adding device: $e');
      return false;
    }
  }

  Future<bool> updateDevice(Device device) async {
    try {
      await _devicesCollection.doc(device.id).update(device.toFirestore());
      return true;
    } catch (e) {
      print('Error updating device: $e');
      return false;
    }
  }

  Future<bool> deleteDevice(String deviceId) async {
    try {
      await _devicesCollection.doc(deviceId).delete();
      return true;
    } catch (e) {
      print('Error deleting device: $e');
      return false;
    }
  }

  // Friend Methods
  Future<List<Friend>> getUserFriends() async {
    if (currentUser == null) return [];

    try {
      QuerySnapshot snapshot = await _friendsCollection
          .where('userId', isEqualTo: currentUser!.uid)
          .where('status', isEqualTo: 'accepted')
          .orderBy('updatedAt', descending: true)
          .get();

      return snapshot.docs.map((doc) => Friend.fromFirestore(doc)).toList();
    } catch (e) {
      print('Error getting user friends: $e');
      return [];
    }
  }

  Stream<List<Friend>> getUserFriendsStream() {
    if (currentUser == null) return Stream.value([]);

    return _friendsCollection
        .where('userId', isEqualTo: currentUser!.uid)
        .where('status', isEqualTo: 'accepted')
        .orderBy('updatedAt', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs.map((doc) => Friend.fromFirestore(doc)).toList());
  }

  Future<List<Friend>> getPendingFriendRequests() async {
    if (currentUser == null) return [];

    try {
      QuerySnapshot snapshot = await _friendsCollection
          .where('friendId', isEqualTo: currentUser!.uid)
          .where('status', isEqualTo: 'pending')
          .orderBy('createdAt', descending: true)
          .get();

      return snapshot.docs.map((doc) => Friend.fromFirestore(doc)).toList();
    } catch (e) {
      print('Error getting pending friend requests: $e');
      return [];
    }
  }

  Future<bool> sendFriendRequest(String friendEmail) async {
    if (currentUser == null) return false;

    try {
      // Find user by email
      QuerySnapshot userSnapshot = await _usersCollection
          .where('email', isEqualTo: friendEmail)
          .limit(1)
          .get();

      if (userSnapshot.docs.isEmpty) {
        return false; // User not found
      }

      DocumentSnapshot friendDoc = userSnapshot.docs.first;
      AppUser friendUser = AppUser.fromFirestore(friendDoc);

      // Check if friend request already exists
      QuerySnapshot existingRequest = await _friendsCollection
          .where('userId', isEqualTo: currentUser!.uid)
          .where('friendId', isEqualTo: friendUser.id)
          .limit(1)
          .get();

      if (existingRequest.docs.isNotEmpty) {
        return false; // Friend request already exists
      }

      // Create friend request
      final friend = Friend(
        id: '',
        userId: currentUser!.uid,
        friendId: friendUser.id,
        name: friendUser.username,
        email: friendUser.email,
        profileImageUrl: friendUser.profileImageUrl,
        status: FriendStatus.pending,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      await _friendsCollection.add(friend.toFirestore());
      return true;
    } catch (e) {
      print('Error sending friend request: $e');
      return false;
    }
  }

  Future<bool> acceptFriendRequest(String friendRequestId) async {
    try {
      await _friendsCollection.doc(friendRequestId).update({
        'status': 'accepted',
        'updatedAt': FieldValue.serverTimestamp(),
      });
      return true;
    } catch (e) {
      print('Error accepting friend request: $e');
      return false;
    }
  }

  Future<bool> rejectFriendRequest(String friendRequestId) async {
    try {
      await _friendsCollection.doc(friendRequestId).delete();
      return true;
    } catch (e) {
      print('Error rejecting friend request: $e');
      return false;
    }
  }

  Future<bool> removeFriend(String friendId) async {
    try {
      await _friendsCollection.doc(friendId).delete();
      return true;
    } catch (e) {
      print('Error removing friend: $e');
      return false;
    }
  }

  Future<bool> toggleFriendFavorite(String friendId, bool isFavorite) async {
    try {
      await _friendsCollection.doc(friendId).update({
        'isFavorite': isFavorite,
        'updatedAt': FieldValue.serverTimestamp(),
      });
      return true;
    } catch (e) {
      print('Error toggling friend favorite: $e');
      return false;
    }
  }

  Future<bool> toggleLocationSharing(String friendId, bool isSharing) async {
    try {
      await _friendsCollection.doc(friendId).update({
        'isLocationShared': isSharing,
        'updatedAt': FieldValue.serverTimestamp(),
      });
      return true;
    } catch (e) {
      print('Error toggling location sharing: $e');
      return false;
    }
  }

  // Utility Methods
  String _getAuthErrorMessage(String code) {
    switch (code) {
      case 'weak-password':
        return 'The password provided is too weak.';
      case 'email-already-in-use':
        return 'The account already exists for that email.';
      case 'user-not-found':
        return 'No user found for that email.';
      case 'wrong-password':
        return 'Wrong password provided.';
      case 'invalid-email':
        return 'The email address is not valid.';
      case 'user-disabled':
        return 'This user account has been disabled.';
      case 'too-many-requests':
        return 'Too many attempts. Please try again later.';
      case 'operation-not-allowed':
        return 'Email/password accounts are not enabled.';
      case 'invalid-credential':
        return 'The provided credentials are invalid.';
      default:
        return 'An error occurred. Please try again.';
    }
  }

  // Real-time status updates
  Future<void> setUserOnlineStatus(bool isOnline) async {
    if (currentUser == null) return;

    await _usersCollection.doc(currentUser!.uid).update({
      'isOnline': isOnline,
      'lastSeen': FieldValue.serverTimestamp(),
    });
  }

  // Search users by email
  Future<AppUser?> findUserByEmail(String email) async {
    try {
      QuerySnapshot snapshot = await _usersCollection
          .where('email', isEqualTo: email)
          .limit(1)
          .get();

      if (snapshot.docs.isNotEmpty) {
        return AppUser.fromFirestore(snapshot.docs.first);
      }
    } catch (e) {
      print('Error finding user by email: $e');
    }
    return null;
  }
}