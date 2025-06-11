import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

const dummyFriends = [
  { id: '1', name: 'Vaibhav' },
  { id: '2', name: 'Shivansh' },
  { id: '3', name: 'Samarth' },
  { id: '4', name: 'Adi' },
  { id: '5', name: 'Kabir' },
  { id: '6', name: 'Mehul' },
  { id: '7', name: 'Anjali' },
  { id: '8', name: 'Zoya' },
];

export default function FriendSelector() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select your 8 close friends</Text>
      <View style={styles.listContainer}>
        <FlatList
          data={dummyFriends}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Text style={styles.friend}>{item.name}</Text>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
    backgroundColor: '#fff', // optional
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
  },
  listContainer: {
    flex: 1,
  },
  friend: {
    fontSize: 16,
    marginVertical: 5,
    padding: 10,
    backgroundColor: '#aaa',
    color: '#fff',
    borderRadius: 5,
  },
});