import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import Home from '../pages/Home';
import Alerts from '../pages/Alerts';
import Dashboard from '../pages/Dashboard';
import Environments from '../pages/Environments';
import Controls from '../pages/Controls';
import { cores } from '../styles/theme';

const Tab = createBottomTabNavigator();

export default function Bottoms() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: cores.verde,
        tabBarInactiveTintColor: '#87958F',
        tabBarStyle: { height: 66, paddingTop: 7, borderTopColor: cores.linha, backgroundColor: '#fff' },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', paddingBottom: 5 },
        tabBarIcon: ({ color, size }) => {
          const icones = { Home: 'home-outline', Dashboard: 'stats-chart-outline', Controls: 'toggle-outline', Environments: 'grid-outline', Alerts: 'notifications-outline' };
          return <Ionicons name={icones[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={Home} options={{ title: 'Início' }} />
      <Tab.Screen name="Dashboard" component={Dashboard} options={{ title: 'Análises' }} />
      <Tab.Screen name="Controls" component={Controls} options={{ title: 'Controles' }} />
      <Tab.Screen name="Environments" component={Environments} options={{ title: 'Ambientes' }} />
      <Tab.Screen name="Alerts" component={Alerts} options={{ title: 'Alertas' }} />
    </Tab.Navigator>
  );
}
