import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Onboarding from './screens/Onboarding';
import FriendSelector from './screens/FriendSelector';
import OtpScreen from './screens/OtpScreen'; // 👈 Imported

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Otp">  {/* ✅ Changed here */}
        <Stack.Screen name="Onboarding" component={Onboarding} />
        <Stack.Screen name="FriendSelector" component={FriendSelector} />
        <Stack.Screen name="Otp" component={OtpScreen} /> {/* Already added */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
