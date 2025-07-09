import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../auth/firebase_auth_provider.dart';
import '../../main.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  String _username = '';
  String _email = '';
  String _password = '';
  bool _loading = false;
  String? _error;

  void _register() async {
    final logger = Provider.of<AppLogger>(context, listen: false);
    FocusScope.of(context).unfocus();
    if (!_formKey.currentState!.validate()) {
      logger.log('Registration form validation failed.', type: LogType.warning);
      return;
    }
    _formKey.currentState!.save();
    logger.log('Attempting registration for $_email', type: LogType.info);
    setState(() {
      _loading = true;
      _error = null;
    });
    final authProvider = Provider.of<FirebaseAuthProvider>(
      context,
      listen: false,
    );
    try {
      final success = await authProvider.register(_email, _password, _username);
      setState(() => _loading = false);
      if (!mounted) return;
      if (success) {
        logger.log(
          'Registration successful for $_email',
          type: LogType.success,
        );
        Navigator.pushReplacementNamed(context, '/login');
      } else {
        logger.log(
          'Registration failed: ${authProvider.error}',
          type: LogType.error,
        );
        setState(() => _error = authProvider.error ?? 'Registration failed.');
      }
    } catch (e, st) {
      logger.log('Registration exception: $e\n$st', type: LogType.error);
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
    AppLogger.logGlobal('Entered Register screen', type: LogType.info);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF000000),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(32),
          child: Form(
            key: _formKey,
            autovalidateMode: AutovalidateMode.onUserInteraction,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Icon(Icons.person_add, size: 72, color: Color(0xFF047a39)),
                const SizedBox(height: 24),
                Text(
                  'Create your UniLocator account',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 26,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF047a39),
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
                    labelText: 'Username',
                    prefixIcon: Icon(Icons.person),
                  ),
                  validator: (v) =>
                      v == null || v.isEmpty ? 'Enter username' : null,
                  onSaved: (v) => _username = v ?? '',
                  autofillHints: const [AutofillHints.username],
                ),
                const SizedBox(height: 18),
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
                  autofillHints: const [AutofillHints.newPassword],
                ),
                const SizedBox(height: 28),
                AnimatedSwitcher(
                  duration: Duration(milliseconds: 250),
                  child: _loading
                      ? Center(
                          child: CircularProgressIndicator(
                            color: Color(0xFF047a39),
                          ),
                        )
                      : ElevatedButton(
                          onPressed: _register,
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            textStyle: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          child: const Text('Register'),
                        ),
                ),
                const SizedBox(height: 18),
                TextButton(
                  onPressed: _loading
                      ? null
                      : () {
                          AppLogger.logGlobal(
                            'Navigate to Login button pressed',
                          );
                          Navigator.pushReplacementNamed(context, '/login');
                        },
                  child: const Text(
                    'Already have an account? Login',
                    style: TextStyle(fontSize: 16),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
