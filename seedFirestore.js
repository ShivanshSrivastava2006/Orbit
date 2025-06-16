// seedFirestore.js
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBisWGhqtwK5Ibv6Ef45Ly_kcDomk3c0I8",
  authDomain: "orbit-7f1f7.firebaseapp.com",
  projectId: "orbit-7f1f7",
  storageBucket: "orbit-7f1f7.firebasestorage.app",
  messagingSenderId: "685158810263",
  appId: "1:685158810263:web:3de9e0003e52d428d35fd2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Example seed data
const users = [
  { id: 'user1', name: 'Alice', bio: 'Loves pizza 🍕' },
  { id: 'user2', name: 'Bob', bio: 'Hiking enthusiast ⛰️' },
  { id: 'user3', name: 'Charlie', bio: 'Tech nerd 💻' },
];

const connectionRequests = [
  { from: 'user1', to: 'user2', status: 'pending' },
  { from: 'user2', to: 'user3', status: 'accepted' },
];

const connections = [
  { user1: 'user2', user2: 'user3' },
];

const hangoutRequests = [
  { from: 'user1', to: 'user3', status: 'pending' },
];

async function seed() {
  // Seed users
  for (const user of users) {
    await setDoc(doc(db, 'users', user.id), user);
  }

  // Seed connectionRequests
  for (const req of connectionRequests) {
    await setDoc(doc(collection(db, 'connectionRequests')), req);
  }

  // Seed connections
  for (const conn of connections) {
    await setDoc(doc(collection(db, 'connections')), conn);
  }

  // Seed hangoutRequests
  for (const hangout of hangoutRequests) {
    await setDoc(doc(collection(db, 'hangoutRequests')), hangout);
  }

  console.log('✅ Seed data added to Firestore');
}

seed().catch(console.error);
