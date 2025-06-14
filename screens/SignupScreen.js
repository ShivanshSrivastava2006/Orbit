import { useNavigation } from '@react-navigation/native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../firebase';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
   const [message, setMessage] = useState(null);
  const [name, setName] = useState('');
const [bio, setBio] = useState('');
 
  const navigation = useNavigation();

  const handleSignup = async () => {
    setMessage(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        name: name.trim(),
  bio: bio.trim(),
        createdAt: new Date(),
      });

      setMessage(`✅ Signup successful for ${user.email}`);
  setTimeout(() => navigation.replace('AllUsers', { uid: user.uid }), 2000);
 // <- better than push
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Signup</Text>

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
<TextInput
  style={styles.input}
  placeholder="Your Name"
  value={name}
  onChangeText={setName}
/>
<TextInput
  style={styles.input}
  placeholder="Short Bio (optional)"
  value={bio}
  onChangeText={setBio}
/>
      <TouchableOpacity style={styles.button} onPress={handleSignup}>
        <Text style={styles.buttonText}>SIGNUP</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={{ color: 'blue', marginTop: 12 }}>Already have an account? Log in</Text>
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
    backgroundColor: '#2196F3',
    padding: 15,
    alignItems: 'center',
    borderRadius: 4,
    marginTop: 12,
  },
  buttonText: { color: 'white', fontWeight: 'bold' },
  message: { marginTop: 20, textAlign: 'center', fontSize: 16 },
});
