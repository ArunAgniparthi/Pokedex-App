import {initializeApp} from "firebase/app";
import { getAuth,GoogleAuthProvider} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDqjQ-rP6b0yCLEGjMbkdWXOAuZ7kF3SNU",
  authDomain: "pokedex-app-e1e5a.firebaseapp.com",
  projectId: "pokedex-app-e1e5a",
  storageBucket: "pokedex-app-e1e5a.firebasestorage.app",
  messagingSenderId: "458076742911",
  appId: "1:458076742911:web:34fd49fd201c2d203458ca",
  measurementId: "G-5QXSM4V14S"
};

const app=initializeApp(firebaseConfig);

export const auth=getAuth(app);
export const googleProvider= new GoogleAuthProvider();
export const db=getFirestore(app);