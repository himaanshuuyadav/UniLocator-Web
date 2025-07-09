import 'package:flutter/material.dart';
import '../services/auth_service.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();
  bool _isLoading = false;
  String? _error;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<String?> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    final errorMsg = await _authService.login(email, password);
    _error = errorMsg;
    _isLoading = false;
    notifyListeners();
    return errorMsg;
  }

  Future<String?> register(String username, String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    final errorMsg = await _authService.register(username, email, password);
    _error = errorMsg;
    _isLoading = false;
    notifyListeners();
    return errorMsg;
  }

  Future<void> logout() async {
    await _authService.logout();
  }
}
