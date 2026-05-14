import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB6qhx65oOiiDr6TOZE7YvalsuvLljTd6c",
  authDomain: "gonkol-c06f3.firebaseapp.com",
  projectId: "gonkol-c06f3",
  storageBucket: "gonkol-c06f3.appspot.com",
  messagingSenderId: "587441880219",
  appId: "1:587441880219:web:3b46b0a0825ebceb855a3e",
  measurementId: "G-32VYBR8Z5J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore (db)
const db = getFirestore(app);

export { app, auth, db };
