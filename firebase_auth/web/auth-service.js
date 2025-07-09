import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile,
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase-config.js';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.authStateCallbacks = [];
    
    // Listen for authentication state changes
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      this.authStateCallbacks.forEach(callback => callback(user));
    });
  }

  // Register new user
  async register(email, password, username) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update user profile with username
      await updateProfile(user, {
        displayName: username
      });
      
      // Store additional user data in Firestore
      await setDoc(doc(db, 'users', user.uid), {
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

  // Login user
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Logout user
  async logout() {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return this.currentUser !== null;
  }

  // Subscribe to auth state changes
  onAuthStateChange(callback) {
    this.authStateCallbacks.push(callback);
    return () => {
      this.authStateCallbacks = this.authStateCallbacks.filter(cb => cb !== callback);
    };
  }

  // Get user data from Firestore
  async getUserData(uid) {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error getting user data:", error);
      return null;
    }
  }
}

export default new AuthService();
