import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import Dashboard from '../Dashboard';

const tab = createBottomTabNavigator;

function Home(){
    const navigation = useNavigation();
    return(
      <Tab.Navigator>
       
      <Tab.Screen name='Home' component={Home}/>
      <Tab.Screen name='Alerts' component={Alerts}/>
      <Tab.Screen name='Dashboard' component={Dashboard}/>
      <Tab.Screen name='Controls' component={Controls}/>
      <Tab.Screen name='Environments' component={Environments}/>

      </Tab.Navigator>
    )
};


export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignSelf: 'center',
    backgroundColor: '#1e2d27',

  },
});