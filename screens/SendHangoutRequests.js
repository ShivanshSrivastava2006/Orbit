import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config';
import { auth } from '../firebase';
import { sendHangoutRequest, getFirstDegreeConnections } from '../firestore';

export default function SendHangoutRequests() {
  const [users, setUsers] = useState([]);
  const currentUid = auth.currentUser?.uid;

  const handleSendRequest = async (toUid) => {
    try {
      console.log("📤 Calling sendHangoutRequest:", currentUid, toUid);
      await sendHangoutRequest(currentUid, toUid);
      console.log("✅ Hangout request sent");
      alert('Hangout request sent!');
    } catch (err) {
      console.error("❌ Error sending hangout request:", err);
      alert('Failed to send request');
    }
  };

  useEffect(() => {
    async function fetchFirstDegreeUsers() {
      if (!currentUid) return;

      try {
        const uids = await getFirstDegreeConnections(currentUid); // ✅ fetch connected users

        const userProfiles = await Promise.all(
          uids.map(async (uid) => {
            const ref = doc(db, 'users', uid);
            const snap = await getDoc(ref);
            return { id: uid, ...snap.data() };
          })
        );

        setUsers(userProfiles);
      } catch (err) {
        console.error("Error fetching 1st-degree users:", err);
      }
    }

    fetchFirstDegreeUsers();
  }, [currentUid]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Send Hangout Request to Friends</Text>
      {users.length === 0 ? (
        <Text>No 1st-degree connections found.</Text>
      ) : (
        users.map(user => (
          <View key={user.id} style={styles.card}>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.bio}>{user.bio || 'No bio'}</Text>
            <Button
              title="Send Hangout Request"
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
