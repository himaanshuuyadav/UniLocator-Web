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
      const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      await user.updateProfile({ displayName: username });
      await firebase.firestore().collection('users').doc(user.uid).set({
        username: username,
        email: email,
        createdAt: new Date().toISOString(),
        devices: []
      });
      return { success: true, user };
    } catch (error) {
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
