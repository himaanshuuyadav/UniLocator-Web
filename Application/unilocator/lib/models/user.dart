import 'package:cloud_firestore/cloud_firestore.dart';

class AppUser {
  final String id;
  final String username;
  final String email;
  final String? profileImageUrl;
  final bool isOnline;
  final double? latitude;
  final double? longitude;
  final String? address;
  final DateTime? lastSeen;
  final bool isLocationSharingEnabled;
  final bool isDarkThemeEnabled;
  final int locationUpdateInterval; // in seconds
  final bool notificationsEnabled;
  final DateTime createdAt;
  final DateTime updatedAt;

  AppUser({
    required this.id,
    required this.username,
    required this.email,
    this.profileImageUrl,
    this.isOnline = false,
    this.latitude,
    this.longitude,
    this.address,
    this.lastSeen,
    this.isLocationSharingEnabled = false,
    this.isDarkThemeEnabled = true,
    this.locationUpdateInterval = 30,
    this.notificationsEnabled = true,
    required this.createdAt,
    required this.updatedAt,
  });

  factory AppUser.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return AppUser(
      id: doc.id,
      username: data['username'] ?? 'Unknown User',
      email: data['email'] ?? '',
      profileImageUrl: data['profileImageUrl'],
      isOnline: data['isOnline'] ?? false,
      latitude: data['latitude']?.toDouble(),
      longitude: data['longitude']?.toDouble(),
      address: data['address'],
      lastSeen: data['lastSeen'] != null
          ? (data['lastSeen'] as Timestamp).toDate()
          : null,
      isLocationSharingEnabled: data['isLocationSharingEnabled'] ?? false,
      isDarkThemeEnabled: data['isDarkThemeEnabled'] ?? true,
      locationUpdateInterval: data['locationUpdateInterval'] ?? 30,
      notificationsEnabled: data['notificationsEnabled'] ?? true,
      createdAt: (data['createdAt'] as Timestamp).toDate(),
      updatedAt: (data['updatedAt'] as Timestamp).toDate(),
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'username': username,
      'email': email,
      'profileImageUrl': profileImageUrl,
      'isOnline': isOnline,
      'latitude': latitude,
      'longitude': longitude,
      'address': address,
      'lastSeen': lastSeen != null ? Timestamp.fromDate(lastSeen!) : null,
      'isLocationSharingEnabled': isLocationSharingEnabled,
      'isDarkThemeEnabled': isDarkThemeEnabled,
      'locationUpdateInterval': locationUpdateInterval,
      'notificationsEnabled': notificationsEnabled,
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': Timestamp.fromDate(updatedAt),
    };
  }

  AppUser copyWith({
    String? username,
    String? email,
    String? profileImageUrl,
    bool? isOnline,
    double? latitude,
    double? longitude,
    String? address,
    DateTime? lastSeen,
    bool? isLocationSharingEnabled,
    bool? isDarkThemeEnabled,
    int? locationUpdateInterval,
    bool? notificationsEnabled,
  }) {
    return AppUser(
      id: id,
      username: username ?? this.username,
      email: email ?? this.email,
      profileImageUrl: profileImageUrl ?? this.profileImageUrl,
      isOnline: isOnline ?? this.isOnline,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      address: address ?? this.address,
      lastSeen: lastSeen ?? this.lastSeen,
      isLocationSharingEnabled: isLocationSharingEnabled ?? this.isLocationSharingEnabled,
      isDarkThemeEnabled: isDarkThemeEnabled ?? this.isDarkThemeEnabled,
      locationUpdateInterval: locationUpdateInterval ?? this.locationUpdateInterval,
      notificationsEnabled: notificationsEnabled ?? this.notificationsEnabled,
      createdAt: createdAt,
      updatedAt: DateTime.now(),
    );
  }
}