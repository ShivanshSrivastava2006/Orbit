import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export default function Onboarding({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to the Hangout App!</Text>
      <Button
        title="Get Started"
        onPress={() => navigation.navigate('FriendSelector')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    marginBottom: 20,
    textAlign: 'center',
  },
});
