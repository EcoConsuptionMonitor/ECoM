import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {NavigationContainer} from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"; 
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text, View } from 'react-native';
import { registerRootComponent } from 'expo';

import Splash from "./src/pages/Splash"
import Welcome from "./src/pages/Welcome"
import Login from "./src/pages/Login"
import Cadastro from "./src/pages/Cadastro"
import Home from "./src/pages/Home"
import Alerts from "./src/pages/Alerts"
import Dashboard from "./src/pages/Dashboard"
import Environments from "./src/pages/Environments"
import Controls from "./src/pages/Controls"

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

export default function App() {
  
  return (
    <NavigationContainer>
      <Stack.Navigator>
         <Stack.Screen name="Splash" component={Splash} options={{headerShown: false}}/> 
        <Stack.Screen name="Welcome" component={Welcome} options={{headerShown: false}}/> 
        <Stack.Screen name="Login" component={Login} options={{headerShown: false}}/>
        <Stack.Screen name="Cadastro" component={Cadastro}/>
        <Stack.Screen name="Home" component={Home} options={{headerShown: false}}/>
        <Stack.Screen name="Alerts" component={Alerts} options={{headerShown: false}}/>
        <Stack.Screen name="Dashboard" component={Dashboard} options={{headerShown: false}}/>
        <Stack.Screen name="Environments" component={Environments} options={{headerShown: false}}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

//Barra de botões

/*tabBarBadgeStyle: {
  color: 'black',
  backgroundColor: 'yellow',
},*/