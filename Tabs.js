import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import AllUsers from './screens/AllUsers';
import GraphScreen from './screens/GraphScreen';
import HomeScreen from './screens/HomeScreen';
import IncomingConnectionRequests from './screens/IncomingConnectionRequests';
import IncomingRequests from './screens/IncomingRequests';
import MyNetwork from './screens/MyNetwork';
import ProfileScreen from './screens/ProfileScreen';
import SentRequests from './screens/SentHangoutRequests';
const Tab = createBottomTabNavigator();

export default function Tabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: true }}>
      <Tab.Screen name="HomeScreen" component={HomeScreen} />
      <Tab.Screen name="AllUsers" component={AllUsers} />
      <Tab.Screen name="IncomingRequests" component={IncomingRequests} />
      <Tab.Screen name="MyNetwork" component={MyNetwork} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="IncomingConnectionRequests" component={IncomingConnectionRequests} />
      <Tab.Screen
        name="GraphScreen"
        component={GraphScreen}
       options={({title: 'gay'})}
      />
      <Tab.Screen name="SentHangoutRequests" component={SentRequests} />

    </Tab.Navigator>
  );
}
