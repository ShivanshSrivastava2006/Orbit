import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Onboarding from './screens/Onboarding';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen'; // ✅ Import this
import OtpScreen from './screens/OtpScreen';
import FriendSelector from './screens/FriendSelector';
import ProfileScreen from './screens/ProfileScreen';
import Tabs from './Tabs'; // ✅ This contains Home, etc.

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Onboarding">
        <Stack.Screen name="Onboarding" component={Onboarding} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="Otp" component={OtpScreen} />
        <Stack.Screen name="FriendSelector" component={FriendSelector} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Main" component={Tabs} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
