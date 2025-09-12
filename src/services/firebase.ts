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
  apiKey: "AIzaSyAW4vyYLQjBGEJDwemF2gz26yLWkj5n2j8",
  authDomain: "inthemiddleofallthings.firebaseapp.com",
  projectId: "inthemiddleofallthings",
  storageBucket: "inthemiddleofallthings.firebasestorage.app",
  messagingSenderId: "422207850692",
  appId: "1:422207850692:web:0aa277232f98b4429da191",
  measurementId: "G-MMXLYHMTEZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Helper function to check if Firebase is available
export const isFirebaseAvailable = () => true;

export { app, analytics, auth, db };
export default { app, analytics, auth, db, isFirebaseAvailable };