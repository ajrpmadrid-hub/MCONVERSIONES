import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAQd-rMpgxQzK-xEmH1rK9vgzPZRtKK-XE",
  authDomain: "mconversiones-93898.firebaseapp.com",
  projectId: "mconversiones-93898",
  storageBucket: "mconversiones-93898.firebasestorage.app",
  messagingSenderId: "690985376258",
  appId: "1:690985376258:web:aeccc2eba945d4f725651b",
  measurementId: "G-Q4S7ERC3NB"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
