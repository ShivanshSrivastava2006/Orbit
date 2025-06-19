import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, StyleSheet } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { db } from '../config';
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  query,
  where,
  doc
} from 'firebase/firestore';
import { auth } from '../firebase';

export default function AllUsers({ route }) {
  const currentUid = route?.params?.uid || auth.currentUser?.uid;
  const isFocused = useIsFocused();
  const [users, setUsers] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    if (isFocused && currentUid) {
      fetchUsersAndRequests();
    }
  }, [isFocused]);

  const fetchUsersAndRequests = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const fetchedUsers = [];

      usersSnapshot.forEach((docSnap) => {
        if (docSnap.id !== currentUid) {
          fetchedUsers.push({ id: docSnap.id, ...docSnap.data() });
        }
      });

      setUsers(fetchedUsers);

      // Fetch sent requests
      const reqSnapshot = await getDocs(
        query(collection(db, 'requests'), where('from', '==', currentUid))
      );
      const sent = reqSnapshot.docs.map(doc => ({
        id: doc.id,
        to: doc.data().to
      }));
      setSentRequests(sent);

      // ✅ Fetch friends from 'connections' collection
      const connectionsSnapshot = await getDocs(
        query(collection(db, 'connections'), where('users', 'array-contains', currentUid))
      );

      const friendIds = new Set();
      connectionsSnapshot.forEach(docSnap => {
        const { users } = docSnap.data();
        const friendId = users.find(uid => uid !== currentUid);
        if (friendId) friendIds.add(friendId);
      });

      setFriends([...friendIds]);
    } catch (error) {
      console.error("❌ Error fetching data:", error);
    }
  };

  const sendRequest = async (toUid) => {
    try {
      await addDoc(collection(db, 'requests'), {
        from: currentUid,
        to: toUid,
        status: 'pending',
        timestamp: Date.now(),
      });
      setSentRequests(prev => [...prev, { id: 'temp', to: toUid }]);
    } catch (error) {
      console.error("❌ Error sending request:", error);
    }
  };

  const unsendRequest = async (toUid) => {
    try {
      const reqSnapshot = await getDocs(
        query(collection(db, 'requests'),
          where('from', '==', currentUid),
          where('to', '==', toUid))
      );
      reqSnapshot.forEach(async (docSnap) => {
        await deleteDoc(doc(db, 'requests', docSnap.id));
      });
      setSentRequests(prev => prev.filter(req => req.to !== toUid));
    } catch (error) {
      console.error("❌ Error unsending request:", error);
    }
  };

  const removeFriend = async (friendUid) => {
    try {
      const combos = [
        [currentUid, friendUid],
        [friendUid, currentUid]
      ];

      const connectionsSnapshot = await getDocs(
        query(collection(db, 'connections'), where('users', 'in', combos))
      );

      for (const docSnap of connectionsSnapshot.docs) {
        await deleteDoc(doc(db, 'connections', docSnap.id));
      }

      setFriends(prev => prev.filter(uid => uid !== friendUid));
    } catch (error) {
      console.error("❌ Error removing friend:", error);
    }
  };

  const renderUser = ({ item }) => {
    const isFriend = friends.includes(item.id);
    const requestSent = sentRequests.some(req => req.to === item.id);

    let buttonLabel = 'Send Request';
    let buttonAction = () => sendRequest(item.id);

    if (isFriend) {
      buttonLabel = 'Remove Friend';
      buttonAction = () => removeFriend(item.id);
    } else if (requestSent) {
      buttonLabel = 'Unsend Request';
      buttonAction = () => unsendRequest(item.id);
    }

    return (
      <View style={styles.card}>
        <Text style={styles.name}>{item.name || 'No Name'}</Text>
        <Text style={styles.bio}>{item.bio || 'No bio yet'}</Text>
        <Button
          title={buttonLabel}
          onPress={buttonAction}
          disabled={false} // allow all actions
        />
      </View>
    );
  };

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
