import React from 'react';
import { Button, StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';

import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';

export default function Onboarding({ navigation }) {
  return (
    <View style={styles.container}>
      {/* Top Logo */}
      <Image source={require('../assets/logo.png')} style={styles.logo} />

      {/* Animated Orbit GIF */}
      <Image
        source={require('../assets/orbit.gif')} // Make sure this exists in your assets/
        style={styles.gif}
      />

      {/* Tagline */}
      <Text style={styles.title}>Meet. Vibe. Repeat.{"\n"}Welcome to Orbit.</Text>

      {/* App Name Text */}
      <Text style={styles.appName}>ORBIT</Text>

      {/* Get Started Button */}
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.buttonText}>GET STARTED</Text>
      </TouchableOpacity>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F4FF', // Light lavender tone
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logo: {
    width: 90,
    height: 90,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  gif: {
    width: 220,
    height: 150,
    resizeMode: 'contain',
    marginBottom: 30,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    color: '#444',
    marginBottom: 20,
    lineHeight: 28,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6A5ACD', // Soft purple
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#6A5ACD', // Same purple shade as text
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 28,
    alignItems: 'center',
    width: '65%',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
});
