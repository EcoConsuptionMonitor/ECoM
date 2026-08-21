import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {NavigationContainer} from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"; 
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text, View } from 'react-native';
import { registerRootComponent } from 'expo';

import Home from "./src/pages/Home"
import Login from "./src/pages/Login"
import Register from "./src/pages/Register"
import Alerts from "./src/pages/Alerts"
import Dashboard from "./src/pages/Dashboard"
import Environments from "./src/pages/Environments"

const StackNavigation = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

export default function App() {
  
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={Home}/>
        <Stack.Screen name="Login" component={Login}/>
        <Stack.Screen name="Register" component={Register}/>
        <Stack.Screen name="Alerts" component={Alerts}/>
        <Stack.Screen name="Dashboard" component={Dashboard}/>
        <Stack.Screen name="Environments" component={Environments}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function MyTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Login" component={Login} />
      <Tab.Screen name="Register" component={Register} />
      <Tab.Screen name="Alerts" component={Alerts} />
      <Tab.Screen name="Dashboard" component={Dashboard} />
      <Tab.Screen name="Environments" component={Environments} />
    </Tab.Navigator>
  );
}
/*tabBarBadgeStyle: {
  color: 'black',
  backgroundColor: 'yellow',
},*/