
import 'package:flutter/foundation.dart';
import 'package:uuid/uuid.dart';
import '../models/device.dart';
import '../services/firebase_service.dart';
import '../services/location_service.dart';

class DeviceProvider extends ChangeNotifier {
  final FirebaseService _firebaseService = FirebaseService();
  final LocationService _locationService = LocationService();
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

  // Initialize and fetch devices
  Future<void> initialize() async {
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

      bool success = await _firebaseService.addDevice(device);
      if (success) {
        _devices.add(device);
        _error = null;
        notifyListeners();
        return true;
      } else {
        _error = 'Failed to add device';
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'Error adding device: $e';
      notifyListeners();
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Update device
  Future<bool> updateDevice(Device device) async {
    _setLoading(true);
    try {
      bool success = await _firebaseService.updateDevice(device);
      if (success) {
        int index = _devices.indexWhere((d) => d.id == device.id);
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
      notifyListeners();
      return false;
    } catch (e) {
      _error = 'Error updating device: $e';
      notifyListeners();
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Delete device
  Future<bool> deleteDevice(String deviceId) async {
    _setLoading(true);
    try {
      bool success = await _firebaseService.deleteDevice(deviceId);
      if (success) {
        _devices.removeWhere((d) => d.id == deviceId);
        if (_selectedDevice?.id == deviceId) {
          _selectedDevice = null;
        }
        _error = null;
        notifyListeners();
        return true;
      }
      _error = 'Failed to delete device';
      notifyListeners();
      return false;
    } catch (e) {
      _error = 'Error deleting device: $e';
      notifyListeners();
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Set device online/offline status
  Future<bool> updateDeviceStatus(String deviceId, bool isOnline) async {
    try {
      Device? device = _devices.firstWhere((d) => d.id == deviceId);
      Device updatedDevice = device.copyWith(
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
    double longitude,
  ) async {
    try {
      String? address = await _locationService.getAddressFromCoordinates(
        latitude,
        longitude,
      );

      Device? device = _devices.firstWhere((d) => d.id == deviceId);
      Device updatedDevice = device.copyWith(
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
      Device? device = _devices.firstWhere((d) => d.id == deviceId);
      Device updatedDevice = device.copyWith(
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

  // Get devices within a certain distance from a location
  List<Device> getDevicesNearLocation(
    double latitude,
    double longitude,
    double radiusInMeters,
  ) {
    return _devices.where((device) {
      if (device.latitude == null || device.longitude == null) {
        return false;
      }
      double distance = _locationService.calculateDistance(
        latitude,
        longitude,
        device.latitude!,
        device.longitude!,
      );
      return distance <= radiusInMeters;
    }).toList();
  }

  // Get battery status summary
  Map<String, int> getBatteryStatusSummary() {
    Map<String, int> summary = {
      'critical': 0, // 0-20%
      'low': 0, // 21-40%
      'medium': 0, // 41-70%
      'high': 0, // 71-100%
      'unknown': 0, // No battery info
    };

    for (Device device in _devices) {
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

  // Get device type distribution
  Map<DeviceType, int> getDeviceTypeDistribution() {
    Map<DeviceType, int> distribution = {};
    for (DeviceType type in DeviceType.values) {
      distribution[type] = 0;
    }

    for (Device device in _devices) {
      distribution[device.type] = distribution[device.type]! + 1;
    }

    return distribution;
  }

  // Refresh devices
  Future<void> refreshDevices() async {
    await initialize();
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

  // Format last seen time
  String formatLastSeen(DateTime? lastSeen) {
    if (lastSeen == null) return 'Never';

    final now = DateTime.now();
    final difference = now.difference(lastSeen);

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

  // Get device icon based on type
  String getDeviceIcon(DeviceType type) {
    switch (type) {
      case DeviceType.phone:
        return 'phone_android';
      case DeviceType.tablet:
        return 'tablet';
      case DeviceType.laptop:
        return 'laptop';
      case DeviceType.watch:
        return 'watch';
      case DeviceType.earbuds:
        return 'headphones';
      case DeviceType.other:
        return 'device_unknown';
    }
  }

  @override
  void dispose() {
    super.dispose();
  }
}
