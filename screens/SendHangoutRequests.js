import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config';
import { auth } from '../firebase';
import {
  getFirstDegreeConnections,
  getSecondDegreeConnections,
  sendHangoutRequest,
  requestSecondDegreeApproval
} from '../firestore';

export default function SendHangoutRequests() {
  const [users, setUsers] = useState([]);
  const currentUid = auth.currentUser?.uid;
  const [firstDegreeUIDs, setFirstDegreeUIDs] = useState([]);

  const handleSendRequest = async (toUid) => {
    try {
      if (!currentUid) return;

      const is1stDegree = firstDegreeUIDs.includes(toUid);
      if (is1stDegree) {
        // ✅ 1st-degree: directly send
        await sendHangoutRequest(currentUid, toUid);
        alert('Hangout request sent to your 1st-degree connection!');
      } else {
        // 🔄 2nd-degree: ask for 1st-degree approval
        const mutuals = await getFirstDegreeConnections(currentUid);
        for (let mutualUid of mutuals) {
          const theirConnections = await getFirstDegreeConnections(mutualUid);
          if (theirConnections.includes(toUid)) {
            // 👥 Found a mutual friend
            await requestSecondDegreeApproval(currentUid, toUid, mutualUid);
            alert(`Approval request sent to mutual friend for 2nd-degree connection.`);
            return;
          }
        }
        alert('No mutual 1st-degree connection found to request approval.');
      }
    } catch (err) {
      console.error("❌ Error sending hangout request:", err);
      alert('Failed to send request');
    }
  };

 useEffect(() => {
  async function fetchConnections() {
    if (!currentUid) return;

    try {
      const firstUids = await getFirstDegreeConnections(currentUid);
      const secondUids = await getSecondDegreeConnections(currentUid);

      console.log("👥 1st-degree:", firstUids);
      console.log("👥 2nd-degree:", secondUids);

      setFirstDegreeUIDs(firstUids);

      const allUids = [...new Set([...firstUids, ...secondUids])];

      const userProfiles = await Promise.all(
        allUids.map(async (uid) => {
          const ref = doc(db, 'users', uid);
          const snap = await getDoc(ref);
          return { id: uid, ...snap.data() };
        })
      );

      setUsers(userProfiles);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  }

  console.log("🌀 useEffect triggered. currentUid:", currentUid); // ✅ add this
  fetchConnections();
}, [currentUid]);


  return (
    <ScrollView style={styles.container}>
  <Text style={styles.heading}>Send Hangout Request</Text>

  {users.length === 0 ? (
    <Text>No connections found.</Text>
  ) : (
    users.map(user => (
      <View key={user.id} style={styles.card}>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.bio}>{user.bio || 'No bio'}</Text>
        <Button
          title={
            firstDegreeUIDs.includes(user.id)
              ? 'Send Hangout Request'
              : 'Request via Mutual Friend'
          }
          onPress={() => handleSendRequest(user.id)}
        />
      </View>
    ))
  )}
</ScrollView>

  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  heading: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  card: {
    backgroundColor: '#f2f2f2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  name: { fontSize: 16, fontWeight: 'bold' },
  bio: { fontSize: 14, marginBottom: 8 },
});
