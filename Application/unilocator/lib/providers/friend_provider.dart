import 'package:flutter/material.dart';
import '../services/firebase_service.dart';
import '../models/friend.dart';

class FriendProvider extends ChangeNotifier {
  final FirebaseService _firebaseService = FirebaseService();

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
  int get friendCount => _friends.length;
  int get pendingRequestCount => _pendingRequests.length;

  // Initialize and start listening to real-time updates
  void initialize() {
    startListening();
    loadFriends();
    loadPendingRequests();
  }

  // Load friends from Firebase
  Future<void> loadFriends() async {
    _setLoading(true);
    try {
      _friends = await _firebaseService.getUserFriends();
      _error = null;
    } catch (e) {
      _error = 'Failed to load friends: $e';
    } finally {
      _setLoading(false);
    }
  }

  // Load pending friend requests
  Future<void> loadPendingRequests() async {
    try {
      _pendingRequests = await _firebaseService.getPendingFriendRequests();
      _error = null;
      notifyListeners();
    } catch (e) {
      _error = 'Failed to load pending requests: $e';
      notifyListeners();
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

  // Send friend request
  Future<bool> sendFriendRequest(String friendEmail) async {
    _setLoading(true);
    try {
      final success = await _firebaseService.sendFriendRequest(friendEmail);
      if (success) {
        _error = null;
        // Refresh pending requests
        await loadPendingRequests();
        return true;
      } else {
        _error = 'Failed to send friend request. User not found or request already exists.';
        return false;
      }
    } catch (e) {
      _error = 'Error sending friend request: $e';
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Accept friend request
  Future<bool> acceptFriendRequest(String friendRequestId) async {
    _setLoading(true);
    try {
      final success = await _firebaseService.acceptFriendRequest(friendRequestId);
      if (success) {
        // Remove from pending requests
        _pendingRequests.removeWhere((f) => f.id == friendRequestId);
        // Refresh friends list
        await loadFriends();
        _error = null;
        notifyListeners();
        return true;
      } else {
        _error = 'Failed to accept friend request';
        return false;
      }
    } catch (e) {
      _error = 'Error accepting friend request: $e';
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Reject friend request
  Future<bool> rejectFriendRequest(String friendRequestId) async {
    _setLoading(true);
    try {
      final success = await _firebaseService.rejectFriendRequest(friendRequestId);
      if (success) {
        _pendingRequests.removeWhere((f) => f.id == friendRequestId);
        _error = null;
        notifyListeners();
        return true;
      } else {
        _error = 'Failed to reject friend request';
        return false;
      }
    } catch (e) {
      _error = 'Error rejecting friend request: $e';
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Remove friend
  Future<bool> removeFriend(String friendId) async {
    _setLoading(true);
    try {
      final success = await _firebaseService.removeFriend(friendId);
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
        return false;
      }
    } catch (e) {
      _error = 'Error removing friend: $e';
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Toggle friend favorite status
  Future<bool> toggleFriendFavorite(String friendId) async {
    try {
      final friend = getFriendById(friendId);
      if (friend == null) return false;

      final newFavoriteStatus = !friend.isFavorite;
      
      final success = await _firebaseService.toggleFriendFavorite(friendId, newFavoriteStatus);
      if (success) {
        final index = _friends.indexWhere((f) => f.id == friendId);
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
      return false;
    } catch (e) {
      _error = 'Error toggling favorite status: $e';
      notifyListeners();
      return false;
    }
  }

  // Toggle location sharing with friend
  Future<bool> toggleLocationSharing(String friendId) async {
    try {
      final friend = getFriendById(friendId);
      if (friend == null) return false;

      final newSharingStatus = !friend.isLocationShared;
      
      final success = await _firebaseService.toggleLocationSharing(friendId, newSharingStatus);
      if (success) {
        final index = _friends.indexWhere((f) => f.id == friendId);
        if (index != -1) {
          _friends[index] = friend.copyWith(isLocationShared: newSharingStatus);
          if (_selectedFriend?.id == friendId) {
            _selectedFriend = _friends[index];
          }
          _error = null;
          notifyListeners();
          return true;
        }
      }
      _error = 'Failed to update location sharing';
      return false;
    } catch (e) {
      _error = 'Error toggling location sharing: $e';
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

  // Get friends with location
  List<Friend> getFriendsWithLocation() {
    return _friends.where((f) => f.hasLocation && f.isLocationShared).toList();
  }

  // Search friends
  List<Friend> searchFriends(String query) {
    if (query.isEmpty) return _friends;
    
    return _friends.where((friend) {
      return friend.name.toLowerCase().contains(query.toLowerCase()) ||
             friend.email.toLowerCase().contains(query.toLowerCase());
    }).toList();
  }

  // Get friends online status summary
  Map<String, int> getOnlineStatusSummary() {
    final Map<String, int> summary = {
      'online': 0,
      'offline': 0,
      'total': _friends.length,
    };

    for (final friend in _friends) {
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
    final Map<String, int> summary = {
      'sharing': 0,
      'notSharing': 0,
      'total': _friends.length,
    };

    for (final friend in _friends) {
      if (friend.isLocationShared) {
        summary['sharing'] = summary['sharing']! + 1;
      } else {
        summary['notSharing'] = summary['notSharing']! + 1;
      }
    }

    return summary;
  }

  // Sort friends by various criteria
  List<Friend> sortFriends(String sortBy) {
    final List<Friend> sortedFriends = List.from(_friends);
    
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

  // Get recently active friends
  List<Friend> getRecentlyActiveFriends({int hours = 24}) {
    final cutoffTime = DateTime.now().subtract(Duration(hours: hours));
    
    return _friends.where((friend) {
      return friend.isOnline || 
             (friend.lastSeen != null && friend.lastSeen!.isAfter(cutoffTime));
    }).toList();
  }

  // Refresh friends and requests
  Future<void> refreshFriends() async {
    await Future.wait([
      loadFriends(),
      loadPendingRequests(),
    ]);
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

  @override
  void dispose() {
    super.dispose();
  }
}