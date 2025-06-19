import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where
} from 'firebase/firestore';
import { db } from './config'; // Firestore instance

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
export async function sendconnectionRequest(fromUid, toUid) {
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
  const connectionId = [fromUid, toUid].sort().join('_');
  const ref = doc(db, 'connections', connectionId);
  await setDoc(ref, {
    users: [fromUid, toUid],
    createdAt: new Date(),
  });

  const requestRef = doc(db, 'connectionRequests', `${fromUid}_${toUid}`);
  await setDoc(requestRef, { status: 'accepted' }, { merge: true });
}

/**
 * Get 1st-degree connections for a user
 */
export async function getFirstDegreeConnections(uid) {
  const q = query(collection(db, 'connections'), where('users', 'array-contains', uid));
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

export async function buildConnectionGraph(uid) {
  try {
    const connectionsRef = collection(db, 'connections');
    const requestsRef = collection(db, 'connectionRequests');

    const firstDegreeUIDs = new Set();
    const firstSnap = await getDocs(query(connectionsRef, where('users', 'array-contains', uid)));

    firstSnap.forEach(doc => {
      const users = doc.data()?.users || [];
      users.forEach(userId => {
        if (userId !== uid) firstDegreeUIDs.add(userId);
      });
    });

    const secondDegreeUIDs = new Set();

    await Promise.all([...firstDegreeUIDs].map(async (friendUid) => {
      const friendSnap = await getDocs(query(connectionsRef, where('users', 'array-contains', friendUid)));
      friendSnap.forEach(doc => {
        const users = doc.data()?.users || [];
        users.forEach(u => {
          if (u !== uid && !firstDegreeUIDs.has(u)) {
            secondDegreeUIDs.add(u);
          }
        });
      });
    }));

    const allUIDs = new Set([uid, ...firstDegreeUIDs, ...secondDegreeUIDs]);

    const sentRequestsSnap = await getDocs(query(requestsRef, where('from', '==', uid)));
    const sentRequestUIDs = new Set(sentRequestsSnap.docs.map(doc => doc.data().to));

    const nodes = await Promise.all([...allUIDs].map(async userId => {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.exists() ? userDoc.data() : {};
      return {
        id: userId,
        name: userData.name || 'Unknown',
        bio: userData.bio || '',
        requestSent: sentRequestUIDs.has(userId),
      };
    }));

    const allConnsSnap = await getDocs(connectionsRef);
    const edges = [];

    allConnsSnap.forEach(doc => {
      const users = doc.data()?.users || [];
      if (users.length === 2 && allUIDs.has(users[0]) && allUIDs.has(users[1])) {
        edges.push({ source: users[0], target: users[1] });
      }
    });

    return { nodes, edges };
  } catch (err) {
    console.error("🔥 buildConnectionGraph error:", err);
    return { nodes: [], edges: [] };
  }
}

export async function sendHangoutRequest(fromUid, toUid, idea) {
  if (!fromUid || !toUid || fromUid === toUid) {
    throw new Error("Invalid UIDs provided");
  }

  const ref = doc(db, 'hangoutRequests', `${fromUid}_${toUid}`);
  await setDoc(ref, {
    from: fromUid,
    to: toUid,
    idea: idea || '',
    status: 'pending',
    createdAt: new Date(),
  });
}

export async function acceptHangoutRequest(fromUid, toUid) {
  const ref = doc(db, 'hangoutRequests', `${fromUid}_${toUid}`);
  await setDoc(ref, { status: 'accepted' }, { merge: true });
}

export async function cancelHangoutRequest(fromUid, toUid) {
  const ref = doc(db, 'hangoutRequests', `${fromUid}_${toUid}`);
  await deleteDoc(ref);
}

export async function requestSecondDegreeApproval(fromUid, toUid, mutualUid) {
  const ref = doc(db, 'secondDegreeApprovals', `${fromUid}_${toUid}`);
  await setDoc(ref, {
    from: fromUid,
    to: toUid,
    mutual: mutualUid,
    status: 'pending',
    createdAt: new Date(),
  });
}

export async function approveSecondDegreeRequest(fromUid, toUid) {
  const approvalRef = doc(db, 'secondDegreeApprovals', `${fromUid}_${toUid}`);
  await setDoc(approvalRef, { status: 'approved' }, { merge: true });

  await sendHangoutRequest(fromUid, toUid);
}
