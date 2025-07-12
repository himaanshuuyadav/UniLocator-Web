import 'package:flutter/foundation.dart';
import '../models/friend.dart';
import '../services/firebase_service.dart';
import '../services/location_service.dart';

class FriendProvider extends ChangeNotifier {
  final FirebaseService _firebaseService = FirebaseService();
  final LocationService _locationService = LocationService();

  List<Friend> _friends = [];
  List<Friend> _pendingRequests = [];
  bool _isLoading = false;
  String? _error;
  Friend? _selectedFriend;

  // Getters
  List<Friend> get friends => _friends;
  List<Friend> get onlineFriends => _friends.where((f) => f.isOnline).toList();
  List<Friend> get offlineFriends => _friends.where((f) => !f.isOnline).toList();
  List<Friend> get favoriteFriends => _friends.where((f) => f.isFavorite).toList();
  List<Friend> get locationSharingFriends => _friends.where((f) => f.isLocationShared).toList();
  List<Friend> get pendingRequests => _pendingRequests;
  bool get isLoading => _isLoading;
  String? get error => _error;
  Friend? get selectedFriend => _selectedFriend;

  // Initialize and fetch friends
  Future<void> initialize() async {
    _setLoading(true);
    try {
      await Future.wait([
        _fetchFriends(),
        _fetchPendingRequests(),
      ]);
      _error = null;
    } catch (e) {
      _error = 'Failed to load friends: $e';
    } finally {
      _setLoading(false);
    }
  }

  // Listen to real-time friend updates
  void startListening() {
    _firebaseService.getUserFriendsStream().listen(
      (friends) {
        _friends = friends;
        _error = null;
        notifyListeners();
      },
      onError: (error) {
        _error = 'Error listening to friends: $error';
        notifyListeners();
      },
    );
  }

  // Fetch friends
  Future<void> _fetchFriends() async {
    _friends = await _firebaseService.getUserFriends();
  }

  // Fetch pending friend requests
  Future<void> _fetchPendingRequests() async {
    _pendingRequests = await _firebaseService.getPendingFriendRequests();
  }

