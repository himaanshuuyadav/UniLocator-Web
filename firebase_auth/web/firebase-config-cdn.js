// Firebase v9+ CDN config for browser
// Add this script after loading Firebase libraries from CDN in your HTML

const firebaseConfig = {
  apiKey: "AIzaSyCa59bNVSC7wCB6RnCZMNEjgfJm_UwPdFQ",
  authDomain: "unilocator-a542b.firebaseapp.com",
  projectId: "unilocator-a542b",
  storageBucket: "unilocator-a542b.appspot.com",
  messagingSenderId: "762228704297",
  appId: "1:762228704297:web:5cf1eeed5d4f1bf91b8838",
  measurementId: "G-W1KSY3T1G7"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
