import 'package:flutter/material.dart';

import 'auth/firebase_auth_provider.dart';
import 'package:provider/provider.dart';
import 'screens/splash_screen.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/device_details_screen.dart';
import 'providers/device_provider.dart';
import 'package:flutter/services.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const UniLocatorRoot());
}

class UniLocatorRoot extends StatelessWidget {
  const UniLocatorRoot({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => FirebaseAuthProvider()),
        ChangeNotifierProvider<DeviceProvider>(create: (_) => DeviceProvider()),
        ChangeNotifierProvider(create: (_) => AppLogger()),
      ],
      child: const UniLocatorApp(),
    );
  }
}

class UniLocatorApp extends StatelessWidget {
  const UniLocatorApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'UniLocator',
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF000000),
        primaryColor: const Color(0xFF047a39),
        colorScheme: ColorScheme.dark(
          primary: Color(0xFF047a39),
          secondary: Color(0xFF1a1a1a),
          surface: Color(0xFF1a1a1a),
        ),
        appBarTheme: AppBarTheme(
          backgroundColor: const Color(0xFF000000),
          elevation: 2,
          titleTextStyle: TextStyle(
            color: Color(0xFF047a39),
            fontWeight: FontWeight.bold,
            fontSize: 22,
          ),
          iconTheme: IconThemeData(color: Color(0xFF047a39)),
        ),
        cardColor: const Color(0xFF1a1a1a),
        textTheme: const TextTheme(
          bodyLarge: TextStyle(color: Colors.white),
          bodyMedium: TextStyle(color: Color(0xFF888888)),
          titleLarge: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 20,
          ),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: Color(0xFF047a39),
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
            padding: EdgeInsets.symmetric(vertical: 14, horizontal: 24),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          fillColor: Color(0xFF1a1a1a),
          filled: true,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: BorderSide(color: Color(0xFF2a2a2a)),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: BorderSide(color: Color(0xFF2a2a2a)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: BorderSide(color: Color(0xFF047a39)),
          ),
          labelStyle: TextStyle(color: Color(0xFF888888)),
        ),
      ),
      navigatorObservers: [NavigationLogger()],
      builder: (context, child) {
        return Stack(
          children: [
            child ?? const SizedBox.shrink(),
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: const PersistentLogPanel(),
            ),
          ],
        );
      },
      initialRoute: '/',
      routes: {
        '/': (context) => const SplashScreen(),
        '/login': (context) => const LoginScreen(),
        '/register': (context) => const RegisterScreen(),
        '/dashboard': (context) => const DashboardScreen(),
        '/device': (context) => const DeviceDetailsScreen(),
      },
    );
  }
}

// Navigation logger to track all route changes
class NavigationLogger extends NavigatorObserver {
  @override
  void didPush(Route<dynamic> route, Route<dynamic>? previousRoute) {
    super.didPush(route, previousRoute);
    if (route.settings.name != null) {
      _getLogger()?.log(
        'Navigated to: ${route.settings.name}',
        type: LogType.info,
      );
    }
  }

  @override
  void didReplace({Route<dynamic>? newRoute, Route<dynamic>? oldRoute}) {
    super.didReplace(newRoute: newRoute, oldRoute: oldRoute);
    if (newRoute?.settings.name != null) {
      _getLogger()?.log(
        'Replaced route with: ${newRoute!.settings.name}',
        type: LogType.info,
      );
    }
  }

  AppLogger? _getLogger() {
    try {
      return AppLogger._instance;
    } catch (e) {
      return null;
    }
  }
}

