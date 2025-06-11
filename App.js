import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Onboarding from './screens/Onboarding';
import FriendSelector from './screens/FriendSelector';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Onboarding">
        <Stack.Screen name="Onboarding" component={Onboarding} />
        <Stack.Screen name="FriendSelector" component={FriendSelector} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}