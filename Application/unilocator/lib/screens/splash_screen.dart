import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:provider/provider.dart';
import '../main.dart';

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  Future<void> _initFirebase(BuildContext context) async {
    final logger = Provider.of<AppLogger>(context, listen: false);
    try {
      logger.log('Initializing Firebase...', type: LogType.info);
      await Firebase.initializeApp();
      logger.log('Firebase initialized successfully.', type: LogType.success);
      if (context.mounted) {
        AppLogger.logGlobal(
          'Navigating to login screen from splash',
          type: LogType.info,
        );
        Navigator.pushReplacementNamed(context, '/login');
      }
    } catch (e, st) {
      logger.log(
        'Firebase initialization failed: $e\n$st',
        type: LogType.error,
      );
      rethrow;
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder(
      future: _initFirebase(context),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return Scaffold(
            body: Stack(
              children: [
                Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.location_on,
                        size: 80,
                        color: Color(0xFF047a39),
                      ),
                      const SizedBox(height: 24),
                      Text(
                        'UniLocator',
                        style: TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF047a39),
                        ),
                      ),
                      const SizedBox(height: 16),
                      CircularProgressIndicator(color: Color(0xFF047a39)),
                    ],
                  ),
                ),
              ],
            ),
          );
        } else if (snapshot.hasError) {
          final logger = Provider.of<AppLogger>(context, listen: false);
          logger.log(
            'SplashScreen error: ${snapshot.error}',
            type: LogType.error,
          );
          return Scaffold(
            body: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error, size: 80, color: Colors.redAccent),
                  const SizedBox(height: 24),
                  Text(
                    'Failed to initialize app',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: Colors.redAccent,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Text(
                      snapshot.error.toString(),
                      style: TextStyle(color: Colors.redAccent),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  LoggedElevatedButton(
                    onPressed: () => _initFirebase(context),
                    logMessage: 'Retry button pressed on splash screen',
                    child: Text('Retry'),
                  ),
                ],
              ),
            ),
          );
        } else {
          // Should never reach here, navigation happens on success
          return SizedBox.shrink();
        }
      },
    );
  }
}
