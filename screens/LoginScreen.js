import { useNavigation } from '@react-navigation/native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth } from '../firebase'; // adjust if needed

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(null);
  const navigation = useNavigation();

  const handleLogin = async () => {
    setMessage(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setMessage(`✅ Logged in as ${userCredential.user.email}`);

      // Navigate to OTP screen with mock phone number
      setTimeout(() => {
        navigation.navigate('Otp', { phone: '9876543210' });
      }, 1500);
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        autoCapitalize="none"
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        secureTextEntry
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>LOGIN</Text>
      </TouchableOpacity>

      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  input: { borderWidth: 1, padding: 10, marginVertical: 8, borderRadius: 4 },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    alignItems: 'center',
    borderRadius: 4,
    marginTop: 12,
  },
  buttonText: { color: 'white', fontWeight: 'bold' },
  message: { marginTop: 20, textAlign: 'center', fontSize: 16 },
});
