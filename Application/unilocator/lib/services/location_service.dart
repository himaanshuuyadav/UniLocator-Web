import 'dart:async';
import 'dart:math' as dart_math;
import 'package:location/location.dart';
import 'package:geocoding/geocoding.dart';
import 'package:permission_handler/permission_handler.dart';
import 'firebase_service.dart';

class LocationService {
  static final LocationService _instance = LocationService._internal();
  factory LocationService() => _instance;
  LocationService._internal();

  final Location _location = Location();
  final FirebaseService _firebaseService = FirebaseService();

  StreamSubscription<LocationData>? _locationSubscription;
  LocationData? _currentLocation;
  String? _currentAddress;
  Timer? _locationUpdateTimer;

  // Getters
  LocationData? get currentLocation => _currentLocation;
  String? get currentAddress => _currentAddress;
  bool get isTracking => _locationSubscription != null;

  // Initialize location service
  Future<bool> initialize() async {
    try {
      bool serviceEnabled = await _location.serviceEnabled();
      if (!serviceEnabled) {
        serviceEnabled = await _location.requestService();
        if (!serviceEnabled) {
          return false;
        }
      }

      PermissionStatus permissionGranted = await _location.hasPermission();
      if (permissionGranted == PermissionStatus.denied) {
        permissionGranted = await _location.requestPermission();
        if (permissionGranted != PermissionStatus.granted) {
          return false;
        }
      }

      // Configure location settings
      await _location.changeSettings(
        accuracy: LocationAccuracy.high,
        interval: 10000, // 10 seconds
        distanceFilter: 10, // 10 meters
      );

      return true;
    } catch (e) {
      print('Error initializing location service: $e');
      return false;
    }
  }

  // Request location permissions
  Future<bool> requestLocationPermission() async {
    try {
      final PermissionStatus permission = await Permission.location.request();
      return permission == PermissionStatus.granted;
    } catch (e) {
      print('Error requesting location permission: $e');
      return false;
    }
  }

  // Get current location once
  Future<LocationData?> getCurrentLocation() async {
    try {
      if (!await initialize()) {
        return null;
      }

      LocationData locationData = await _location.getLocation();
      _currentLocation = locationData;

      // Get address from coordinates
      if (locationData.latitude != null && locationData.longitude != null) {
        _currentAddress = await getAddressFromCoordinates(
          locationData.latitude!,
          locationData.longitude!,
        );
      }

      return locationData;
    } catch (e) {
      print('Error getting current location: $e');
      return null;
    }
  }

  // Start continuous location tracking
  Future<bool> startLocationTracking({
    Duration updateInterval = const Duration(seconds: 30),
    bool updateFirebase = true,
  }) async {
    try {
      if (!await initialize()) {
        return false;
      }

      // Start location stream
      _locationSubscription = _location.onLocationChanged.listen(
        (LocationData locationData) async {
          _currentLocation = locationData;

          // Get address from coordinates
          if (locationData.latitude != null && locationData.longitude != null) {
            _currentAddress = await getAddressFromCoordinates(
              locationData.latitude!,
              locationData.longitude!,
            );

            // Update Firebase if enabled
            if (updateFirebase) {
              await _firebaseService.updateUserLocation(
                latitude: locationData.latitude!,
                longitude: locationData.longitude!,
                address: _currentAddress,
              );
            }
          }
        },
        onError: (dynamic error) {
          print('Location stream error: $error');
        },
      );

      // Start periodic updates if specified
      if (updateInterval.inSeconds > 0) {
        _locationUpdateTimer = Timer.periodic(updateInterval, (timer) async {
          await getCurrentLocation();
        });
      }

      return true;
    } catch (e) {
      print('Error starting location tracking: $e');
      return false;
    }
  }

  // Stop location tracking
  void stopLocationTracking() {
    _locationSubscription?.cancel();
    _locationSubscription = null;
    _locationUpdateTimer?.cancel();
    _locationUpdateTimer = null;
  }

  // Get address from coordinates
  Future<String?> getAddressFromCoordinates(double latitude, double longitude) async {
    try {
      List<Placemark> placemarks = await placemarkFromCoordinates(latitude, longitude);
      if (placemarks.isNotEmpty) {
        Placemark place = placemarks[0];
        return '${place.street}, ${place.locality}, ${place.country}';
      }
    } catch (e) {
      print('Error getting address from coordinates: $e');
    }
    return null;
  }

  // Get coordinates from address
  Future<LocationData?> getCoordinatesFromAddress(String address) async {
    try {
      List<Location> locations = await locationFromAddress(address);
      if (locations.isNotEmpty) {
        Location location = locations[0];
        return LocationData.fromMap({
          'latitude': location.latitude,
          'longitude': location.longitude,
        });
      }
    } catch (e) {
      print('Error getting coordinates from address: $e');
    }
    return null;
  }

  // Calculate distance between two points
  double calculateDistance(
    double lat1,
    double lon1,
    double lat2,
    double lon2,
  ) {
    const double earthRadius = 6371000; // Earth's radius in meters
    double dLat = _toRadians(lat2 - lat1);
    double dLon = _toRadians(lon2 - lon1);
    double a = 
        dart_math.sin(dLat / 2) * dart_math.sin(dLat / 2) +
        dart_math.cos(_toRadians(lat1)) * dart_math.cos(_toRadians(lat2)) *
        dart_math.sin(dLon / 2) * dart_math.sin(dLon / 2);
    double c = 2 * dart_math.asin(dart_math.sqrt(a));
    return earthRadius * c;
  }

  // Helper methods for distance calculation
  double _toRadians(double degrees) {
    return degrees * (3.14159265359 / 180);
  }

  // Format distance for display
  String formatDistance(double distanceInMeters) {
    if (distanceInMeters < 1000) {
      return '${distanceInMeters.round()} m';
    } else {
      double km = distanceInMeters / 1000;
      return '${km.toStringAsFixed(1)} km';
    }
  }

  // Check if location is within a geofence
  bool isWithinGeofence(
    double centerLat,
    double centerLon,
    double radius,
    double checkLat,
    double checkLon,
  ) {
    double distance = calculateDistance(centerLat, centerLon, checkLat, checkLon);
    return distance <= radius;
  }

  // Get location accuracy description
  String getLocationAccuracyDescription(double? accuracy) {
    if (accuracy == null) return 'Unknown';
    
    if (accuracy <= 5) {
      return 'Excellent';
    } else if (accuracy <= 10) {
      return 'Good';
    } else if (accuracy <= 20) {
      return 'Fair';
    } else {
      return 'Poor';
    }
  }

  // Check if location services are enabled
  Future<bool> isLocationServiceEnabled() async {
    return await _location.serviceEnabled();
  }

  // Check if location permissions are granted
  Future<bool> hasLocationPermission() async {
    final PermissionStatus permission = await _location.hasPermission();
    return permission == PermissionStatus.granted;
  }

  // Update device location in Firebase
  Future<bool> updateDeviceLocation(
    String deviceId,
    double latitude,
    double longitude,
  ) async {
    try {
      String? address = await getAddressFromCoordinates(latitude, longitude);
      return await _firebaseService.updateDeviceLocation(
        deviceId: deviceId,
        latitude: latitude,
        longitude: longitude,
        address: address,
      );
    } catch (e) {
      print('Error updating device location: $e');
      return false;
    }
  }

  // Dispose of resources
  void dispose() {
    stopLocationTracking();
  }
}

