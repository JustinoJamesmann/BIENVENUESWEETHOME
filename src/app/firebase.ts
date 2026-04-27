import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAYHI21fqcOoiMQr947R6wRC3Dr6GXNJ7s",
  authDomain: "bienvenue-sweet-home-98a55.firebaseapp.com",
  projectId: "bienvenue-sweet-home-98a55",
  storageBucket: "bienvenue-sweet-home-98a55.firebasestorage.app",
  messagingSenderId: "766265384360",
  appId: "1:766265384360:web:30d78e37aa9c06ba76519d"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
