// app/home.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { auth, db } from '../../firebase'; // ✅ if firebase.ts is in root and you're deeper

import { doc, getDoc } from 'firebase/firestore';

export default function HomeScreen() {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const loadUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
      }
    };
    loadUserData();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Home!</Text>
      {userData && (
        <Text style={styles.text}>You are logged in as: {userData.email}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 16 },
  text: { fontSize: 16 },
});
