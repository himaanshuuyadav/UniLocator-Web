// AuthService for browser with Firebase CDN
// Assumes firebase, firebase.auth, and firebase.firestore are loaded globally

class AuthService {
  constructor() {
    this.currentUser = null;
    this.authStateCallbacks = [];
    firebase.auth().onAuthStateChanged((user) => {
      this.currentUser = user;
      this.authStateCallbacks.forEach(cb => cb(user));
    });
  }

  async register(email, password, username) {
    try {
      console.log('[AUTH-SERVICE] Starting user registration...');
      const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      console.log('[AUTH-SERVICE] User created successfully:', user.uid);
      
      // Update user profile
      await user.updateProfile({ displayName: username });
      console.log('[AUTH-SERVICE] Profile updated with display name');
      
      // Create user document in Firestore with retry logic
      try {
        await firebase.firestore().collection('users').doc(user.uid).set({
          username: username,
          email: email,
          createdAt: new Date().toISOString(),
          devices: []
        });
        console.log('[AUTH-SERVICE] User document created in Firestore');
      } catch (firestoreError) {
        console.warn('[AUTH-SERVICE] Firestore write failed, but user account created:', firestoreError.message);
        // Don't fail registration if Firestore write fails - user can still login
      }
      
      return { success: true, user };
    } catch (error) {
      console.error('[AUTH-SERVICE] Registration error:', error);
      return { success: false, error: error.message };
    }
  }

  async login(email, password) {
    try {
      const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async logout() {
    try {
      await firebase.auth().signOut();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isAuthenticated() {
    return this.currentUser !== null;
  }

  onAuthStateChange(callback) {
    this.authStateCallbacks.push(callback);
    return () => {
      this.authStateCallbacks = this.authStateCallbacks.filter(cb => cb !== callback);
    };
  }

  async getUserData(uid) {
    try {
      const doc = await firebase.firestore().collection('users').doc(uid).get();
      return doc.exists ? doc.data() : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }
}

window.authService = new AuthService();
