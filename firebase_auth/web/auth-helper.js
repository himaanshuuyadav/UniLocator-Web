// Firebase Authentication Helper for HTML pages
// Use this after including firebase-init-cdn.html

class FirebaseAuthHelper {
  constructor() {
    this.currentUser = null;
    this.init();
  }

  init() {
    if (window.firebase && window.firebase.auth) {
      window.firebase.onAuthStateChanged(window.firebase.auth, (user) => {
        this.currentUser = user;
        this.onAuthStateChange(user);
      });
    } else {
      console.error('Firebase not initialized. Include firebase-init-cdn.html first.');
    }
  }

  onAuthStateChange(user) {
    // Override this method or listen to custom events
    const event = new CustomEvent('authStateChanged', { 
      detail: { user: user, isLoggedIn: !!user } 
    });
    document.dispatchEvent(event);
    
    console.log('Auth state changed:', user ? 'Logged in' : 'Logged out');
  }

  async login(email, password) {
    try {
      const userCredential = await window.firebase.signInWithEmailAndPassword(
        window.firebase.auth, 
        email, 
        password
      );
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async register(email, password, username = null) {
    try {
      const userCredential = await window.firebase.createUserWithEmailAndPassword(
        window.firebase.auth, 
        email, 
        password
      );
      const user = userCredential.user;
      
      // Save additional user info to Firestore if username provided
      if (username) {
        await window.firebase.setDoc(
          window.firebase.doc(window.firebase.db, 'users', user.uid), 
          {
            username: username,
            email: email,
            createdAt: new Date()
          }
        );
      }
      
      return { success: true, user: user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async logout() {
    try {
      await window.firebase.signOut(window.firebase.auth);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getUserProfile(uid) {
    try {
      const docRef = window.firebase.doc(window.firebase.db, 'users', uid);
      const docSnap = await window.firebase.getDoc(docRef);
      
      if (docSnap.exists()) {
        return { success: true, data: docSnap.data() };
      } else {
        return { success: false, error: 'User profile not found' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  isLoggedIn() {
    return this.currentUser !== null;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  // Utility method to show user info
  displayUserInfo(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (this.isLoggedIn()) {
      container.innerHTML = `
        <p>Welcome, ${this.currentUser.email}</p>
        <button onclick="authHelper.logout()">Logout</button>
      `;
    } else {
      container.innerHTML = `
        <p>Please log in</p>
        <a href="/login">Login</a>
      `;
    }
  }
}

// Initialize the helper
const authHelper = new FirebaseAuthHelper();

// Listen for auth state changes
document.addEventListener('authStateChanged', (event) => {
  const { user, isLoggedIn } = event.detail;
  
  // Update UI based on auth state
  const authElements = document.querySelectorAll('[data-auth-show]');
  authElements.forEach(element => {
    const showWhen = element.getAttribute('data-auth-show');
    if (showWhen === 'logged-in' && isLoggedIn) {
      element.style.display = 'block';
    } else if (showWhen === 'logged-out' && !isLoggedIn) {
      element.style.display = 'block';
    } else {
      element.style.display = 'none';
    }
  });
});
