import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, StyleSheet } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { db } from '../config'; // ✅ Ensure this is correct
console.log("🔍 TYPE OF DB:", typeof db);
console.log("🧾 DB:", db);
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
} from 'firebase/firestore';
import { auth } from '../firebase';

export default function AllUsers({ route }) {
  const currentUid = route?.params?.uid || auth.currentUser?.uid;
  const isFocused = useIsFocused();
  const [users, setUsers] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);

  useEffect(() => {
    console.log("🔥 DB object:", db); // Debug log
    console.log("🪪 Current UID:", currentUid);

    if (isFocused && currentUid) {
      console.log("🔄 Screen focused, fetching users...");
      fetchUsersAndRequests();
    }
  }, [isFocused]);

  const fetchUsersAndRequests = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const fetchedUsers = [];

      usersSnapshot.forEach((docSnap) => {
        console.log("🧾 Found user:", docSnap.id, docSnap.data());
        if (docSnap.id !== currentUid) {
          fetchedUsers.push({ id: docSnap.id, ...docSnap.data() });
        }
      });

      setUsers(fetchedUsers);

      const reqSnapshot = await getDocs(
        query(collection(db, 'requests'), where('from', '==', currentUid))
      );
      const sent = reqSnapshot.docs.map(doc => doc.data().to);
      setSentRequests(sent);
    } catch (error) {
      console.error("❌ Error fetching users or requests:", error);
    }
  };

  const sendRequest = async (toUid) => {
    try {
      await addDoc(collection(db, 'requests'), {
        from: currentUid,
        to: toUid,
        status: 'pending',  // ✅ Add this line
        timestamp: Date.now(),
      });
      setSentRequests(prev => [...prev, toUid]);
    } catch (error) {
      console.error("❌ Error sending request:", error);
    }
  };

  const renderUser = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.name}>{item.name || 'No Name'}</Text>
      <Text style={styles.bio}>{item.bio || 'No bio yet'}</Text>
      <Button
        title={sentRequests.includes(item.id) ? "Request Sent" : "Send Request"}
        onPress={() => sendRequest(item.id)}
        disabled={sentRequests.includes(item.id)}
      />
    </View>
  );

  if (!currentUid) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: 'red' }}>⚠️ UID not available. Please log in again.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={users}
      keyExtractor={item => item.id}
      renderItem={renderUser}
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
