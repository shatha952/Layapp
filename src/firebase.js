import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDIJrwWHNCQEkVZWibchTDDpifWBLi4kIQ",
  authDomain: "layapp-ee053.firebaseapp.com",
  projectId: "layapp-ee053",
  storageBucket: "layapp-ee053.firebasestorage.app",
  messagingSenderId: "30864494820",
  appId: "1:30864494820:web:cbd296e6b0f265205c1cf1",
  measurementId: "G-T77S195Q0S"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);