import 'dart:convert';
// import 'package:http/http.dart' as http; // Removed unused import
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';

class AuthService {
  final ApiService _apiService = ApiService();

  Future<String?> login(String email, String password) async {
    final response = await _apiService.post('/auth/login', {
      'email': email,
      'password': password,
    });
    // print('LOGIN RESPONSE: ${response.statusCode} ${response.body}'); // Avoid print in production
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final token = data['access_token'];
      if (token != null) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('jwt_token', token);
        return null; // null means success
      } else {
        return 'No token received from server.';
      }
    } else {
      try {
        final data = jsonDecode(response.body);
        return data['msg'] ?? 'Login failed.';
      } catch (e) {
        return 'Login failed.';
      }
    }
  }

  Future<String?> register(
    String username,
    String email,
    String password,
  ) async {
    final response = await _apiService.post('/auth/register', {
      'username': username,
      'email': email,
      'password': password,
    });
    // print('REGISTER RESPONSE: ${response.statusCode} ${response.body}'); // Avoid print in production
    if (response.statusCode == 201) {
      return null; // null means success
    } else {
      try {
        final data = jsonDecode(response.body);
        return data['msg'] ?? 'Registration failed.';
      } catch (e) {
        return 'Registration failed.';
      }
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('jwt_token');
  }
}
