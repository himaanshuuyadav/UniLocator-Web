import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  static const Color primaryGreen = Color(0xFF037d3a);
  static const Color darkBackground = Color(0xFF000000);
  static const Color cardBackground = Color(0xFF1a1a1a);
  static const Color surfaceColor = Color(0xFF2a2a2a);
  static const Color textSecondary = Color(0xFF888888);
  static const Color dividerColor = Color(0xFF333333);
  static const Color errorColor = Color(0xFFF44336);
  static const Color warningColor = Color(0xFFFF9800);
  static const Color successColor = Color(0xFF4CAF50);

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      fontFamily: GoogleFonts.inter().fontFamily,
      
      // Color Scheme
      colorScheme: const ColorScheme.dark(
        primary: primaryGreen,
        secondary: cardBackground,
        surface: cardBackground,
        background: darkBackground,
        onBackground: Colors.white,
        onSurface: Colors.white,
        onPrimary: Colors.white,
        error: errorColor,
        onError: Colors.white,
        outline: dividerColor,
        outlineVariant: surfaceColor,
      ),
      
      // Scaffold
      scaffoldBackgroundColor: darkBackground,
      
      // App Bar
      appBarTheme: AppBarTheme(
        backgroundColor: darkBackground,
        elevation: 0,
        scrolledUnderElevation: 2,
        shadowColor: primaryGreen.withOpacity(0.3),
        titleTextStyle: GoogleFonts.inter(
          color: primaryGreen,
          fontSize: 20,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.15,
        ),
        iconTheme: const IconThemeData(
          color: primaryGreen,
          size: 24,
        ),
        actionsIconTheme: const IconThemeData(
          color: primaryGreen,
          size: 24,
        ),
      ),
      
      // Card
      cardTheme: CardTheme(
        color: cardBackground,
        elevation: 2,
        shadowColor: primaryGreen.withOpacity(0.1),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        margin: const EdgeInsets.all(8),
      ),
      
      // Elevated Button
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryGreen,
          foregroundColor: Colors.white,
          elevation: 2,
          shadowColor: primaryGreen.withOpacity(0.3),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
          textStyle: GoogleFonts.inter(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.1,
          ),
        ),
      ),
      
      // Text Button
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: primaryGreen,
          textStyle: GoogleFonts.inter(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.1,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
      ),
      
      // Icon Button
      iconButtonTheme: IconButtonThemeData(
        style: IconButton.styleFrom(
          foregroundColor: primaryGreen,
          backgroundColor: Colors.transparent,
          highlightColor: primaryGreen.withOpacity(0.1),
          splashColor: primaryGreen.withOpacity(0.2),
        ),
      ),
      
      // Input Decoration
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: cardBackground,
        hintStyle: GoogleFonts.inter(
          color: textSecondary,
          fontSize: 16,
        ),
        labelStyle: GoogleFonts.inter(
          color: textSecondary,
          fontSize: 16,
        ),
        floatingLabelStyle: GoogleFonts.inter(
          color: primaryGreen,
          fontSize: 16,
          fontWeight: FontWeight.w500,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: surfaceColor),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: surfaceColor),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: primaryGreen, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: errorColor),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: errorColor, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      ),
      
      // Text Theme
      textTheme: TextTheme(
        displayLarge: GoogleFonts.inter(
          fontSize: 32,
          fontWeight: FontWeight.w700,
          color: Colors.white,
          letterSpacing: -0.25,
        ),
        displayMedium: GoogleFonts.inter(
          fontSize: 28,
          fontWeight: FontWeight.w600,
          color: Colors.white,
          letterSpacing: 0,
        ),
        displaySmall: GoogleFonts.inter(
          fontSize: 24,
          fontWeight: FontWeight.w600,
          color: Colors.white,
          letterSpacing: 0,
        ),
        headlineLarge: GoogleFonts.inter(
          fontSize: 22,
          fontWeight: FontWeight.w600,
          color: Colors.white,
          letterSpacing: 0,
        ),
        headlineMedium: GoogleFonts.inter(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: Colors.white,
          letterSpacing: 0.15,
        ),
        headlineSmall: GoogleFonts.inter(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: Colors.white,
          letterSpacing: 0.15,
        ),
        titleLarge: GoogleFonts.inter(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: Colors.white,
          letterSpacing: 0.15,
        ),
        titleMedium: GoogleFonts.inter(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          color: Colors.white,
          letterSpacing: 0.15,
        ),
        titleSmall: GoogleFonts.inter(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: Colors.white,
          letterSpacing: 0.1,
        ),
        bodyLarge: GoogleFonts.inter(
          fontSize: 16,
          fontWeight: FontWeight.w400,
          color: Colors.white,
          letterSpacing: 0.15,
        ),
        bodyMedium: GoogleFonts.inter(
          fontSize: 14,
          fontWeight: FontWeight.w400,
          color: Colors.white,
          letterSpacing: 0.25,
        ),
        bodySmall: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: FontWeight.w400,
          color: textSecondary,
          letterSpacing: 0.4,
        ),
        labelLarge: GoogleFonts.inter(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: Colors.white,
          letterSpacing: 0.1,
        ),
        labelMedium: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: Colors.white,
          letterSpacing: 0.5,
        ),
        labelSmall: GoogleFonts.inter(
          fontSize: 10,
          fontWeight: FontWeight.w500,
          color: textSecondary,
          letterSpacing: 0.5,
        ),
      ),
      
      // Bottom Navigation Bar
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: cardBackground,
        elevation: 8,
        selectedItemColor: primaryGreen,
        unselectedItemColor: textSecondary,
        selectedLabelStyle: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.5,
        ),
        unselectedLabelStyle: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          letterSpacing: 0.5,
        ),
        type: BottomNavigationBarType.fixed,
        showSelectedLabels: true,
        showUnselectedLabels: true,
      ),
      
      // Divider
      dividerTheme: const DividerThemeData(
        color: dividerColor,
        thickness: 1,
      ),
      
      // Floating Action Button
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: primaryGreen,
        foregroundColor: Colors.white,
        elevation: 4,
        highlightElevation: 8,
      ),
      
      // Switch
      switchTheme: SwitchThemeData(
        thumbColor: MaterialStateProperty.resolveWith((states) {
          if (states.contains(MaterialState.selected)) {
            return primaryGreen;
          }
          return Colors.grey;
        }),
        trackColor: MaterialStateProperty.resolveWith((states) {
          if (states.contains(MaterialState.selected)) {
            return primaryGreen.withOpacity(0.5);
          }
          return Colors.grey.withOpacity(0.3);
        }),
      ),
      
      // Slider
      sliderTheme: SliderThemeData(
        activeTrackColor: primaryGreen,
        inactiveTrackColor: surfaceColor,
        thumbColor: primaryGreen,
        overlayColor: primaryGreen.withOpacity(0.2),
        valueIndicatorColor: primaryGreen,
        valueIndicatorTextStyle: GoogleFonts.inter(
          color: Colors.white,
          fontSize: 12,
          fontWeight: FontWeight.w500,
        ),
      ),
      
      // Checkbox
      checkboxTheme: CheckboxThemeData(
        fillColor: MaterialStateProperty.resolveWith((states) {
          if (states.contains(MaterialState.selected)) {
            return primaryGreen;
          }
          return Colors.transparent;
        }),
        checkColor: MaterialStateProperty.all(Colors.white),
        side: const BorderSide(color: primaryGreen),
      ),
      
      // Radio
      radioTheme: RadioThemeData(
        fillColor: MaterialStateProperty.resolveWith((states) {
          if (states.contains(MaterialState.selected)) {
            return primaryGreen;
          }
          return textSecondary;
        }),
      ),
      
      // Progress Indicator
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: primaryGreen,
        linearTrackColor: surfaceColor,
        circularTrackColor: surfaceColor,
      ),
      
      // Snackbar
      snackBarTheme: SnackBarThemeData(
        backgroundColor: cardBackground,
        contentTextStyle: GoogleFonts.inter(
          color: Colors.white,
          fontSize: 14,
          fontWeight: FontWeight.w500,
        ),
        actionTextColor: primaryGreen,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        behavior: SnackBarBehavior.floating,
        elevation: 4,
      ),
      
      // Dialog
      dialogTheme: DialogTheme(
        backgroundColor: cardBackground,
        elevation: 8,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        titleTextStyle: GoogleFonts.inter(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: Colors.white,
        ),
        contentTextStyle: GoogleFonts.inter(
          fontSize: 16,
          fontWeight: FontWeight.w400,
          color: Colors.white,
        ),
      ),
      
      // List Tile
      listTileTheme: ListTileThemeData(
        tileColor: Colors.transparent,
        selectedTileColor: primaryGreen.withOpacity(0.1),
        iconColor: primaryGreen,
        textColor: Colors.white,
        selectedColor: primaryGreen,
        titleTextStyle: GoogleFonts.inter(
          fontSize: 16,
          fontWeight: FontWeight.w500,
          color: Colors.white,
        ),
        subtitleTextStyle: GoogleFonts.inter(
          fontSize: 14,
          fontWeight: FontWeight.w400,
          color: textSecondary,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      ),
    );
  }
  
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      fontFamily: GoogleFonts.inter().fontFamily,
      
      colorScheme: const ColorScheme.light(
        primary: primaryGreen,
        secondary: Color(0xFFE8F5E8),
        surface: Colors.white,
        background: Color(0xFFF5F5F5),
        onBackground: Color(0xFF1A1A1A),
        onSurface: Color(0xFF1A1A1A),
        onPrimary: Colors.white,
        error: errorColor,
        onError: Colors.white,
        outline: Color(0xFFE0E0E0),
        outlineVariant: Color(0xFFF0F0F0),
      ),
      
      scaffoldBackgroundColor: const Color(0xFFF5F5F5),
      
      // Override other theme properties for light theme as needed
      // This is a basic light theme setup - you can expand it further
    );
  }
}