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
  const q = query(
    collection(db, 'connections'),
    where('users', 'array-contains', uid)
  );
  const snap = await getDocs(q);
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

  return Array.from(secondDegreeSet);
}
