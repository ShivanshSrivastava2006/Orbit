import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
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
      createdAt: serverTimestamp(),
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
    createdAt: serverTimestamp(),
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
    createdAt: serverTimestamp(),
  });

  const requestRef = doc(db, 'connectionRequests', `${fromUid}_${toUid}`);
  await updateDoc(requestRef, { status: 'accepted' });
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

/**
 * Check if user is 1st or 2nd degree connection
 */
export async function getConnectionDegree(fromUid, toUid) {
  const firstDegree = await getFirstDegreeConnections(fromUid);
  if (firstDegree.includes(toUid)) {
    return 1;
  }
  
  const secondDegree = await getSecondDegreeConnections(fromUid);
  if (secondDegree.includes(toUid)) {
    return 2;
  }
  
  return 0; // No connection
}

/**
 * Find mutual friends between two users
 */
export async function getMutualFriends(fromUid, toUid) {
  const fromFriends = await getFirstDegreeConnections(fromUid);
  const toFriends = await getFirstDegreeConnections(toUid);
  
  return fromFriends.filter(friend => toFriends.includes(friend));
}

export async function buildConnectionGraph(uid) {
  try {
    const connectionsRef = collection(db, 'connections');
    const requestsRef = collection(db, 'connectionRequests');
    const hangoutRequestsRef = collection(db, 'hangoutRequests');
    const approvalRequestsRef = collection(db, 'secondDegreeApprovals');
          
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

    // Get sent connection requests
    const sentRequestsSnap = await getDocs(query(requestsRef, where('from', '==', uid)));
    const sentRequestUIDs = new Set(sentRequestsSnap.docs.map(doc => doc.data().to));

    // Get hangout requests status
    const hangoutRequestsSnap = await getDocs(query(hangoutRequestsRef, where('from', '==', uid)));
    const hangoutRequestsMap = new Map();
    hangoutRequestsSnap.forEach(doc => {
      const data = doc.data();
      hangoutRequestsMap.set(data.to, data.status);
    });

    // Get approval requests status
    const approvalRequestsSnap = await getDocs(query(approvalRequestsRef, where('from', '==', uid)));
    const approvalRequestsMap = new Map();
    approvalRequestsSnap.forEach(doc => {
      const data = doc.data();
      approvalRequestsMap.set(data.to, data.status);
    });

    const nodes = await Promise.all([...allUIDs].map(async userId => {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.exists() ? userDoc.data() : {};
      
      let requestStatus = 'none';
      if (firstDegreeUIDs.has(userId)) {
        requestStatus = 'connected';
      } else if (hangoutRequestsMap.has(userId)) {
        requestStatus = hangoutRequestsMap.get(userId);
      } else if (approvalRequestsMap.has(userId)) {
        const approvalStatus = approvalRequestsMap.get(userId);
        requestStatus = approvalStatus === 'pending' ? 'pendingApproval' : approvalStatus;
      }
      
      return {
        id: userId,
        name: userData.name || 'Unknown',
        bio: userData.bio || '',
        requestSent: sentRequestUIDs.has(userId),
        requestStatus: requestStatus,
        degree: firstDegreeUIDs.has(userId) ? 1 : (secondDegreeUIDs.has(userId) ? 2 : 0)
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

/**
 * Enhanced hangout request function with proper 1st/2nd degree logic
 */
export async function sendHangoutRequest(fromUid, toUid, hangoutData) {
  if (!fromUid || !toUid || fromUid === toUid) {
    throw new Error("Invalid UIDs provided");
  }

  const connectionDegree = await getConnectionDegree(fromUid, toUid);
  
  if (connectionDegree === 0) {
    throw new Error("No connection exists between users");
  }

  const hangoutRequestData = {
    from: fromUid,
    to: toUid,
    idea: hangoutData.idea || '',
    eventType: hangoutData.eventType || '',
    time: hangoutData.time || '',
    place: hangoutData.place || '',
    status: 'pending',
    degree: connectionDegree,
    createdAt: serverTimestamp(),
  };

  // For 1st degree connections, send request directly
  if (connectionDegree === 1) {
    const ref = doc(db, 'hangoutRequests', `${fromUid}_${toUid}`);
    await setDoc(ref, hangoutRequestData);
    return { success: true, message: 'Hangout request sent directly!' };
  }

  // For 2nd degree connections, need approval first
  if (connectionDegree === 2) {
    const mutualFriends = await getMutualFriends(fromUid, toUid);
    
    if (mutualFriends.length === 0) {
      throw new Error("No mutual friends found for approval");
    }

    // Use the first mutual friend for approval (you can modify this logic)
    const mutualFriend = mutualFriends[0];
    
    const approvalRef = doc(db, 'secondDegreeApprovals', `${fromUid}_${toUid}`);
    await setDoc(approvalRef, {
      from: fromUid,
      to: toUid,
      mutual: mutualFriend,
      hangoutData: hangoutRequestData,
      status: 'pending',
      createdAt: serverTimestamp(),
    });

    return { 
      success: true, 
      message: 'Approval request sent to mutual friend!',
      requiresApproval: true,
      mutualFriend: mutualFriend
    };
  }

  throw new Error("Invalid connection degree");
}

export async function acceptHangoutRequest(fromUid, toUid) {
  const ref = doc(db, 'hangoutRequests', `${fromUid}_${toUid}`);
  await updateDoc(ref, { status: 'accepted' });
}

export async function declineHangoutRequest(fromUid, toUid) {
  const ref = doc(db, 'hangoutRequests', `${fromUid}_${toUid}`);
  await updateDoc(ref, { status: 'declined' });
}

export async function cancelHangoutRequest(fromUid, toUid) {
  const ref = doc(db, 'hangoutRequests', `${fromUid}_${toUid}`);
  await deleteDoc(ref);
}

export async function requestSecondDegreeApproval(fromUid, toUid, mutualUid, hangoutData) {
  const ref = doc(db, 'secondDegreeApprovals', `${fromUid}_${toUid}`);
  await setDoc(ref, {
    from: fromUid,
    to: toUid,
    mutual: mutualUid,
    hangoutData: hangoutData,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
}

export async function approveSecondDegreeRequest(docId, status) {
  const approvalRef = doc(db, 'secondDegreeApprovals', docId);
  const approvalSnap = await getDoc(approvalRef);

  if (!approvalSnap.exists()) {
    throw new Error("Approval request not found.");
  }

  const { from, to, hangoutData } = approvalSnap.data();

  // Update approval status
  await updateDoc(approvalRef, { status });

  if (status === 'approved') {
    // Now send the actual hangout request
    const hangoutRef = doc(db, 'hangoutRequests', `${from}_${to}`);
    await setDoc(hangoutRef, {
      ...hangoutData,
      status: 'pending',
      approvedAt: serverTimestamp(),
    });
  }
}

/**
 * Get pending hangout requests for a user
 */
export async function getPendingHangoutRequests(uid) {
  const q = query(collection(db, 'hangoutRequests'), where('to', '==', uid), where('status', '==', 'pending'));
  const snap = await getDocs(q);
  
  return Promise.all(snap.docs.map(async (doc) => {
    const data = doc.data();
    const fromUserDoc = await getDoc(doc(db, 'users', data.from));
    const fromUserData = fromUserDoc.exists() ? fromUserDoc.data() : {};
    
    return {
      id: doc.id,
      ...data,
      fromUser: {
        id: data.from,
        name: fromUserData.name || 'Unknown',
        bio: fromUserData.bio || ''
      }
    };
  }));
}

/**
 * Get pending approval requests for a user (where they need to approve 2nd degree connections)
 */
export async function getPendingApprovalRequests(uid) {
  const q = query(collection(db, 'secondDegreeApprovals'), where('mutual', '==', uid), where('status', '==', 'pending'));
  const snap = await getDocs(q);
  
  return Promise.all(snap.docs.map(async (doc) => {
    const data = doc.data();
    const fromUserDoc = await getDoc(doc(db, 'users', data.from));
    const toUserDoc = await getDoc(doc(db, 'users', data.to));
    
    const fromUserData = fromUserDoc.exists() ? fromUserDoc.data() : {};
    const toUserData = toUserDoc.exists() ? toUserDoc.data() : {};
    
    return {
      id: doc.id,
      ...data,
      fromUser: {
        id: data.from,
        name: fromUserData.name || 'Unknown',
        bio: fromUserData.bio || ''
      },
      toUser: {
        id: data.to,
        name: toUserData.name || 'Unknown',
        bio: toUserData.bio || ''
      }
    };
  }));
}