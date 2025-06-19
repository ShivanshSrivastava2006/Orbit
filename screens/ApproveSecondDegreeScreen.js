import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, StyleSheet } from 'react-native';
import { collection, getDocs, query, where, doc } from 'firebase/firestore';
import { auth } from '../firebase';
import { db } from '../config';
import { approveSecondDegreeRequest } from '../firestore';

export default function ApproveSecondDegreeScreen() {
  const [requests, setRequests] = useState([]);
  const uid = auth.currentUser?.uid;

  useEffect(() => {
    const fetchApprovalRequests = async () => {
      if (!uid) return;
      const q = query(
        collection(db, 'secondDegreeApprovals'),
        where('approver', '==', uid),
        where('status', '==', 'pending')
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRequests(data);
    };

    fetchApprovalRequests();
  }, [uid]);

  const handleApproval = async (id, status) => {
    await approveSecondDegreeRequest(id, status);
    setRequests(prev => prev.filter(r => r.id !== id));
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.name}>Approve hangout from: {item.from}</Text>
      <Text style={styles.bio}>To: {item.to}</Text>
      <View style={styles.buttons}>
        <Button title="Approve" onPress={() => handleApproval(item.id, 'approved')} />
        <Button title="Reject" color="red" onPress={() => handleApproval(item.id, 'rejected')} />
      </View>
    </View>
  );

  return (
    <FlatList
      data={requests}
      keyExtractor={item => item.id}
      renderItem={renderItem}
      ListEmptyComponent={<Text style={styles.empty}>No approval requests pending.</Text>}
      contentContainerStyle={{ padding: 16 }}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#f2f2f2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  bio: {
    fontSize: 14,
    marginBottom: 8,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  empty: {
    marginTop: 32,
    fontSize: 16,
    textAlign: 'center',
    color: '#555',
  },
});
