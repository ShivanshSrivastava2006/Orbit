import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import AllUsers from './screens/AllUsers';
import IncomingRequests from './screens/IncomingRequests';
import MyConnections from './screens/MyConnections';

const Tab = createBottomTabNavigator();

export default function Tabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: true }}>
      <Tab.Screen name="HomeScreen" component={HomeScreen} />
      <Tab.Screen name="AllUsers" component={AllUsers} />
      <Tab.Screen name="IncomingRequests" component={IncomingRequests} />
      <Tab.Screen name="MyConnections" component={MyConnections} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
