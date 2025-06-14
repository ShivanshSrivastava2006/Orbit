import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Button, StyleSheet } from 'react-native';
import { db } from '../config';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { auth } from '../firebase';

export default function IncomingRequests() {
  const currentUid = auth.currentUser?.uid;
  const [incoming, setIncoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acceptedIds, setAcceptedIds] = useState([]);

  useEffect(() => {
    console.log("📥 IncomingRequests mounted, UID:", currentUid);
    if (currentUid) fetchIncoming();
  }, [currentUid]);

  const fetchIncoming = async () => {
    try {
      const q = query(
        collection(db, 'requests'),
        where('to', '==', currentUid),
        where('status', '==', 'pending')
      );
      const snap = await getDocs(q);

      const requests = await Promise.all(snap.docs.map(async (docSnap) => {
        const data = docSnap.data();
        const userRef = doc(db, 'users', data.from);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.exists() ? userSnap.data() : {};
        return {
          id: docSnap.id,
          from: data.from,
          name: userData.name || 'Unknown',
          bio: userData.bio || '',
        };
      }));

      setIncoming(requests);
    } catch (error) {
      console.error("❌ Error fetching incoming requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const acceptRequest = async (request) => {
    try {
      const from = request.from;
      const to = currentUid;

      await setDoc(doc(db, 'connections', `${from}_${to}`), {
        users: [from, to],
        timestamp: Date.now(),
      });

      await deleteDoc(doc(db, 'requests', request.id));

      setAcceptedIds(prev => [...prev, request.id]);
    } catch (error) {
      console.error("❌ Error accepting request:", error);
    }
  };

  const rejectRequest = async (request) => {
    try {
      await deleteDoc(doc(db, 'requests', request.id));
      setIncoming(prev => prev.filter(r => r.id !== request.id));
    } catch (error) {
      console.error("❌ Error rejecting request:", error);
    }
  };

  const renderRequest = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.bio}>{item.bio}</Text>

      {acceptedIds.includes(item.id) ? (
        <Text style={{ color: 'green', marginBottom: 8 }}>✅ Accepted</Text>
      ) : (
        <>
          <Button title="✅ Accept" onPress={() => acceptRequest(item)} />
          <View style={{ marginTop: 8 }} />
          <Button title="❌ Reject" color="red" onPress={() => rejectRequest(item)} />
        </>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text>🔄 Loading incoming requests...</Text>
      </View>
    );
  }

  if (incoming.length === 0) {
    return (
      <View style={styles.centered}>
        <Text>😕 No incoming requests.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={incoming}
      keyExtractor={item => item.id}
      renderItem={renderRequest}
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
