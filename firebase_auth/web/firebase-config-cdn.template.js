// Firebase v9+ CDN config template for browser
// Copy this file to firebase-config-cdn.js and fill in your actual values
// DO NOT commit the actual firebase-config-cdn.js file

const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Make available globally
window.firebaseApp = app;
window.firebaseAuth = auth;
window.firebaseDb = db;
