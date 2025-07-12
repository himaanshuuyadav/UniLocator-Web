import 'package:cloud_firestore/cloud_firestore.dart';

enum DeviceType {
  phone,
  tablet,
  laptop,
  watch,
  earbuds,
  other;

  String get displayName {
    switch (this) {
      case DeviceType.phone:
        return 'Phone';
      case DeviceType.tablet:
        return 'Tablet';
      case DeviceType.laptop:
        return 'Laptop';
      case DeviceType.watch:
        return 'Watch';
      case DeviceType.earbuds:
        return 'Earbuds';
      case DeviceType.other:
        return 'Other';
    }
  }

  String get iconName {
    switch (this) {
      case DeviceType.phone:
        return 'phone_android';
      case DeviceType.tablet:
        return 'tablet';
      case DeviceType.laptop:
        return 'laptop';
      case DeviceType.watch:
        return 'watch';
      case DeviceType.earbuds:
        return 'headphones';
      case DeviceType.other:
        return 'device_unknown';
    }
  }
}

class Device {
  final String id;
  final String name;
  final String userId;
  final DeviceType type;
  final bool isOnline;
  final double? latitude;
  final double? longitude;
  final String? address;
  final DateTime? lastSeen;
  final int? batteryLevel;
  final String? networkType;
  final String? deviceInfo;
  final DateTime createdAt;
  final DateTime updatedAt;

  Device({
    required this.id,
    required this.name,
    required this.userId,
    required this.type,
    this.isOnline = false,
    this.latitude,
    this.longitude,
    this.address,
    this.lastSeen,
    this.batteryLevel,
    this.networkType,
    this.deviceInfo,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Device.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return Device(
      id: doc.id,
      name: data['name'] ?? 'Unknown Device',
      userId: data['userId'] ?? '',
      type: DeviceType.values.firstWhere(
        (e) => e.name == data['type'],
        orElse: () => DeviceType.other,
      ),
      isOnline: data['isOnline'] ?? false,
      latitude: data['latitude']?.toDouble(),
      longitude: data['longitude']?.toDouble(),
      address: data['address'],
      lastSeen: data['lastSeen'] != null
          ? (data['lastSeen'] as Timestamp).toDate()
          : null,
      batteryLevel: data['batteryLevel'],
      networkType: data['networkType'],
      deviceInfo: data['deviceInfo'],
      createdAt: (data['createdAt'] as Timestamp).toDate(),
      updatedAt: (data['updatedAt'] as Timestamp).toDate(),
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'name': name,
      'userId': userId,
      'type': type.name,
      'isOnline': isOnline,
      'latitude': latitude,
      'longitude': longitude,
      'address': address,
      'lastSeen': lastSeen != null ? Timestamp.fromDate(lastSeen!) : null,
      'batteryLevel': batteryLevel,
      'networkType': networkType,
      'deviceInfo': deviceInfo,
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': Timestamp.fromDate(updatedAt),
    };
  }

  Device copyWith({
    String? name,
    DeviceType? type,
    bool? isOnline,
    double? latitude,
    double? longitude,
    String? address,
    DateTime? lastSeen,
    int? batteryLevel,
    String? networkType,
    String? deviceInfo,
  }) {
    return Device(
      id: id,
      name: name ?? this.name,
      userId: userId,
      type: type ?? this.type,
      isOnline: isOnline ?? this.isOnline,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      address: address ?? this.address,
      lastSeen: lastSeen ?? this.lastSeen,
      batteryLevel: batteryLevel ?? this.batteryLevel,
      networkType: networkType ?? this.networkType,
      deviceInfo: deviceInfo ?? this.deviceInfo,
      createdAt: createdAt,
      updatedAt: DateTime.now(),
    );
  }

  // Helper methods
  String get statusText {
    if (isOnline) {
      return 'Online';
    } else if (lastSeen != null) {
      final difference = DateTime.now().difference(lastSeen!);
      if (difference.inMinutes < 1) {
        return 'Just now';
      } else if (difference.inMinutes < 60) {
        return '${difference.inMinutes}m ago';
      } else if (difference.inHours < 24) {
        return '${difference.inHours}h ago';
      } else {
        return '${difference.inDays}d ago';
      }
    }
    return 'Never seen';
  }

  String get batteryText {
    if (batteryLevel == null) return 'Unknown';
    return '$batteryLevel%';
  }

  String get locationText {
    if (address != null && address!.isNotEmpty) {
      return address!;
    } else if (latitude != null && longitude != null) {
      return '${latitude!.toStringAsFixed(4)}, ${longitude!.toStringAsFixed(4)}';
    }
    return 'No location';
  }

  bool get hasLocation => latitude != null && longitude != null;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Device && runtimeType == other.runtimeType && id == other.id;

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() {
    return 'Device{id: $id, name: $name, type: $type, isOnline: $isOnline}';
  }
}