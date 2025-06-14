// screens/DummyScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function DummyScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>✅ Dummy Home Screen is Working</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, color: 'green' },
});
