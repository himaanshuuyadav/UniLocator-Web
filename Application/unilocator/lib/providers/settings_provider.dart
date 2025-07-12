import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SettingsProvider extends ChangeNotifier {
  static const String _isDarkThemeKey = 'isDarkTheme';
  static const String _isLocationSharingKey = 'isLocationSharing';
  static const String _locationUpdateIntervalKey = 'locationUpdateInterval';
  static const String _notificationsEnabledKey = 'notificationsEnabled';
  static const String _autoBackupKey = 'autoBackup';

  // Settings state
  bool _isDarkTheme = true;
  bool _isLocationSharingEnabled = false;
  int _locationUpdateInterval = 30; // seconds
  bool _notificationsEnabled = true;
  bool _autoBackupEnabled = false;
  bool _isLoading = false;

  // Getters
  bool get isDarkTheme => _isDarkTheme;
  bool get isLocationSharingEnabled => _isLocationSharingEnabled;
  int get locationUpdateInterval => _locationUpdateInterval;
  bool get notificationsEnabled => _notificationsEnabled;
  bool get autoBackupEnabled => _autoBackupEnabled;
  bool get isLoading => _isLoading;

  // Location update interval options
  List<int> get locationUpdateIntervals => [10, 30, 60, 300]; // 10s, 30s, 1m, 5m

  String getLocationUpdateIntervalText(int seconds) {
    if (seconds < 60) {
      return '${seconds}s';
    } else if (seconds < 3600) {
      return '${seconds ~/ 60}m';
    } else {
      return '${seconds ~/ 3600}h';
    }
  }

  // Initialize settings
  Future<void> initialize() async {
    _isLoading = true;
    notifyListeners();
    
    try {
      await _loadSettings();
    } catch (e) {
      print('Error loading settings: $e');
    }
    
    _isLoading = false;
    notifyListeners();
  }

  // Load settings from SharedPreferences
  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    
    _isDarkTheme = prefs.getBool(_isDarkThemeKey) ?? true;
    _isLocationSharingEnabled = prefs.getBool(_isLocationSharingKey) ?? false;
    _locationUpdateInterval = prefs.getInt(_locationUpdateIntervalKey) ?? 30;
    _notificationsEnabled = prefs.getBool(_notificationsEnabledKey) ?? true;
    _autoBackupEnabled = prefs.getBool(_autoBackupKey) ?? false;
  }

  // Save settings to SharedPreferences
  Future<void> _saveSettings() async {
    final prefs = await SharedPreferences.getInstance();
    
    await Future.wait([
      prefs.setBool(_isDarkThemeKey, _isDarkTheme),
      prefs.setBool(_isLocationSharingKey, _isLocationSharingEnabled),
      prefs.setInt(_locationUpdateIntervalKey, _locationUpdateInterval),
      prefs.setBool(_notificationsEnabledKey, _notificationsEnabled),
      prefs.setBool(_autoBackupKey, _autoBackupEnabled),
    ]);
  }

  // Toggle dark theme
  Future<void> toggleDarkTheme() async {
    _isDarkTheme = !_isDarkTheme;
    notifyListeners();
    await _saveSettings();
  }

  // Set dark theme
  Future<void> setDarkTheme(bool enabled) async {
    if (_isDarkTheme != enabled) {
      _isDarkTheme = enabled;
      notifyListeners();
      await _saveSettings();
    }
  }

  // Toggle location sharing
  Future<void> toggleLocationSharing() async {
    _isLocationSharingEnabled = !_isLocationSharingEnabled;
    notifyListeners();
    await _saveSettings();
  }

  // Set location sharing
  Future<void> setLocationSharing(bool enabled) async {
    if (_isLocationSharingEnabled != enabled) {
      _isLocationSharingEnabled = enabled;
      notifyListeners();
      await _saveSettings();
    }
  }

  // Set location update interval
  Future<void> setLocationUpdateInterval(int seconds) async {
    if (_locationUpdateInterval != seconds) {
      _locationUpdateInterval = seconds;
      notifyListeners();
      await _saveSettings();
    }
  }

  // Toggle notifications
  Future<void> toggleNotifications() async {
    _notificationsEnabled = !_notificationsEnabled;
    notifyListeners();
    await _saveSettings();
  }

  // Set notifications
  Future<void> setNotifications(bool enabled) async {
    if (_notificationsEnabled != enabled) {
      _notificationsEnabled = enabled;
      notifyListeners();
      await _saveSettings();
    }
  }

  // Toggle auto backup
  Future<void> toggleAutoBackup() async {
    _autoBackupEnabled = !_autoBackupEnabled;
    notifyListeners();
    await _saveSettings();
  }

  // Set auto backup
  Future<void> setAutoBackup(bool enabled) async {
    if (_autoBackupEnabled != enabled) {
      _autoBackupEnabled = enabled;
      notifyListeners();
      await _saveSettings();
    }
  }

  // Reset all settings to defaults
  Future<void> resetSettings() async {
    _isDarkTheme = true;
    _isLocationSharingEnabled = false;
    _locationUpdateInterval = 30;
    _notificationsEnabled = true;
    _autoBackupEnabled = false;
    
    notifyListeners();
    await _saveSettings();
  }

  // Export settings as JSON
  Map<String, dynamic> exportSettings() {
    return {
      'isDarkTheme': _isDarkTheme,
      'isLocationSharingEnabled': _isLocationSharingEnabled,
      'locationUpdateInterval': _locationUpdateInterval,
      'notificationsEnabled': _notificationsEnabled,
      'autoBackupEnabled': _autoBackupEnabled,
      'exportedAt': DateTime.now().toIso8601String(),
    };
  }

  // Import settings from JSON
  Future<bool> importSettings(Map<String, dynamic> settings) async {
    try {
      _isDarkTheme = settings['isDarkTheme'] ?? true;
      _isLocationSharingEnabled = settings['isLocationSharingEnabled'] ?? false;
      _locationUpdateInterval = settings['locationUpdateInterval'] ?? 30;
      _notificationsEnabled = settings['notificationsEnabled'] ?? true;
      _autoBackupEnabled = settings['autoBackupEnabled'] ?? false;
      
      notifyListeners();
      await _saveSettings();
      return true;
    } catch (e) {
      print('Error importing settings: $e');
      return false;
    }
  }

  // Get app info
  static const String appVersion = '1.0.0';
  static const String appBuild = '1';
  static const String appName = 'UniLocator';
  
  String get fullAppVersion => '$appVersion+$appBuild';
  
  // Privacy and terms URLs
  static const String privacyPolicyUrl = 'https://example.com/privacy';
  static const String termsOfServiceUrl = 'https://example.com/terms';
  static const String supportUrl = 'https://example.com/support';
  
  // Feature flags
  bool get isMapFeatureEnabled => true;
  bool get isFriendsFeatureEnabled => true;
  bool get isDeviceTrackingEnabled => true;
  bool get isLocationHistoryEnabled => true;
  
  // Theme settings
  bool get isSystemTheme => false; // Could be extended to support system theme
  
  // Accessibility settings
  bool get isHighContrastEnabled => false;
  bool get isLargeTextEnabled => false;
  
  // Performance settings
  bool get isPerformanceModeEnabled => false;
  bool get isDataSaverEnabled => false;
  
  // Debug settings (only in debug mode)
  bool get isDebugModeEnabled => false;
  
  @override
  void dispose() {
    super.dispose();
  }
}