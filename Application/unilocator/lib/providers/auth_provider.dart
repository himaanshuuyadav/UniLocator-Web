import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../services/firebase_service.dart';
import '../models/user.dart';

class AuthProvider extends ChangeNotifier {
  final FirebaseService _firebaseService = FirebaseService();
  
  User? _firebaseUser;
  AppUser? _currentUser;
  bool _isLoading = true;
  String? _error;

  // Getters
  User? get firebaseUser => _firebaseUser;
  AppUser? get currentUser => _currentUser;
  bool get isAuthenticated => _firebaseUser != null;
  bool get isLoading => _isLoading;
  String? get error => _error;

  AuthProvider() {
    _init();
  }

  void _init() {
    _firebaseService.authStateChanges.listen((User? user) async {
      _firebaseUser = user;
      if (user != null) {
        await _loadUserData();
        // Set user online when app starts
        await _firebaseService.setUserOnlineStatus(true);
      } else {
        _currentUser = null;
      }
      _isLoading = false;
      notifyListeners();
    });
  }

  Future<void> _loadUserData() async {
    try {
      _currentUser = await _firebaseService.getCurrentUserData();
      _error = null;
    } catch (e) {
      _error = 'Failed to load user data: $e';
    }
    notifyListeners();
  }

  Future<bool> signUp({
    required String email,
    required String password,
    required String username,
  }) async {
    _setLoading(true);
    try {
      final result = await _firebaseService.signUp(
        email: email,
        password: password,
        username: username,
      );

      if (result['success']) {
        _firebaseUser = result['user'];
        await _loadUserData();
        return true;
      } else {
        _error = result['error'];
        return false;
      }
    } catch (e) {
      _error = 'Sign up failed: $e';
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> signIn({
    required String email,
    required String password,
  }) async {
    _setLoading(true);
    try {
      final result = await _firebaseService.signIn(
        email: email,
        password: password,
      );

      if (result['success']) {
        _firebaseUser = result['user'];
        await _loadUserData();
        return true;
      } else {
        _error = result['error'];
        return false;
      }
    } catch (e) {
      _error = 'Sign in failed: $e';
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<void> signOut() async {
    _setLoading(true);
    try {
      // Set user offline before signing out
      await _firebaseService.setUserOnlineStatus(false);
      await _firebaseService.signOut();
      _firebaseUser = null;
      _currentUser = null;
      _error = null;
    } catch (e) {
      _error = 'Sign out failed: $e';
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> updateProfile({
    String? username,
    String? email,
  }) async {
    if (_currentUser == null) return false;

    try {
      final updatedUser = _currentUser!.copyWith(
        username: username,
        email: email,
      );

      final success = await _firebaseService.updateUserData(updatedUser);
      if (success) {
        _currentUser = updatedUser;
        _error = null;
        notifyListeners();
        return true;
      } else {
        _error = 'Failed to update profile';
        return false;
      }
    } catch (e) {
      _error = 'Error updating profile: $e';
      return false;
    }
  }

  Future<bool> updateLocation({
    required double latitude,
    required double longitude,
    String? address,
  }) async {
    if (_currentUser == null) return false;

    try {
      final success = await _firebaseService.updateUserLocation(
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
        return false;
      }
    } catch (e) {
      _error = 'Error updating location: $e';
      return false;
    }
  }

  Future<bool> updateLocationSharing(bool enabled) async {
    if (_currentUser == null) return false;

    try {
      final updatedUser = _currentUser!.copyWith(
        isLocationSharingEnabled: enabled,
      );

      final success = await _firebaseService.updateUserData(updatedUser);
      if (success) {
        _currentUser = updatedUser;
        _error = null;
        notifyListeners();
        return true;
      } else {
        _error = 'Failed to update location sharing';
        return false;
      }
    } catch (e) {
      _error = 'Error updating location sharing: $e';
      return false;
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  // Listen to real-time user updates
  void startListeningToUserUpdates() {
    _firebaseService.getCurrentUserStream().listen(
      (user) {
        if (user != null) {
          _currentUser = user;
          _error = null;
          notifyListeners();
        }
      },
      onError: (error) {
        _error = 'Error listening to user updates: $error';
        notifyListeners();
      },
    );
  }

  @override
  void dispose() {
    // Set user offline when app is disposed
    if (_firebaseUser != null) {
      _firebaseService.setUserOnlineStatus(false);
    }
    super.dispose();
  }
}