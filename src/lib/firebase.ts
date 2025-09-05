// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDe_12dg95IHAFnOlAkzvLoUWq_DkuvpF4",
  authDomain: "anand-y.firebaseapp.com",
  projectId: "anand-y",
  storageBucket: "anand-y.firebasestorage.app",
  messagingSenderId: "130597177882",
  appId: "1:130597177882:web:090cec5f67e3ac1d2d9fa3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;