import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { getFirstDegreeConnections, getSecondDegreeConnections } from '../firestore';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config';
import { auth } from '../firebase';

export default function MyNetwork({ route }) {
    const currentUid = route?.params?.uid ?? auth.currentUser?.uid ?? null;

     
console.log("🧠 Received UID in MyNetwork:", currentUid);
  const [firstDegree, setFirstDegree] = useState([]);
  const [secondDegree, setSecondDegree] = useState([]);

  useEffect(() => {
    if (!currentUid) return;

    async function fetchConnections() {
      console.log("🧠 Fetching network for UID:", currentUid);

      const first = await getFirstDegreeConnections(currentUid);
      const second = await getSecondDegreeConnections(currentUid);
console.log("👥 1st-degree UIDs:", first);
console.log("🔁 2nd-degree UIDs:", second);

      const getProfiles = async (uids) => {
        const results = await Promise.all(uids.map(async (uid) => {
          const ref = doc(db, 'users', uid);
          const snap = await getDoc(ref);
          return { id: uid, ...snap.data() };
        }));
        return results;
      };

      const firstProfiles = await getProfiles(first);
      const secondProfiles = await getProfiles(second);

      setFirstDegree(firstProfiles);
      setSecondDegree(secondProfiles);
    }

    fetchConnections();
  }, [currentUid]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>🧑‍🤝‍🧑 1st-degree connections</Text>
      {firstDegree.length === 0 ? (
        <Text>No direct friends</Text>
      ) : (
        firstDegree.map(user => (
          <View key={user.id} style={styles.card}>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.bio}>{user.bio}</Text>
          </View>
        ))
      )}

      <Text style={styles.heading}>🧑‍🤝‍🧑 2nd-degree connections</Text>
      {secondDegree.length === 0 ? (
        <Text>No mutuals found</Text>
      ) : (
        secondDegree.map(user => (
          <View key={user.id} style={styles.card}>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.bio}>{user.bio}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  heading: { fontSize: 18, fontWeight: 'bold', marginVertical: 12 },
  card: { backgroundColor: '#eee', padding: 12, borderRadius: 8, marginVertical: 6 },
  name: { fontSize: 16, fontWeight: 'bold' },
  bio: { fontSize: 14 },
});
