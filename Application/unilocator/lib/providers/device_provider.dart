
import '../models/device.dart';
import '../services/api_service.dart';

import 'dart:convert';

import 'package:flutter/foundation.dart';

class DeviceProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  List<Device> _devices = [];
  bool _isLoadingDevices = false;
  bool _isLoadingDevice = false;
  Device? _selectedDevice;

  List<Device> get devices => _devices;
  bool get isLoadingDevices => _isLoadingDevices;
  bool get isLoadingDevice => _isLoadingDevice;

  Device? getDeviceById(String id) {
    try {
      return _devices.firstWhere((d) => d.id == id);
    } catch (_) {
      return _selectedDevice;
    }
  }

  Future<void> fetchDevices() async {
    _isLoadingDevices = true;
    notifyListeners();
    try {
      final response = await _apiService.get('/api/devices');
      if (response.statusCode == 200) {
        final List<dynamic> data = response.body.isNotEmpty ? jsonDecode(response.body) : [];
        _devices = data.map((json) => Device.fromJson(json)).toList();
      }
    } catch (e) {
      // Handle error
    } finally {
      _isLoadingDevices = false;
      notifyListeners();
    }
  }

  Future<void> fetchDeviceDetails(String id) async {
    _isLoadingDevice = true;
    notifyListeners();
    try {
      final response = await _apiService.get('/get_location/$id');
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _selectedDevice = Device.fromJson(data);
      }
    } catch (e) {
      // Handle error
    } finally {
      _isLoadingDevice = false;
      notifyListeners();
    }
  }
}
