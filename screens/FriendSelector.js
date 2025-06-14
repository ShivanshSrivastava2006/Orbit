import { doc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { auth, db } from '../firebase';

const dummyFriends = [
  { id: '1', name: 'Vaibhav' },
  { id: '2', name: 'Shivansh' },
  { id: '3', name: 'Samarth' },
  { id: '4', name: 'Adi' },
  { id: '5', name: 'Kabir' },
  { id: '6', name: 'Mehul' },
  { id: '7', name: 'Anjali' },
  { id: '8', name: 'Zoya' },
  { id: '9', name: 'Rhea' },
  { id: '10', name: 'Ishaan' },
];

export default function FriendSelector({ navigation }) {
  const [selected, setSelected] = useState([]);

  const toggleFriend = (id) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((x) => x !== id));
    } else if (selected.length < 8) {
      setSelected([...selected, id]);
    } else {
      Alert.alert('Limit Reached', 'You can only select 8 friends.');
    }
  };

  const renderItem = ({ item }) => {
    const isSelected = selected.includes(item.id);
    return (
      <TouchableOpacity
        onPress={() => toggleFriend(item.id)}
        style={[
          styles.friendCard,
          isSelected && { backgroundColor: '#4CAF50' },
        ]}
      >
        <Text style={styles.friendText}>{item.name}</Text>
        {isSelected && <Text style={styles.checkmark}>✔</Text>}
      </TouchableOpacity>
    );
  };

  const handleContinue = async () => {
    if (selected.length !== 8) {
      Alert.alert('Select 8 Friends', 'Please select exactly 8 friends to continue.');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Not logged in');
      return;
    }

    try {
      await setDoc(
        doc(db, 'users', user.uid),
        { friends: selected },
        { merge: true }
      );
      Alert.alert('✅', 'Friends saved!');
      setTimeout(() => {
      navigation.replace('Home');
      }, 1000); // 1 second delay to let alert show
    } catch (err) {
      console.error('❌ Failed to save friends:', err);
      Alert.alert('Error', "Couldn't save friends to backend.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pick your 8 closest friends</Text>

      <FlatList
        data={dummyFriends}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />

      <TouchableOpacity
        style={[
          styles.button,
          selected.length === 8 ? styles.buttonActive : styles.buttonDisabled,
        ]}
        disabled={selected.length !== 8}
        onPress={handleContinue}
      >
        <Text style={styles.buttonText}>
          {selected.length === 8 ? 'Continue' : `${selected.length}/8 selected`}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  list: { gap: 12 },
  friendCard: {
    padding: 16,
    backgroundColor: '#aaa',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  friendText: { color: '#fff', fontSize: 16 },
  checkmark: { color: '#fff', fontWeight: 'bold' },
  button: {
    marginTop: 24,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonActive: { backgroundColor: '#2196F3' },
  buttonDisabled: { backgroundColor: '#ccc' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});