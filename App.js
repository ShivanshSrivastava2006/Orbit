// App.js (Modified)
import 'react-native-gesture-handler';
import 'react-native-reanimated';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useCallback } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Poppins_400Regular, Poppins_700Bold } from '@expo-google-fonts/poppins';

import FriendSelector from './screens/FriendSelector';
import GraphScreen from './screens/GraphScreen';
import LoginScreen from './screens/LoginScreen';
import Onboarding from './screens/Onboarding';
import OtpScreen from './screens/OtpScreen';
import ProfileScreen from './screens/ProfileScreen';
import SignupScreen from './screens/SignupScreen'; // This is now your ProfileSetupScreen
import AuthDetailsScreen from './screens/AuthDetailsScreen'; // ✅ Import the new screen

import Tabs from './Tabs';

const Stack = createNativeStackNavigator();

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <NavigationContainer onReady={onLayoutRootView}>
      <Stack.Navigator initialRouteName="Onboarding">
        <Stack.Screen
          name="Onboarding"
          component={Onboarding}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SignupScreen" // Keep this name for the first screen (Profile Setup)
          component={SignupScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AuthDetails" // ✅ Add the new screen to the stack
          component={AuthDetailsScreen}
          options={{ headerShown: false }} // You can set this to false or customize header
        />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Otp" component={OtpScreen} />
        <Stack.Screen name="FriendSelector" component={FriendSelector} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Main" component={Tabs} options={{ headerShown: false }} />
        <Stack.Screen name="Graph" component={GraphScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
