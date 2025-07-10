import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../auth/firebase_auth_provider.dart';
import '../../main.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  String _email = '';
  String _password = '';
  bool _loading = false;
  String? _error;

  void _login() async {
    final logger = Provider.of<AppLogger>(context, listen: false);
    FocusScope.of(context).unfocus();
    if (!_formKey.currentState!.validate()) {
      logger.log('Login form validation failed.', type: LogType.warning);
      return;
    }
    _formKey.currentState!.save();
    logger.log('Attempting login for $_email', type: LogType.info);
    setState(() {
      _loading = true;
      _error = null;
    });
    final authProvider = Provider.of<FirebaseAuthProvider>(
      context,
      listen: false,
    );
    try {
      final success = await authProvider.login(_email, _password);
      setState(() => _loading = false);
      if (!mounted) return;
      if (success) {
        logger.log('Login successful for $_email', type: LogType.success);
        Navigator.pushReplacementNamed(context, '/dashboard');
      } else {
        logger.log('Login failed: ${authProvider.error}', type: LogType.error);
        setState(() => _error = authProvider.error ?? 'Login failed.');
      }
    } catch (e, st) {
      logger.log('Login exception: $e\n$st', type: LogType.error);
      setState(() {
        _loading = false;
        _error = 'An unexpected error occurred.';
      });
    }
  }

  @override
  void initState() {
    super.initState();
    // Log screen entry instead of clearing logs
    AppLogger.logGlobal('Entered Login screen', type: LogType.info);
  }

  @override
  Widget build(BuildContext context) {
    final logger = Provider.of<AppLogger>(context, listen: false);
    return Scaffold(
      backgroundColor: const Color(0xFF000000),
      body: Stack(
        children: [
          Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(32),
              child: Form(
                key: _formKey,
                autovalidateMode: AutovalidateMode.onUserInteraction,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Icon(Icons.location_on, size: 72, color: Color(0xFF037d3a)),
                    const SizedBox(height: 24),
                    Text(
                      'Welcome to UniLocator',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF037d3a),
                      ),
                    ),
                    const SizedBox(height: 32),
                    if (_error != null)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: Text(
                          _error!,
                          style: TextStyle(
                            color: Colors.redAccent,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    TextFormField(
                      decoration: const InputDecoration(
                        labelText: 'Email',
                        prefixIcon: Icon(Icons.email),
                      ),
                      validator: (v) =>
                          v == null || v.isEmpty ? 'Enter email' : null,
                      onSaved: (v) => _email = v ?? '',
                      keyboardType: TextInputType.emailAddress,
                      autofillHints: const [AutofillHints.email],
                    ),
                    const SizedBox(height: 18),
                    TextFormField(
                      decoration: const InputDecoration(
                        labelText: 'Password',
                        prefixIcon: Icon(Icons.lock),
                      ),
                      obscureText: true,
                      validator: (v) =>
                          v == null || v.isEmpty ? 'Enter password' : null,
                      onSaved: (v) => _password = v ?? '',
                      autofillHints: const [AutofillHints.password],
                    ),
                    const SizedBox(height: 28),
                    AnimatedSwitcher(
                      duration: Duration(milliseconds: 250),
                      child: _loading
                          ? Center(
                              child: CircularProgressIndicator(
                                color: Color(0xFF037d3a),
                              ),
                            )
                          : ElevatedButton(
                              onPressed: () {
                                logger.log(
                                  'Login button pressed',
                                  type: LogType.info,
                                );
                                _login();
                              },
                              style: ElevatedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(
                                  vertical: 16,
                                ),
                                textStyle: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              child: const Text('Login'),
                            ),
                    ),
                    const SizedBox(height: 18),
                    TextButton(
                      onPressed: _loading
                          ? null
                          : () {
                              logger.log(
                                'Navigate to Register screen',
                                type: LogType.info,
                              );
                              Navigator.pushReplacementNamed(
                                context,
                                '/register',
                              );
                            },
                      child: const Text(
                        'Don\'t have an account? Register',
                        style: TextStyle(fontSize: 16),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
