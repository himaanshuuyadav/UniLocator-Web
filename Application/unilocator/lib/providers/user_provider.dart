import 'package:flutter/foundation.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:io';
import '../models/user.dart';
import '../services/firebase_service.dart';
import '../services/location_service.dart';

class UserProvider extends ChangeNotifier {
  final FirebaseService _firebaseService = FirebaseService();
  final LocationService _locationService = LocationService();

  User? _firebaseUser;
  AppUser? _currentUser;
  bool _isLoading = false;
  String? _error;
  bool _isLocationSharingEnabled = false;
  bool _isDarkThemeEnabled = true;
  bool _notificationsEnabled = true;
  int _locationUpdateInterval = 30;

  // Getters
  User? get firebaseUser => _firebaseUser;
  AppUser? get currentUser => _currentUser;
  bool get isAuthenticated => _firebaseUser != null;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isLocationSharingEnabled => _isLocationSharingEnabled;
  bool get isDarkThemeEnabled => _isDarkThemeEnabled;
  bool get notificationsEnabled => _notificationsEnabled;
  int get locationUpdateInterval => _locationUpdateInterval;

  // Initialize user provider
  Future<void> initialize() async {
    _setLoading(true);
    try {
      // Load settings from SharedPreferences
      await _loadSettings();
      
      // Listen to auth state changes
      _firebaseService.authStateChanges.listen((User? user) {
        _firebaseUser = user;
        if (user != null) {
          _loadCurrentUser();
        } else {
          _currentUser = null;
        }
        notifyListeners();
      });

      // Get current user if authenticated
      if (_firebaseService.isAuthenticated) {
        _firebaseUser = _firebaseService.currentUser;
        await _loadCurrentUser();
      }

      _error = null;
    } catch (e) {
      _error = 'Failed to initialize user: $e';
    } finally {
      _setLoading(false);
    }
  }

  // Load current user data from Firestore
  Future<void> _loadCurrentUser() async {
    try {
      _currentUser = await _firebaseService.getCurrentUserData();
      if (_currentUser != null) {
        _isLocationSharingEnabled = _currentUser!.isLocationSharingEnabled;
        _isDarkThemeEnabled = _currentUser!.isDarkThemeEnabled;
        _notificationsEnabled = _currentUser!.notificationsEnabled;
        _locationUpdateInterval = _currentUser!.locationUpdateInterval;
      }
      notifyListeners();
    } catch (e) {
      _error = 'Failed to load user data: $e';
      notifyListeners();
    }
  }

  // Listen to real-time user updates
  void startListening() {
    _firebaseService.getCurrentUserStream().listen(
      (user) {
        _currentUser = user;
        if (user != null) {
          _isLocationSharingEnabled = user.isLocationSharingEnabled;
          _isDarkThemeEnabled = user.isDarkThemeEnabled;
          _notificationsEnabled = user.notificationsEnabled;
          _locationUpdateInterval = user.locationUpdateInterval;
        }
        _error = null;
        notifyListeners();
      },
      onError: (error) {
        _error = 'Error listening to user updates: $error';
        notifyListeners();
      },
    );
  }

