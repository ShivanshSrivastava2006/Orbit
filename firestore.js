import { db } from './config'; // Firestore instance
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  getDoc,
  arrayUnion,
  deleteDoc,
} from 'firebase/firestore';

/**
 * Ensure user is in Firestore users collection (called after login)
 */
export async function ensureUserExists(user) {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      name: user.name || '',
      phone: user.phoneNumber || '',
      createdAt: new Date(),
    });
  }
}

/**
 * Send a connection request from one user to another
 */
export async function sendConnectionRequest(fromUid, toUid) {
  const ref = doc(db, 'connectionRequests', `${fromUid}_${toUid}`);
  await setDoc(ref, {
    from: fromUid,
    to: toUid,
    status: 'pending',
    createdAt: new Date(),
  });
}

/**
 * Accept a connection request
 */
export async function acceptConnectionRequest(fromUid, toUid) {
  // 1. Create connection document
  const connectionId = [fromUid, toUid].sort().join('_');
  const ref = doc(db, 'connections', connectionId);
  await setDoc(ref, {
    users: [fromUid, toUid],
    createdAt: new Date(),
  });

  // 2. Mark the request as accepted (or delete if you prefer)
  const requestRef = doc(db, 'connectionRequests', `${fromUid}_${toUid}`);
  await setDoc(requestRef, { status: 'accepted' }, { merge: true });
}

/**
 * Get 1st-degree connections for a user
 */
export async function getFirstDegreeConnections(uid) {
  const q = query(collection(db, 'connections'), where('users', 'array-contains', uid));
  const snap = await getDocs(q);
  console.log("🔍 Connections fetched for:", uid, snap.docs.map(d => d.data()));

  return snap.docs.map(doc => {
    const users = doc.data().users;
    return users.find(user => user !== uid);
  });
}


/**
 * Get 2nd-degree connections for a user
 */
export async function getSecondDegreeConnections(uid) {
  const firstDegree = await getFirstDegreeConnections(uid);
  const secondDegreeSet = new Set();

  for (let friendUid of firstDegree) {
    const friendsOfFriend = await getFirstDegreeConnections(friendUid);
    for (let secondUid of friendsOfFriend) {
      if (secondUid !== uid && !firstDegree.includes(secondUid)) {
        secondDegreeSet.add(secondUid);
      }
    }
  }

  console.log("🔁 2nd-degree UIDs:", [...secondDegreeSet]);

  return Array.from(secondDegreeSet);
}
/**
 * Build full connection graph for a user
 * Includes 1st and 2nd-degree connections
 */
export async function buildConnectionGraph(uid) {
  const connectionsRef = collection(db, 'connections');

  // Step 1: Get all connections where uid is included
  const firstDegreeUIDs = new Set();
  const firstSnap = await getDocs(query(connectionsRef, where('users', 'array-contains', uid)));

  firstSnap.forEach(doc => {
    const users = doc.data().users;
    users.forEach(userId => {
      if (userId !== uid) firstDegreeUIDs.add(userId);
    });
  });

  // Step 2: Get all connections of 1st-degree users (for 2nd-degree)
  const secondDegreeUIDs = new Set();

  await Promise.all([...firstDegreeUIDs].map(async (friendUid) => {
    const friendSnap = await getDocs(query(connectionsRef, where('users', 'array-contains', friendUid)));
    friendSnap.forEach(doc => {
      const users = doc.data().users;
      users.forEach(u => {
        if (u !== uid && !firstDegreeUIDs.has(u)) {
          secondDegreeUIDs.add(u);
        }
      });
    });
  }));

  // Step 3: Build unique list of users for nodes
  const allUIDs = new Set([uid, ...firstDegreeUIDs, ...secondDegreeUIDs]);

  const nodes = await Promise.all([...allUIDs].map(async userId => {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data() || {};
    return {
      id: userId,
      name: userData.name || 'Unknown',
    };
  }));

  // Step 4: Build edges from all connections
  const allConnsSnap = await getDocs(connectionsRef);
  const edges = [];

  allConnsSnap.forEach(doc => {
    const users = doc.data().users;
    if (users.length === 2 && allUIDs.has(users[0]) && allUIDs.has(users[1])) {
      edges.push({ source: users[0], target: users[1] });
    }
  });

  return { nodes, edges };
}
