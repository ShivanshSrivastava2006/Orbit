import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Button, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { getAllUsers, sendConnectionRequest } from '../firestore';

export default function FindFriends() {
  const route = useRoute();
  const uid = route?.params?.uid ?? null;
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const all = await getAllUsers();
      // exclude self
      setUsers(all.filter(u => u.id !== uid));
    };
    fetchUsers();
  }, [uid]);

  const handleSendRequest = async (receiverId) => {
    await sendConnectionRequest(uid, receiverId);
    alert('Request Sent!');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Find Friends</Text>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text>{item.name || item.id}</Text>
            <Button title="Send Request" onPress={() => handleSendRequest(item.id)} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  card: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 10,
  },
});