  // Sign up new user
  Future<bool> signUp({
    required String email,
    required String password,
    required String username,
  }) async {
    _setLoading(true);
    try {
      Map<String, dynamic> result = await _firebaseService.signUp(
        email: email,
        password: password,
        username: username,
      );

      if (result['success']) {
        _firebaseUser = result['user'];
        await _loadCurrentUser();
        _error = null;
        notifyListeners();
        return true;
      } else {
        _error = result['error'];
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'Sign up failed: $e';
      notifyListeners();
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Sign in user
  Future<bool> signIn({
    required String email,
    required String password,
  }) async {
    _setLoading(true);
    try {
      Map<String, dynamic> result = await _firebaseService.signIn(
        email: email,
        password: password,
      );

      if (result['success']) {
        _firebaseUser = result['user'];
        await _loadCurrentUser();
        _error = null;
        notifyListeners();
        return true;
      } else {
        _error = result['error'];
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'Sign in failed: $e';
      notifyListeners();
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Sign out user
  Future<void> signOut() async {
    _setLoading(true);
    try {
      await _firebaseService.signOut();
      _firebaseUser = null;
      _currentUser = null;
      _error = null;
      notifyListeners();
    } catch (e) {
      _error = 'Sign out failed: $e';
      notifyListeners();
    } finally {
      _setLoading(false);
    }
  }

  // Update user profile
  Future<bool> updateProfile({
    String? username,
    String? email,
  }) async {
    if (_currentUser == null) return false;

    _setLoading(true);
    try {
      AppUser updatedUser = _currentUser!.copyWith(
        username: username,
        email: email,
      );

      bool success = await _firebaseService.updateUserData(updatedUser);
      if (success) {
        _currentUser = updatedUser;
        _error = null;
        notifyListeners();
        return true;
      } else {
        _error = 'Failed to update profile';
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'Error updating profile: $e';
      notifyListeners();
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Upload profile image
  Future<bool> uploadProfileImage(File imageFile) async {
    if (_currentUser == null) return false;

    _setLoading(true);
    try {
      String? imageUrl = await _firebaseService.uploadProfileImage(imageFile);
      if (imageUrl != null) {
        _currentUser = _currentUser!.copyWith(profileImageUrl: imageUrl);
        _error = null;
        notifyListeners();
        return true;
      } else {
        _error = 'Failed to upload profile image';
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'Error uploading profile image: $e';
      notifyListeners();
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Update user location
  Future<bool> updateLocation({
    required double latitude,
    required double longitude,
    String? address,
  }) async {
    if (_currentUser == null) return false;

    try {
      bool success = await _firebaseService.updateUserLocation(
        latitude: latitude,
        longitude: longitude,
        address: address,
      );

      if (success) {
        _currentUser = _currentUser!.copyWith(
          latitude: latitude,
          longitude: longitude,
          address: address,
          lastSeen: DateTime.now(),
        );
        _error = null;
        notifyListeners();
        return true;
      } else {
        _error = 'Failed to update location';
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'Error updating location: $e';
      notifyListeners();
      return false;
    }
  }

  // Toggle location sharing
  Future<bool> toggleLocationSharing(bool enabled) async {
    if (_currentUser == null) return false;

    try {
      AppUser updatedUser = _currentUser!.copyWith(
        isLocationSharingEnabled: enabled,
      );

      bool success = await _firebaseService.updateUserData(updatedUser);
      if (success) {
        _currentUser = updatedUser;
        _isLocationSharingEnabled = enabled;
        await _saveSettings();
        
        if (enabled) {
          await _locationService.startLocationTracking();
        } else {
          _locationService.stopLocationTracking();
        }
        
        _error = null;
        notifyListeners();
        return true;
      } else {
        _error = 'Failed to update location sharing';
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'Error toggling location sharing: $e';
      notifyListeners();
      return false;
    }
  }

  // Toggle dark theme
  Future<bool> toggleDarkTheme(bool enabled) async {
    if (_currentUser == null) return false;

    try {
      AppUser updatedUser = _currentUser!.copyWith(
        isDarkThemeEnabled: enabled,
      );

      bool success = await _firebaseService.updateUserData(updatedUser);
      if (success) {
        _currentUser = updatedUser;
        _isDarkThemeEnabled = enabled;
        await _saveSettings();
        _error = null;
        notifyListeners();
        return true;
      } else {
        _error = 'Failed to update theme preference';
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'Error toggling dark theme: $e';
      notifyListeners();
      return false;
    }
  }

  // Toggle notifications
  Future<bool> toggleNotifications(bool enabled) async {
    if (_currentUser == null) return false;

    try {
      AppUser updatedUser = _currentUser!.copyWith(
        notificationsEnabled: enabled,
      );

      bool success = await _firebaseService.updateUserData(updatedUser);
      if (success) {
        _currentUser = updatedUser;
        _notificationsEnabled = enabled;
        await _saveSettings();
        _error = null;
        notifyListeners();
        return true;
      } else {
        _error = 'Failed to update notification preference';
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'Error toggling notifications: $e';
      notifyListeners();
      return false;
    }
  }

  // Update location update interval
  Future<bool> updateLocationInterval(int intervalSeconds) async {
    if (_currentUser == null) return false;

    try {
      AppUser updatedUser = _currentUser!.copyWith(
        locationUpdateInterval: intervalSeconds,
      );

      bool success = await _firebaseService.updateUserData(updatedUser);
      if (success) {
        _currentUser = updatedUser;
        _locationUpdateInterval = intervalSeconds;
        await _saveSettings();
        _error = null;
        notifyListeners();
        return true;
      } else {
        _error = 'Failed to update location interval';
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'Error updating location interval: $e';
      notifyListeners();
      return false;
    }
  }

  // Set user online status
  Future<bool> setOnlineStatus(bool isOnline) async {
    if (_currentUser == null) return false;

    try {
      AppUser updatedUser = _currentUser!.copyWith(
        isOnline: isOnline,
        lastSeen: DateTime.now(),
      );

      bool success = await _firebaseService.updateUserData(updatedUser);
      if (success) {
        _currentUser = updatedUser;
        _error = null;
        notifyListeners();
        return true;
      } else {
        _error = 'Failed to update online status';
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'Error updating online status: $e';
      notifyListeners();
      return false;
    }
  }

  // Get user's current location
  Future<void> getCurrentLocation() async {
    try {
      var locationData = await _locationService.getCurrentLocation();
      if (locationData != null) {
        await updateLocation(
          latitude: locationData.latitude!,
          longitude: locationData.longitude!,
          address: _locationService.currentAddress,
        );
      }
    } catch (e) {
      _error = 'Error getting current location: $e';
      notifyListeners();
    }
  }

  // Load settings from SharedPreferences
  Future<void> _loadSettings() async {
    try {
      SharedPreferences prefs = await SharedPreferences.getInstance();
      _isLocationSharingEnabled = prefs.getBool('locationSharing') ?? false;
      _isDarkThemeEnabled = prefs.getBool('darkTheme') ?? true;
      _notificationsEnabled = prefs.getBool('notifications') ?? true;
      _locationUpdateInterval = prefs.getInt('locationInterval') ?? 30;
    } catch (e) {
      print('Error loading settings: $e');
    }
  }

  // Save settings to SharedPreferences
  Future<void> _saveSettings() async {
    try {
      SharedPreferences prefs = await SharedPreferences.getInstance();
      await prefs.setBool('locationSharing', _isLocationSharingEnabled);
      await prefs.setBool('darkTheme', _isDarkThemeEnabled);
      await prefs.setBool('notifications', _notificationsEnabled);
      await prefs.setInt('locationInterval', _locationUpdateInterval);
    } catch (e) {
      print('Error saving settings: $e');
    }
  }

  // Clear error
  void clearError() {
    _error = null;
    notifyListeners();
  }

  // Private helper methods
  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  // Get user initials for avatar
  String getUserInitials() {
    if (_currentUser == null) return 'U';
    return _currentUser!.username.isNotEmpty
        ? _currentUser!.username.substring(0, 1).toUpperCase()
        : 'U';
  }

  // Get user display name
  String getUserDisplayName() {
    if (_currentUser == null) return 'User';
    return _currentUser!.username.isNotEmpty
        ? _currentUser!.username
        : 'User';
  }

  // Get user email
  String getUserEmail() {
    if (_currentUser == null) return '';
    return _currentUser!.email;
  }

  // Format last seen time
  String formatLastSeen() {
    if (_currentUser?.lastSeen == null) return 'Never';

    final now = DateTime.now();
    final difference = now.difference(_currentUser!.lastSeen!);

    if (difference.inMinutes < 1) {
      return 'Just now';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes} min ago';
    } else if (difference.inHours < 24) {
      return '${difference.inHours} hr ago';
    } else {
      return '${difference.inDays} days ago';
    }
  }

  // Check if user has location permissions
  Future<bool> hasLocationPermission() async {
    return await _locationService.hasLocationPermission();
  }

  // Request location permissions
  Future<bool> requestLocationPermission() async {
    return await _locationService.requestLocationPermission();
  }

  @override
  void dispose() {
    _locationService.dispose();
    super.dispose();
  }
}