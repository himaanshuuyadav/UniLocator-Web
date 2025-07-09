// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
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
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
