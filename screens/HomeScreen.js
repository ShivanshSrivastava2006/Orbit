import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { auth } from '../firebase'; // 👈 correct import

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    marginBottom: 10,
  },
  spacer: {
    height: 12,
  },
});

export default function HomeScreen() {
  const navigation = useNavigation();
  const uid = auth.currentUser?.uid ?? null;

  console.log("🏠 UID in HomeScreen:", uid);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>🎉 You made it to the Home screen!</Text>
      <Text style={styles.text}>Now you can visualize your orbit or graph here.</Text>

      <Button title="Edit Profile" onPress={() => navigation.navigate('Profile', { uid })} />
      <View style={styles.spacer} />
      <Button title="Find Friends" onPress={() => navigation.navigate('AllUsers', { uid })} />
      <View style={styles.spacer} />
     <Button title="View Incoming Requests" onPress={() => navigation.navigate('MyNetwork', { uid })} />
      <View style={styles.spacer} />
      <Button title="My Connections" onPress={() => navigation.navigate('MyConnections', { uid })} />
      <View style={styles.spacer} />
      <Button title="My Orbit (Graph)" onPress={() => navigation.navigate('Graph', { uid })} />
    </View>
    

  );
}
