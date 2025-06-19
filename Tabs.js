import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import AllUsers from './screens/AllUsers';
import IncomingRequests from './screens/IncomingRequests';
import MyConnections from './screens/MyConnections';
import MyNetwork from './screens/MyNetwork';
import SendHangoutRequests from './screens/SendHangoutRequests';
import AllHangoutUsers from './screens/AllHangoutUsers';
import ApproveSecondDegreeScreen from './screens/ApproveSecondDegreeScreen';
import GraphScreen from './screens/GraphScreen';
const Tab = createBottomTabNavigator();

export default function Tabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: true }}>
      <Tab.Screen name="HomeScreen" component={HomeScreen} />
      <Tab.Screen name="AllUsers" component={AllUsers} />
      <Tab.Screen name="IncomingRequests" component={IncomingRequests} />
      <Tab.Screen name="MyNetwork" component={MyNetwork} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen
        name="AllHangoutUsers"
        component={AllHangoutUsers}
        options={{ title: 'Hangout' }}
      />
      
      <Tab.Screen
        name="Approve2ndRequests"
        component={ApproveSecondDegreeScreen}
        options={{ title: 'Approve 2° Requests' }}
      />
      <Tab.Screen
        name="GraphScreen"
        component={GraphScreen}
       options={({title: 'gay'})}
      />

    </Tab.Navigator>
  );
}
