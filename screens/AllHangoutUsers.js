import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, StyleSheet } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { db } from '../config';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  writeBatch
} from 'firebase/firestore';
import {
  sendHangoutRequest,
  acceptHangoutRequest,
  cancelHangoutRequest
} from '../firestore';
import { auth } from '../firebase';
import { getFirstDegreeConnections } from '../firestore';

export default function AllHangoutUsers({ route }) {
  const currentUid = route?.params?.uid || auth.currentUser?.uid;
  const isFocused = useIsFocused();
  const [users, setUsers] = useState([]);
  const [sentRequests, setSentRequests] = useState({});
  const [incomingRequests, setIncomingRequests] = useState([]);

  useEffect(() => {
    if (isFocused && currentUid) {
      fetchUsersAndRequests();
    }
  }, [isFocused]);

  const getUserName = async (uid) => {
    try {
      const docSnap = await getDoc(doc(db, 'users', uid));
      return docSnap.exists() ? docSnap.data().name || 'Unknown' : 'Unknown';
    } catch (e) {
      console.error("Error fetching user name:", e);
      return 'Unknown';
    }
  };

  const fetchUsersAndRequests = async () => {
    try {
      // ✅ Get only 1st-degree connections
      const firstDegreeUids = await getFirstDegreeConnections(currentUid);
      const fetchedUsers = [];

      for (const uid of firstDegreeUids) {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
          fetchedUsers.push({ id: uid, ...userDoc.data() });
        }
      }

      setUsers(fetchedUsers);

      // ✅ Fetch sent hangout requests with status
      const sentSnap = await getDocs(
        query(collection(db, 'hangoutRequests'), where('from', '==', currentUid))
      );
      const sent = {};
      sentSnap.docs.forEach(doc => {
        const data = doc.data();
        sent[data.to] = data.status || 'pending';
      });
      setSentRequests(sent);

      // ✅ Fetch incoming requests
      const incomingSnap = await getDocs(
        query(collection(db, 'hangoutRequests'), where('to', '==', currentUid))
      );
      const incoming = await Promise.all(
        incomingSnap.docs
          .filter(doc => doc.data().status === 'pending')
          .map(async docSnap => {
            const data = docSnap.data();
            const fromName = await getUserName(data.from);
            return { id: docSnap.id, ...data, fromName };
          })
      );
      setIncomingRequests(incoming);

    } catch (error) {
      console.error("❌ Error fetching users or hangout requests:", error);
    }
  };

  const sendRequest = async (toUid) => {
    try {
      await sendHangoutRequest(currentUid, toUid);
      setSentRequests(prev => ({ ...prev, [toUid]: 'pending' }));
    } catch (error) {
      console.error("❌ Error sending hangout request:", error);
    }
  };

  const unsendRequest = async (toUid) => {
    try {
      const q = query(
        collection(db, 'hangoutRequests'),
        where('from', '==', currentUid),
        where('to', '==', toUid),
        where('status', '==', 'pending')
      );
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.forEach(docSnap => batch.delete(docSnap.ref));
      await batch.commit();

      setSentRequests(prev => {
        const updated = { ...prev };
        delete updated[toUid];
        return updated;
      });
    } catch (error) {
      console.error("❌ Error unsending hangout request:", error);
    }
  };

  const acceptRequest = async (fromUid) => {
    try {
      await acceptHangoutRequest(fromUid, currentUid);
      setIncomingRequests(prev => prev.filter(req => req.from !== fromUid));
    } catch (error) {
      console.error("❌ Error accepting hangout request:", error);
    }
  };

  const rejectRequest = async (fromUid) => {
    try {
      await cancelHangoutRequest(fromUid, currentUid);
      setIncomingRequests(prev => prev.filter(req => req.from !== fromUid));
    } catch (error) {
      console.error("❌ Error rejecting hangout request:", error);
    }
  };

  const renderUser = ({ item }) => {
    const status = sentRequests[item.id];

    return (
      <View style={styles.card}>
        <Text style={styles.name}>{item.name || 'No Name'}</Text>
        <Text style={styles.bio}>{item.bio || 'No bio yet'}</Text>

        {status === 'accepted' ? (
          <Button title="Hangout Accepted" disabled />
        ) : status === 'pending' ? (
          <Button title="Unsend Request" color="red" onPress={() => unsendRequest(item.id)} />
        ) : (
          <Button title="Send Hangout" onPress={() => sendRequest(item.id)} />
        )}
      </View>
    );
  };

  const renderIncoming = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.name}>Request from: {item.fromName}</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
        <Button title="Accept" onPress={() => acceptRequest(item.from)} />
        <Button title="Reject" onPress={() => rejectRequest(item.from)} />
      </View>
    </View>
  );

  return (
    <FlatList
      ListHeaderComponent={
        <View style={{ marginBottom: 24 }}>
          <Text style={styles.heading}>Incoming Hangout Requests</Text>
          {incomingRequests.length === 0 ? (
            <Text style={{ marginBottom: 16 }}>No incoming requests.</Text>
          ) : (
            <FlatList
              data={incomingRequests}
              keyExtractor={item => item.id}
              renderItem={renderIncoming}
              scrollEnabled={false}
            />
          )}
          <Text style={styles.heading}>Your 1st-Degree Connections</Text>
        </View>
      }
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
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
});
