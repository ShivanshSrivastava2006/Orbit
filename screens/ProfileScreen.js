import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Image,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { auth, db } from '../firebase';

export default function ProfileScreen() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const docRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            setName(data.name || '');
            setBio(data.bio || '');
          }
        } catch (err) {
          console.error('❌ Failed to fetch profile:', err);
          Alert.alert('Error', 'Could not load profile from Firestore.');
        }
      } else {
        console.warn('❌ No user found.');
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const saveProfile = async () => {
    if (!user) {
      Alert.alert('⚠️', 'User not loaded yet. Try again in a sec.');
      return;
    }

    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          name,
          bio,
          email: user.email,
          updatedAt: new Date()
        },
        { merge: true }
      );

      console.log('✅ Profile saved to Firestore!');
      Alert.alert('✅', 'Profile saved!');
      setTimeout(() => {
      console.log('🎉 Alert should be visible by now');
      }, 1000);
    } catch (err) {
      console.error('❌ Error saving profile:', err);
      Alert.alert('❌', 'Failed to save profile');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text>⚠️ User not logged in</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: `https://i.pravatar.cc/150?u=${user.uid}` }}
        style={styles.avatar}
      />
      <Text style={styles.email}>📧 {user.email}</Text>

      <TextInput
        placeholder="Your name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />

      <TextInput
        placeholder="Your bio"
        value={bio}
        onChangeText={setBio}
        style={[styles.input, { height: 80 }]}
        multiline
      />

      <Button title="Save Profile" onPress={saveProfile} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, marginTop: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: 16
  },
  email: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 24,
    color: '#555'
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#ccc',
    padding: 12,
    marginBottom: 16
  }
});