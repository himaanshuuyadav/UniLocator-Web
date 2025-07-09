# UniLocator Flutter App

This is a Flutter Android app for UniLocator, designed to connect to a Flask backend for device tracking and management.

## Features
- User authentication (register/login with email and password)
- Device list and device details
- Provider for state management
- HTTP for API calls
- Shared preferences for token storage
- Material Design, modern UI

## Getting Started
1. Ensure you have Flutter and Dart installed.
2. Run `flutter pub get` to install dependencies.
3. Run `flutter run` to launch the app on an emulator or device.

## Backend
- The app expects a Flask backend with `/auth/register` and `/auth/login` endpoints.

## Customization
- Update the API base URL in your code to match your backend server address.

---
