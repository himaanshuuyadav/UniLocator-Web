import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import '../services/firebase_service.dart';
import '../models/device.dart';

class DeviceProvider extends ChangeNotifier {
  final FirebaseService _firebaseService = FirebaseService();
  final Uuid _uuid = const Uuid();

  List<Device> _devices = [];
  bool _isLoading = false;
  String? _error;
  Device? _selectedDevice;

  // Getters
  List<Device> get devices => _devices;
  List<Device> get onlineDevices => _devices.where((d) => d.isOnline).toList();
  List<Device> get offlineDevices => _devices.where((d) => !d.isOnline).toList();
  bool get isLoading => _isLoading;
  String? get error => _error;
  Device? get selectedDevice => _selectedDevice;
  int get deviceCount => _devices.length;

  // Initialize and start listening to real-time updates
  void initialize() {
    startListening();
    loadDevices();
  }

  // Load devices from Firebase
  Future<void> loadDevices() async {
    _setLoading(true);
    try {
      _devices = await _firebaseService.getUserDevices();
      _error = null;
    } catch (e) {
      _error = 'Failed to load devices: $e';
    } finally {
      _setLoading(false);
    }
  }

  // Listen to real-time device updates
  void startListening() {
    _firebaseService.getUserDevicesStream().listen(
      (devices) {
        _devices = devices;
        _error = null;
        notifyListeners();
      },
      onError: (error) {
        _error = 'Error listening to devices: $error';
        notifyListeners();
      },
    );
  }

  // Add new device
  Future<bool> addDevice({
    required String name,
    required DeviceType type,
    String? deviceInfo,
  }) async {
    if (!_firebaseService.isAuthenticated) {
      _error = 'User not authenticated';
      notifyListeners();
      return false;
    }

    _setLoading(true);
    try {
      final device = Device(
        id: _uuid.v4(),
        name: name,
        userId: _firebaseService.currentUser!.uid,
        type: type,
        deviceInfo: deviceInfo,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      final success = await _firebaseService.addDevice(device);
      if (success) {
        _error = null;
        return true;
      } else {
        _error = 'Failed to add device';
        return false;
      }
    } catch (e) {
      _error = 'Error adding device: $e';
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Update device
  Future<bool> updateDevice(Device device) async {
    try {
      final success = await _firebaseService.updateDevice(device);
      if (success) {
        final index = _devices.indexWhere((d) => d.id == device.id);
        if (index != -1) {
          _devices[index] = device;
          if (_selectedDevice?.id == device.id) {
            _selectedDevice = device;
          }
          _error = null;
          notifyListeners();
          return true;
        }
      }
      _error = 'Failed to update device';
      return false;
    } catch (e) {
      _error = 'Error updating device: $e';
      return false;
    }
  }

  // Delete device
  Future<bool> deleteDevice(String deviceId) async {
    _setLoading(true);
    try {
      final success = await _firebaseService.deleteDevice(deviceId);
      if (success) {
        _devices.removeWhere((d) => d.id == deviceId);
        if (_selectedDevice?.id == deviceId) {
          _selectedDevice = null;
        }
        _error = null;
        notifyListeners();
        return true;
      } else {
        _error = 'Failed to delete device';
        return false;
      }
    } catch (e) {
      _error = 'Error deleting device: $e';
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Update device status (online/offline)
  Future<bool> updateDeviceStatus(String deviceId, bool isOnline) async {
    try {
      final device = getDeviceById(deviceId);
      if (device == null) return false;

      final updatedDevice = device.copyWith(
        isOnline: isOnline,
        lastSeen: DateTime.now(),
      );

      return await updateDevice(updatedDevice);
    } catch (e) {
      _error = 'Error updating device status: $e';
      notifyListeners();
      return false;
    }
  }

  // Update device location
  Future<bool> updateDeviceLocation(
    String deviceId,
    double latitude,
    double longitude, {
    String? address,
  }) async {
    try {
      final device = getDeviceById(deviceId);
      if (device == null) return false;

      final updatedDevice = device.copyWith(
        latitude: latitude,
        longitude: longitude,
        address: address,
        lastSeen: DateTime.now(),
      );

      return await updateDevice(updatedDevice);
    } catch (e) {
      _error = 'Error updating device location: $e';
      notifyListeners();
      return false;
    }
  }

  // Update device battery level
  Future<bool> updateDeviceBattery(String deviceId, int batteryLevel) async {
    try {
      final device = getDeviceById(deviceId);
      if (device == null) return false;

      final updatedDevice = device.copyWith(
        batteryLevel: batteryLevel,
        lastSeen: DateTime.now(),
      );

      return await updateDevice(updatedDevice);
    } catch (e) {
      _error = 'Error updating device battery: $e';
      notifyListeners();
      return false;
    }
  }

  // Get device by ID
  Device? getDeviceById(String id) {
    try {
      return _devices.firstWhere((d) => d.id == id);
    } catch (e) {
      return null;
    }
  }

  // Select device for detailed view
  void selectDevice(String deviceId) {
    _selectedDevice = getDeviceById(deviceId);
    notifyListeners();
  }

  // Clear selected device
  void clearSelectedDevice() {
    _selectedDevice = null;
    notifyListeners();
  }

  // Get devices by type
  List<Device> getDevicesByType(DeviceType type) {
    return _devices.where((d) => d.type == type).toList();
  }

  // Get device type distribution
  Map<DeviceType, int> getDeviceTypeDistribution() {
    final Map<DeviceType, int> distribution = {};
    
    for (final type in DeviceType.values) {
      distribution[type] = 0;
    }
    
    for (final device in _devices) {
      distribution[device.type] = (distribution[device.type] ?? 0) + 1;
    }
    
    return distribution;
  }

  // Get battery status summary
  Map<String, int> getBatteryStatusSummary() {
    final Map<String, int> summary = {
      'critical': 0, // 0-20%
      'low': 0, // 21-40%
      'medium': 0, // 41-70%
      'high': 0, // 71-100%
      'unknown': 0, // No battery info
    };

    for (final device in _devices) {
      if (device.batteryLevel == null) {
        summary['unknown'] = summary['unknown']! + 1;
      } else if (device.batteryLevel! <= 20) {
        summary['critical'] = summary['critical']! + 1;
      } else if (device.batteryLevel! <= 40) {
        summary['low'] = summary['low']! + 1;
      } else if (device.batteryLevel! <= 70) {
        summary['medium'] = summary['medium']! + 1;
      } else {
        summary['high'] = summary['high']! + 1;
      }
    }

    return summary;
  }

  // Get devices with location
  List<Device> getDevicesWithLocation() {
    return _devices.where((d) => d.hasLocation).toList();
  }

  // Search devices
  List<Device> searchDevices(String query) {
    if (query.isEmpty) return _devices;
    
    return _devices.where((device) {
      return device.name.toLowerCase().contains(query.toLowerCase()) ||
             device.type.displayName.toLowerCase().contains(query.toLowerCase());
    }).toList();
  }

  // Get critical devices (low battery or offline for long time)
  List<Device> getCriticalDevices() {
    return _devices.where((device) {
      // Critical if battery is below 20% or offline for more than 24 hours
      final lowBattery = device.batteryLevel != null && device.batteryLevel! < 20;
      final longOffline = !device.isOnline && device.lastSeen != null &&
          DateTime.now().difference(device.lastSeen!).inHours > 24;
      
      return lowBattery || longOffline;
    }).toList();
  }

  // Refresh devices
  Future<void> refreshDevices() async {
    await loadDevices();
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

  @override
  void dispose() {
    super.dispose();
  }
}