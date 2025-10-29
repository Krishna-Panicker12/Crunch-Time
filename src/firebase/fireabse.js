// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBHCoFhhQVlHViCKxezazTjL0HOwb16M20",
  authDomain: "drive-decision-simulator.firebaseapp.com",
  projectId: "drive-decision-simulator",
  storageBucket: "drive-decision-simulator.firebasestorage.app",
  messagingSenderId: "381246296123",
  appId: "1:381246296123:web:24929f7822c679c007cc1e",
  measurementId: "G-33YT02Z3MY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app)
export const db = getFirestore(app)