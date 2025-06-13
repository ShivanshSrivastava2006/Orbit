import { useNavigation } from '@react-navigation/native'; // ✅ import this
import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  const navigation = useNavigation(); // ✅ use this

  return (
    <View style={styles.container}>
      <Text style={styles.text}>🎉 You made it to the Home screen!</Text>
      <Text style={styles.text}>Now you can visualize your orbit or graph here.</Text>
      <Button title="Edit Profile" onPress={() => navigation.navigate('Profile')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  text: { fontSize: 18, textAlign: 'center', marginBottom: 12 },
});