// firebase.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBisWGhqtwK5Ibv6Ef45Ly_kcDomk3c0I8",
  authDomain: "orbit-7f1f7.firebaseapp.com",
  projectId: "orbit-7f1f7",
  storageBucket: "orbit-7f1f7.firebasestorage.app",
  messagingSenderId: "685158810263",
  appId: "1:685158810263:web:3de9e0003e52d428d35fd2"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