  // Send friend request
  Future<bool> sendFriendRequest(String friendEmail) async {
    _setLoading(true);
    try {
      bool success = await _firebaseService.sendFriendRequest(friendEmail);
      if (success) {
        _error = null;
        notifyListeners();
        return true;
      } else {
        _error = 'Failed to send friend request. User not found or request already exists.';
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'Error sending friend request: $e';
      notifyListeners();
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Accept friend request
  Future<bool> acceptFriendRequest(String friendRequestId) async {
    _setLoading(true);
    try {
      bool success = await _firebaseService.acceptFriendRequest(friendRequestId);
      if (success) {
        // Remove from pending requests
        _pendingRequests.removeWhere((f) => f.id == friendRequestId);
        // Refresh friends list
        await _fetchFriends();
        _error = null;
        notifyListeners();
        return true;
      } else {
        _error = 'Failed to accept friend request';
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'Error accepting friend request: $e';
      notifyListeners();
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Reject friend request
  Future<bool> rejectFriendRequest(String friendRequestId) async {
    _setLoading(true);
    try {
      bool success = await _firebaseService.rejectFriendRequest(friendRequestId);
      if (success) {
        _pendingRequests.removeWhere((f) => f.id == friendRequestId);
        _error = null;
        notifyListeners();
        return true;
      } else {
        _error = 'Failed to reject friend request';
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'Error rejecting friend request: $e';
      notifyListeners();
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Remove friend
  Future<bool> removeFriend(String friendId) async {
    _setLoading(true);
    try {
      bool success = await _firebaseService.removeFriend(friendId);
      if (success) {
        _friends.removeWhere((f) => f.id == friendId);
        if (_selectedFriend?.id == friendId) {
          _selectedFriend = null;
        }
        _error = null;
        notifyListeners();
        return true;
      } else {
        _error = 'Failed to remove friend';
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'Error removing friend: $e';
      notifyListeners();
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Toggle friend favorite status
  Future<bool> toggleFriendFavorite(String friendId) async {
    try {
      Friend? friend = _friends.firstWhere((f) => f.id == friendId);
      bool newFavoriteStatus = !friend.isFavorite;
      
      bool success = await _firebaseService.toggleFriendFavorite(friendId, newFavoriteStatus);
      if (success) {
        int index = _friends.indexWhere((f) => f.id == friendId);
        if (index != -1) {
          _friends[index] = friend.copyWith(isFavorite: newFavoriteStatus);
          if (_selectedFriend?.id == friendId) {
            _selectedFriend = _friends[index];
          }
          _error = null;
          notifyListeners();
          return true;
        }
      }
      _error = 'Failed to update favorite status';
      notifyListeners();
      return false;
    } catch (e) {
      _error = 'Error toggling favorite status: $e';
      notifyListeners();
      return false;
    }
  }

  // Get friend by ID
  Friend? getFriendById(String id) {
    try {
      return _friends.firstWhere((f) => f.id == id);
    } catch (e) {
      return null;
    }
  }

  // Select friend for detailed view
  void selectFriend(String friendId) {
    _selectedFriend = getFriendById(friendId);
    notifyListeners();
  }

  // Clear selected friend
  void clearSelectedFriend() {
    _selectedFriend = null;
    notifyListeners();
  }

  // Get friends near a location
  List<Friend> getFriendsNearLocation(
    double latitude,
    double longitude,
    double radiusInMeters,
  ) {
    return _friends.where((friend) {
      if (friend.latitude == null || friend.longitude == null || !friend.isLocationShared) {
        return false;
      }
      double distance = _locationService.calculateDistance(
        latitude,
        longitude,
        friend.latitude!,
        friend.longitude!,
      );
      return distance <= radiusInMeters;
    }).toList();
  }

  // Get distance to friend
  double? getDistanceToFriend(String friendId) {
    if (_locationService.currentLocation == null) return null;
    
    Friend? friend = getFriendById(friendId);
    if (friend == null || friend.latitude == null || friend.longitude == null) {
      return null;
    }

    return _locationService.calculateDistance(
      _locationService.currentLocation!.latitude!,
      _locationService.currentLocation!.longitude!,
      friend.latitude!,
      friend.longitude!,
    );
  }

  // Get formatted distance to friend
  String? getFormattedDistanceToFriend(String friendId) {
    double? distance = getDistanceToFriend(friendId);
    if (distance == null) return null;
    return _locationService.formatDistance(distance);
  }

  // Get friends online status summary
  Map<String, int> getOnlineStatusSummary() {
    Map<String, int> summary = {
      'online': 0,
      'offline': 0,
      'total': _friends.length,
    };

    for (Friend friend in _friends) {
      if (friend.isOnline) {
        summary['online'] = summary['online']! + 1;
      } else {
        summary['offline'] = summary['offline']! + 1;
      }
    }

    return summary;
  }

  // Get location sharing summary
  Map<String, int> getLocationSharingSummary() {
    Map<String, int> summary = {
      'sharing': 0,
      'notSharing': 0,
      'total': _friends.length,
    };

    for (Friend friend in _friends) {
      if (friend.isLocationShared) {
        summary['sharing'] = summary['sharing']! + 1;
      } else {
        summary['notSharing'] = summary['notSharing']! + 1;
      }
    }

    return summary;
  }

  // Search friends by name or email
  List<Friend> searchFriends(String query) {
    if (query.isEmpty) return _friends;
    
    return _friends.where((friend) {
      return friend.name.toLowerCase().contains(query.toLowerCase()) ||
             friend.email.toLowerCase().contains(query.toLowerCase());
    }).toList();
  }

  // Sort friends by various criteria
  List<Friend> sortFriends(String sortBy) {
    List<Friend> sortedFriends = List.from(_friends);
    
    switch (sortBy) {
      case 'name':
        sortedFriends.sort((a, b) => a.name.compareTo(b.name));
        break;
      case 'lastSeen':
        sortedFriends.sort((a, b) {
          if (a.lastSeen == null) return 1;
          if (b.lastSeen == null) return -1;
          return b.lastSeen!.compareTo(a.lastSeen!);
        });
        break;
      case 'distance':
        if (_locationService.currentLocation != null) {
          sortedFriends.sort((a, b) {
            double? distanceA = getDistanceToFriend(a.id);
            double? distanceB = getDistanceToFriend(b.id);
            if (distanceA == null) return 1;
            if (distanceB == null) return -1;
            return distanceA.compareTo(distanceB);
          });
        }
        break;
      case 'favorite':
        sortedFriends.sort((a, b) {
          if (a.isFavorite && !b.isFavorite) return -1;
          if (!a.isFavorite && b.isFavorite) return 1;
          return 0;
        });
        break;
      case 'online':
        sortedFriends.sort((a, b) {
          if (a.isOnline && !b.isOnline) return -1;
          if (!a.isOnline && b.isOnline) return 1;
          return 0;
        });
        break;
    }
    
    return sortedFriends;
  }

  // Refresh friends and requests
  Future<void> refreshFriends() async {
    await initialize();
  }

  // Clear error
  void clearError() {
    _error = null;
    notifyListeners();
  }

  // Private helper methods
  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  // Format last seen time
  String formatLastSeen(DateTime? lastSeen) {
    if (lastSeen == null) return 'Never';

    final now = DateTime.now();
    final difference = now.difference(lastSeen);

    if (difference.inMinutes < 1) {
      return 'Just now';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes} min ago';
    } else if (difference.inHours < 24) {
      return '${difference.inHours} hr ago';
    } else {
      return '${difference.inDays} days ago';
    }
  }

  // Get friend status color
  String getFriendStatusColor(Friend friend) {
    if (friend.isOnline) {
      return '#4CAF50'; // Green
    } else if (friend.lastSeen != null) {
      final difference = DateTime.now().difference(friend.lastSeen!);
      if (difference.inHours < 24) {
        return '#FF9800'; // Orange
      }
    }
    return '#888888'; // Gray
  }

  @override
  void dispose() {
    super.dispose();
  }
}