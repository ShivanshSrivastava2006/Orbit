import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Video } from 'expo-av';
import * as Animatable from 'react-native-animatable';
import { useFonts, Poppins_700Bold } from '@expo-google-fonts/poppins';

export default function Onboarding({ navigation }) {
  const [fontsLoaded] = useFonts({
    Poppins_700Bold,
  });

  const taglines = [
  { text: 'CONNECT.', animation: 'fadeIn' },
  { text: 'COLLIDE..', animation: 'fadeIn' },
  { text: 'CHILL...', animation: 'fadeIn' },
];


  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % taglines.length);
    }, 1000); // 1.4s per phrase

    return () => clearInterval(interval);
  }, []);

  if (!fontsLoaded) return null;

  return (
    <LinearGradient
      colors={['#d8c4ff', '#ffe2e2']}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <Image source={require('../assets/images/Logo.png')} style={styles.logo} />
        <Text style={styles.appName}>ORBIT</Text>

        <View style={styles.videoWrapper}>
          <Video
            source={require('../assets/Onboarding GIF.mp4')}
            rate={1.0}
            volume={1.0}
            isMuted={true}
            resizeMode="cover"
            shouldPlay
            isLooping
            style={styles.video}
          />
        </View>

        <View style={styles.taglineWrapper}>
          <Animatable.Text
          key={currentIndex} // Forces animation replay
          animation={taglines[currentIndex].animation}
          duration={700}
          style={styles.taglineText}
        >
          {taglines[currentIndex].text}
        </Animatable.Text>
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('SignupScreen')}>
        <Text style={styles.buttonText}>GET STARTED</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 80,
    justifyContent: 'space-between',
  },
  content: {
    alignItems: 'center',
    gap: 24,
  },
  logo: {
    width: 90,
    height: 90,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  appName: {
    fontSize: 30,
    fontFamily: 'Poppins_700Bold',
    color: '#333',
    marginBottom: 24,
  },
  videoWrapper: {
    width: 260,
    height: 170,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  taglineWrapper: {
    height: 60,
    width: 300,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderRadius: 20,
  },
  taglineText: {
    fontSize: 24,
    color: '#000',
    fontFamily: 'Poppins_700Bold',
  },
  button: {
    backgroundColor: '#84a0df',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
    shadowColor: '#999',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
});
