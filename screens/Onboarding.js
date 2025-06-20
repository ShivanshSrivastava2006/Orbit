import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Video } from 'expo-av';
import * as Animatable from 'react-native-animatable';
import { useFonts, Poppins_700Bold } from '@expo-google-fonts/poppins';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const baseWidth = 375;
const scale = (size) => (screenWidth / baseWidth) * size;

export default function Onboarding({ navigation }) {
  const [fontsLoaded] = useFonts({ Poppins_700Bold });

  const taglines = [
    { text: 'CONNECT.', animation: 'fadeIn' },
    { text: 'COLLIDE..', animation: 'fadeIn' },
    { text: 'CHILL...', animation: 'fadeIn' },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % taglines.length);
    }, 1000);
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
            key={currentIndex}
            animation={taglines[currentIndex].animation}
            duration={700}
            style={styles.taglineText}
          >
            {taglines[currentIndex].text}
          </Animatable.Text>
        </View>
      </View>

      {/* Glassmorphic Gradient Button */}
      <TouchableOpacity
        style={styles.buttonWrapper}
        onPress={() => navigation.navigate('SignupScreen')}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={['#4facfe', '#00f2fe']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.buttonGradient}
        >
          <Text style={[styles.buttonText, styles.textStroke]}>GET STARTED</Text>
          <Text style={styles.buttonText}>GET STARTED</Text>
        </LinearGradient>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: scale(20),
    paddingTop: scale(60),
    paddingBottom: scale(80),
    justifyContent: 'space-between',
  },
  content: {
    alignItems: 'center',
    gap: scale(24),
  },
  logo: {
    width: scale(90),
    height: scale(90),
    resizeMode: 'contain',
    marginBottom: scale(30),
  },
  appName: {
    fontSize: scale(30),
    fontFamily: 'Poppins_700Bold',
    color: '#333',
    marginBottom: scale(40),
  },
  videoWrapper: {
    width: scale(260),
    height: scale(170),
    borderRadius: scale(16),
    overflow: 'hidden',
    marginBottom: scale(50),
  },
  video: {
    width: '100%',
    height: '100%',
  },
  taglineWrapper: {
    height: scale(60),
    width: scale(300),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(20),
    borderRadius: scale(20),
  },
  taglineText: {
    fontSize: scale(30),
    color: '#000',
    fontFamily: 'Poppins_700Bold',
  },

  // GLASS BUTTON STYLES
  buttonWrapper: {
    borderRadius: scale(30),
    overflow: 'hidden',
    alignSelf: 'center',
    marginBottom: scale(16),

    // Shadow for iOS
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: scale(6) },
    shadowRadius: scale(10),

    // Shadow for Android
    elevation: 8,

    // Border for glass look
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: 'rgba(255,255,255,0.05)', // optional transparent overlay
  },
  buttonGradient: {
    paddingVertical: scale(14),
    paddingHorizontal: scale(30),
    borderRadius: scale(30),
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
  color: '#fff',
  fontWeight: 'bold',
  fontSize: scale(16),
  letterSpacing: 1,
  textAlign: 'center',
  textShadowColor: '#000',
  textShadowOffset: { width: 0, height: 0 },
  textShadowRadius: 2, // Thicker = more like a border
},
textStroke: {
  position: 'absolute',
  color: 'black',
  zIndex: -1,
  textShadowColor: 'black',
  textShadowOffset: { width: 1, height: 1 },
  textShadowRadius: 1,
},

});
