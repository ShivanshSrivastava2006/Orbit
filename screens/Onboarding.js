import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Video } from 'expo-av';
import { useFonts, Orbitron_700Bold } from '@expo-google-fonts/orbitron';

export default function Onboarding({ navigation }) {
  const [fontsLoaded] = useFonts({
    Orbitron_700Bold,
  });

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
            isMuted={false}
            resizeMode="cover"
            shouldPlay
            isLooping
            style={styles.video}
          />
        </View>

        <View style={styles.taglineWrapper}>
          <Video
            source={require('../assets/ConnectCollideChill.mp4')}
            rate={1.0}
            volume={1.0}
            isMuted={false}
            resizeMode="contain"
            shouldPlay
            isLooping
            style={styles.taglineVideo}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
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
    fontFamily: 'Orbitron_700Bold',
    color: '#333',
    marginBottom: 24,
  },
  videoWrapper: {
  width: 260,
  height: 170,
  borderRadius: 20,
  overflow: 'hidden',
  backgroundColor: '#121212',
  padding: 2,
  shadowColor: '#9b5de5',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.4,
  shadowRadius: 12,
  elevation: 10,
  marginBottom: 16,
  alignItems: 'flex-start',  // ensures the video shifts left from within
},

video: {
  width: '100%',           // scale wider
  height: '100%',
  marginLeft: '-10%',      // shift left to crop the left side
},

  taglineWrapper: {
  width: 300,
  height: 94,
  marginBottom: 20,
  borderRadius: 20,
  overflow: 'hidden',
  alignItems: 'flex-start', // necessary for shift
},

taglineVideo: {
  width: '120%',         // zoom in horizontally
  height: '100%',
  marginLeft: '-10%',    // crop from the left side
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
