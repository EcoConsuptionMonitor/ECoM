import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import Home from '../pages/Home';
import Alerts from '../pages/Alerts';
import Dashboard from '../pages/Dashboard';
import Environments from '../pages/Environments';
import Controls from '../pages/Controls';

const Tab = createBottomTabNavigator();

export default function Bottoms() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Alerts" component={Alerts} />
      <Tab.Screen name="Dashboard" component={Dashboard} />
      <Tab.Screen name="Environments" component={Environments} />
      <Tab.Screen name="Controls" component={Controls} />
    </Tab.Navigator>
  );
}