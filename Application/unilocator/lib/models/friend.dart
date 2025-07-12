import 'package:cloud_firestore/cloud_firestore.dart';

class Friend {
  final String id;
  final String userId;
  final String friendId;
  final String name;
  final String email;
  final String? profileImageUrl;
  final bool isOnline;
  final double? latitude;
  final double? longitude;
  final String? address;
  final DateTime? lastSeen;
  final bool isLocationShared;
  final bool isFavorite;
  final FriendStatus status;
  final DateTime createdAt;
  final DateTime updatedAt;

  Friend({
    required this.id,
    required this.userId,
    required this.friendId,
    required this.name,
    required this.email,
    this.profileImageUrl,
    this.isOnline = false,
    this.latitude,
    this.longitude,
    this.address,
    this.lastSeen,
    this.isLocationShared = false,
    this.isFavorite = false,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Friend.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return Friend(
      id: doc.id,
      userId: data['userId'] ?? '',
      friendId: data['friendId'] ?? '',
      name: data['name'] ?? 'Unknown Friend',
      email: data['email'] ?? '',
      profileImageUrl: data['profileImageUrl'],
      isOnline: data['isOnline'] ?? false,
      latitude: data['latitude']?.toDouble(),
      longitude: data['longitude']?.toDouble(),
      address: data['address'],
      lastSeen: data['lastSeen'] != null
          ? (data['lastSeen'] as Timestamp).toDate()
          : null,
      isLocationShared: data['isLocationShared'] ?? false,
      isFavorite: data['isFavorite'] ?? false,
      status: FriendStatus.values.firstWhere(
        (e) => e.name == data['status'],
        orElse: () => FriendStatus.pending,
      ),
      createdAt: (data['createdAt'] as Timestamp).toDate(),
      updatedAt: (data['updatedAt'] as Timestamp).toDate(),
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'userId': userId,
      'friendId': friendId,
      'name': name,
      'email': email,
      'profileImageUrl': profileImageUrl,
      'isOnline': isOnline,
      'latitude': latitude,
      'longitude': longitude,
      'address': address,
      'lastSeen': lastSeen != null ? Timestamp.fromDate(lastSeen!) : null,
      'isLocationShared': isLocationShared,
      'isFavorite': isFavorite,
      'status': status.name,
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': Timestamp.fromDate(updatedAt),
    };
  }

  Friend copyWith({
    String? name,
    String? email,
    String? profileImageUrl,
    bool? isOnline,
    double? latitude,
    double? longitude,
    String? address,
    DateTime? lastSeen,
    bool? isLocationShared,
    bool? isFavorite,
    FriendStatus? status,
  }) {
    return Friend(
      id: id,
      userId: userId,
      friendId: friendId,
      name: name ?? this.name,
      email: email ?? this.email,
      profileImageUrl: profileImageUrl ?? this.profileImageUrl,
      isOnline: isOnline ?? this.isOnline,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      address: address ?? this.address,
      lastSeen: lastSeen ?? this.lastSeen,
      isLocationShared: isLocationShared ?? this.isLocationShared,
      isFavorite: isFavorite ?? this.isFavorite,
      status: status ?? this.status,
      createdAt: createdAt,
      updatedAt: DateTime.now(),
    );
  }
}

enum FriendStatus {
  pending,
  accepted,
  blocked;

  String get displayName {
    switch (this) {
      case FriendStatus.pending:
        return 'Pending';
      case FriendStatus.accepted:
        return 'Accepted';
      case FriendStatus.blocked:
        return 'Blocked';
    }
  }
}