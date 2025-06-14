import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { db } from '../config';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth } from '../firebase';

export default function MyConnections() {
  const currentUid = auth.currentUser?.uid;
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUid) fetchConnections();
  }, [currentUid]);

  const fetchConnections = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'connections'));
      const matched = [];

      for (let docSnap of snapshot.docs) {
        const data = docSnap.data();
        if (data.users.includes(currentUid)) {
          const otherUid = data.users.find(u => u !== currentUid);
          const userSnap = await getDoc(doc(db, 'users', otherUid));
          const userData = userSnap.exists() ? userSnap.data() : {};

          matched.push({
            id: docSnap.id,
            uid: otherUid,
            name: userData.name || 'Unknown',
            bio: userData.bio || '',
          });
        }
      }

      setConnections(matched);
    } catch (error) {
      console.error("❌ Error fetching connections:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.bio}>{item.bio}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text>🔄 Loading connections...</Text>
      </View>
    );
  }

  if (connections.length === 0) {
    return (
      <View style={styles.centered}>
        <Text>🫥 You have no connections yet.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={connections}
      keyExtractor={item => item.id}
      renderItem={renderItem}
      contentContainerStyle={{ padding: 16 }}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  bio: {
    fontStyle: 'italic',
    marginBottom: 8,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
