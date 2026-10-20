import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { cores } from '../../src/styles/theme';

const ICONES: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'home-outline',
  dashboard: 'stats-chart-outline',
  controles: 'toggle-outline',
  ambientes: 'grid-outline',
  alertas: 'notifications-outline',
};

export default function AppTabs() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: cores.verde,
        tabBarInactiveTintColor: '#87958F',
        tabBarStyle: {
          height: 66,
          paddingTop: 7,
          borderTopColor: cores.linha,
          backgroundColor: cores.superficie,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', paddingBottom: 5 },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONES[route.name] ?? 'ellipse-outline'} size={size} color={color} />
        ),
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Início' }} />
      <Tabs.Screen name="dashboard" options={{ title: 'Análises' }} />
      <Tabs.Screen name="controles" options={{ title: 'Controles' }} />
      <Tabs.Screen name="ambientes" options={{ title: 'Ambientes' }} />
      <Tabs.Screen name="alertas" options={{ title: 'Alertas' }} />
    </Tabs>
  );
}
