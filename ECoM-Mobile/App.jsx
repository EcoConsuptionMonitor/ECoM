import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Splash from './src/pages/Splash';
import Welcome from './src/pages/Welcome';
import Login from './src/pages/Login';
import Cadastro from './src/pages/Cadastro';
import Bottoms from './src/routes/bottoms.routes';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Splash" component={Splash} options={{ headerShown: false }} />
        <Stack.Screen name="Welcome" component={Welcome} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
        <Stack.Screen name="Cadastro" component={Cadastro} />
        <Stack.Screen name="Home" component={Bottoms} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}