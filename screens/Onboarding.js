import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

export default function Onboarding({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to the Hangout App!</Text>
      <Text style={styles.subtitle}>Select your 8 closest friends & hang out better.</Text>
      <Button
        title="Get Started"
        onPress={() => navigation.navigate('Login')}
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
  image: {
    width: 200,
    height: 200,
    marginBottom: 20,
  }
});