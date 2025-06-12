import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import AuthScreen from './screens/AuthScreen';
import FriendSelector from './screens/FriendSelector';
import LoginScreen from './screens/LoginScreen';
import Onboarding from './screens/Onboarding';
import OtpScreen from './screens/OtpScreen';
import SignupScreen from './screens/SignupScreen';

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
        <Stack.Screen name="Auth" component={AuthScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}