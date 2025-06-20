// screens/LoginScreen.js
import { useNavigation } from '@react-navigation/native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import { BlurView } from 'expo-blur';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { auth } from '../firebase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const handleLogin = async () => {
    setMessage(null);
    setLoading(true);

    if (!email.trim() || !password.trim()) {
      setMessage('Please enter both email and password.');
      setLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setMessage(`✅ Logged in as ${userCredential.user.email}`);
      setTimeout(() => {
        navigation.replace('Main', { uid: userCredential.user.uid });
      }, 1500);
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
      console.error("Firebase Login Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#c2e9fb', '#a1c4fd']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <BlurView intensity={40} tint="light" style={styles.contentContainer}>
          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>Log in to continue your journey</Text>

          <Text style={styles.inputLabel}>email</Text>
          <TextInput
            style={styles.input}
            placeholder="enter your email"
            value={email}
            autoCapitalize="none"
            onChangeText={setEmail}
            keyboardType="email-address"
          />

          <Text style={styles.inputLabel}>password</Text>
          <TextInput
            style={styles.input}
            placeholder="enter your password"
            value={password}
            secureTextEntry
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={styles.continueButtonWrapper}
            onPress={handleLogin}
            disabled={loading}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>
                {loading ? 'logging in...' : 'Log in'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {message && <Text style={styles.message}>{message}</Text>}

          <View style={styles.signUpPrompt}>
            <Text style={{ color: '#000000' }}>
              don't have an account?{' '}
              <Text
                style={{ color: '#001ac9' }}
                onPress={() => navigation.navigate('SignupScreen')}
              >
                sign up
              </Text>
            </Text>
          </View>
        </BlurView>
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
  paddingVertical: 25,
  paddingHorizontal: 20,
  borderRadius: 20,

  // 🧹 REMOVE the blur effects
  backgroundColor: 'rgba(255, 255, 255, 0.9)', // solid or slight transparency
  borderWidth: 0,         // remove border haze
  borderColor: 'transparent',
  
  shadowColor: 'transparent', // no shadow fog
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0,
  shadowRadius: 0,
  elevation: 0,
},

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
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
    width: '80%',
    marginTop: 30,
    alignSelf: 'center',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  buttonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 50,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 1,
  },
  message: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 14,
    color: 'red',
  },
  signUpPrompt: {
    marginTop: 20,
  },
});