// Modern embedded log display that looks engraved into the screen
class PersistentLogPanel extends StatelessWidget {
  const PersistentLogPanel({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AppLogger>(
      builder: (context, logger, _) => Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        height: 120,
        decoration: BoxDecoration(
          // Outer elevated container for depth
          color: const Color(0xFF1a1a1a),
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.8),
              offset: const Offset(2, 2),
              blurRadius: 6,
            ),
            BoxShadow(
              color: const Color(0xFF2a2a2a),
              offset: const Offset(-1, -1),
              blurRadius: 3,
            ),
          ],
        ),
        child: Container(
          margin: const EdgeInsets.all(2),
          decoration: BoxDecoration(
            // Inner recessed container for engraved effect
            color: const Color(0xFF0a0a0a),
            borderRadius: BorderRadius.circular(10),
            boxShadow: [
              BoxShadow(
                color: Colors.black,
                offset: const Offset(1, 1),
                blurRadius: 2,
              ),
            ],
            border: Border.all(color: const Color(0xFF333333), width: 0.5),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(9),
            child: Column(
              children: [
                // Header with subtle design
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: const BoxDecoration(
                    color: Color(0xFF111111),
                    border: Border(
                      bottom: BorderSide(color: Color(0xFF047a39), width: 1),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Icon(
                            Icons.terminal,
                            color: Color(0xFF047a39),
                            size: 14,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            'App Logs',
                            style: TextStyle(
                              color: Color(0xFF047a39),
                              fontWeight: FontWeight.w600,
                              fontSize: 12,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                      // Copy button with subtle design and hover effect
                      MouseRegion(
                        cursor: SystemMouseCursors.click,
                        child: GestureDetector(
                          onTap: () async {
                            // Copy logs BEFORE adding the "copied" message
                            final logs = logger.logs
                                .map(
                                  (log) =>
                                      '${log.type.name.toUpperCase()}: ${log.message}',
                                )
                                .join('\n');
                            await Clipboard.setData(ClipboardData(text: logs));

                            // Show snackbar AFTER copying
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text('Logs copied to clipboard!'),
                                  duration: Duration(seconds: 1),
                                  backgroundColor: Color(0xFF047a39),
                                ),
                              );
                              logger.log(
                                'Logs copied to clipboard',
                                type: LogType.info,
                              );
                            }
                          },
                          child: AnimatedContainer(
                            duration: Duration(milliseconds: 200),
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              color: const Color(0xFF1a1a1a),
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(
                                color: const Color(0xFF047a39),
                                width: 0.5,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: Color(
                                    0xFF047a39,
                                  ).withValues(alpha: 0.3),
                                  blurRadius: 2,
                                  spreadRadius: 0,
                                ),
                              ],
                            ),
                            child: Icon(
                              Icons.copy,
                              color: Colors.white70,
                              size: 12,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                // Log content area
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    child: logger.logs.isEmpty
                        ? Center(
                            child: Text(
                              'No logs yet',
                              style: TextStyle(
                                color: Colors.grey.withValues(alpha: 0.7),
                                fontSize: 11,
                                fontStyle: FontStyle.italic,
                              ),
                            ),
                          )
                        : ListView.builder(
                            reverse: true, // Show latest logs at bottom
                            itemCount: logger.logs.length,
                            itemBuilder: (context, index) {
                              final log =
                                  logger.logs[logger.logs.length - 1 - index];
                              Color color;
                              IconData icon;
                              switch (log.type) {
                                case LogType.success:
                                  color = const Color(0xFF4CAF50);
                                  icon = Icons.check_circle;
                                  break;
                                case LogType.warning:
                                  color = const Color(0xFFFF9800);
                                  icon = Icons.warning;
                                  break;
                                case LogType.error:
                                  color = const Color(0xFFF44336);
                                  icon = Icons.error;
                                  break;
                                default:
                                  color = Colors.white70;
                                  icon = Icons.info;
                              }
                              return Padding(
                                padding: const EdgeInsets.symmetric(
                                  vertical: 1,
                                ),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Icon(icon, color: color, size: 10),
                                    const SizedBox(width: 6),
                                    Expanded(
                                      child: Text(
                                        log.message,
                                        style: TextStyle(
                                          color: color,
                                          fontSize: 10,
                                          height: 1.2,
                                        ),
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
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

// Enhanced AppLogger with singleton pattern for global access
class AppLogger extends ChangeNotifier {
  static AppLogger? _instance;
  final List<_LogEntry> _logs = [];
  List<_LogEntry> get logs => List.unmodifiable(_logs);

  AppLogger() {
    _instance = this;
    log('App started', type: LogType.info);
  }

  void log(String message, {LogType type = LogType.info}) {
    _logs.add(_LogEntry(message, type));
    // Keep only last 100 logs to prevent memory issues
    if (_logs.length > 100) {
      _logs.removeAt(0);
    }
    notifyListeners();
  }

  void clear() {
    _logs.clear();
    notifyListeners();
  }

  // Static method for easy access from anywhere
  static void logGlobal(String message, {LogType type = LogType.info}) {
    _instance?.log(message, type: type);
  }
}

// Helper widget to log button presses
class LoggedElevatedButton extends StatelessWidget {
  final VoidCallback? onPressed;
  final Widget child;
  final String? logMessage;
  final ButtonStyle? style;

  const LoggedElevatedButton({
    super.key,
    required this.onPressed,
    required this.child,
    this.logMessage,
    this.style,
  });

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      style: style,
      onPressed: onPressed == null
          ? null
          : () {
              AppLogger.logGlobal(
                logMessage ?? 'Button pressed',
                type: LogType.info,
              );
              onPressed!();
            },
      child: child,
    );
  }
}

// Helper widget to log text button presses
class LoggedTextButton extends StatelessWidget {
  final VoidCallback? onPressed;
  final Widget child;
  final String? logMessage;
  final ButtonStyle? style;

  const LoggedTextButton({
    super.key,
    required this.onPressed,
    required this.child,
    this.logMessage,
    this.style,
  });

  @override
  Widget build(BuildContext context) {
    return TextButton(
      style: style,
      onPressed: onPressed == null
          ? null
          : () {
              AppLogger.logGlobal(
                logMessage ?? 'Text button pressed',
                type: LogType.info,
              );
              onPressed!();
            },
      child: child,
    );
  }
}

enum LogType { info, success, warning, error }

class _LogEntry {
  final String message;
  final LogType type;
  _LogEntry(this.message, this.type);
}
