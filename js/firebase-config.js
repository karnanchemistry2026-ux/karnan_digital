import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAds2i0TtoiFhnLEc5D6VW9ybRLin2mxRo",
  authDomain: "karnan-3c0bd.firebaseapp.com",
  projectId: "karnan-3c0bd",
  storageBucket: "karnan-3c0bd.firebasestorage.app",
  messagingSenderId: "727953520852",
  appId: "1:727953520852:web:68a43a343628904ffea341",
  measurementId: "G-G8D4MQ9HZ3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

// Initialize Firebase Auth
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, db, auth, googleProvider };
