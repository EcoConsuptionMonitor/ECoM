import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import { BottomTabsScreen } from 'react-native-screens';

import Home from "./src/pages/Home"
import Alerts from "./src/pages/Alerts"
import Dashboard from "./src/pages/Dashboard"
import Environments from "./src/pages/Environments"
import Controls from "./src/pages/Controls"

export default function Bottoms() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Alerts" component={Alerts} />
      <Tab.Screen name="Dashboard" component={Dashboard} />
      <Tab.Screen name="Environments" component={Environments} />
    </Tab.Navigator>
  );
}