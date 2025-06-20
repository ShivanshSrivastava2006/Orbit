// screens/AuthDetailsScreen.js
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView, // Helps with keyboard pushing content
  Platform, // For platform-specific adjustments
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // For image upload

import { auth, db } from '../firebase';

export default function AuthDetailsScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false); // For showing loading state

  const navigation = useNavigation();
  const route = useRoute(); // To access parameters from the previous screen
  const { name, age, selectedGender, bio, image } = route.params || {}; // Destructure profile data

  const handleCreateAccount = async () => {
    setMessage(null);
    setLoading(true); // Start loading

    if (!email.trim() || !password.trim()) {
      setMessage('Please enter both email and password.');
      setLoading(false);
      return;
    }

    try {
      // 1. Create User with Email and Password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Handle Profile Image Upload (if exists)
      let imageUrl = null;
      if (image) {
        const storage = getStorage();
        const response = await fetch(image);
        const blob = await response.blob();
        const imageRef = ref(storage, `profileImages/${user.uid}.jpg`);
        await uploadBytes(imageRef, blob);
        imageUrl = await getDownloadURL(imageRef);
      }

      // 3. Save User Profile Data to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        name: name || '', // Use collected name, default to empty string if not passed
        age: age || '', // Use collected age
        gender: selectedGender || '', // Use selected gender
        bio: bio || '', // Use collected bio
        imageUrl: imageUrl, // Save image URL
        createdAt: new Date(),
      });

      setMessage(`✅ Account created for ${user.email}`);
      setTimeout(() => navigation.replace('Main', { uid: user.uid }), 2000); // Navigate to your main app screen
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
      console.error("Firebase Auth/Firestore Error:", error); // Log the error for debugging
    } finally {
      setLoading(false); // End loading
    }
  };

  return (
    <LinearGradient
      colors={['#bbedff', '#2980b9']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.contentContainer}>
          <Text style={styles.title}>Create Your Account</Text>
          <Text style={styles.subtitle}>Just a few more details!</Text>

          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.continueButtonWrapper}
            onPress={handleCreateAccount}
            disabled={loading} // Disable button while loading
          >
            <LinearGradient
              colors={['#a18cd1', '#fbc2eb']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>{loading ? 'Creating Account...' : 'CREATE ACCOUNT'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          {message && <Text style={styles.message}>{message}</Text>}

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.skipButton}>
            <Text style={{ color: '#000000' }}>
              Already have an account?{' '}
              <Text style={{ color: '#001ac9' }}>Log In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardAvoidingView: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    width: '90%',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.2)', // Slightly transparent background
    borderRadius: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    color: '#555',
  },
  inputLabel: {
    alignSelf: 'flex-start',
    fontSize: 14,
    color: '#555',
    marginTop: 15,
    marginBottom: 5,
  },
  input: {
    width: '100%',
    borderWidth: 0,
    padding: 12,
    marginVertical: 5,
    borderRadius: 8,
    backgroundColor: '#f2f2f2',
    fontSize: 16,
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  continueButtonWrapper: {
    width: '100%',
    marginTop: 30,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  buttonGradient: {
    padding: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 1,
    // fontFamily: 'Poppins_700Bold', // Apply if loaded in App.js
  },
  message: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 14,
    color: 'red', // Error messages in red
  },
  skipButton: {
    marginTop: 20,
  },
});