import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';


export default function Alerts(){
    const navigation = useNavigation();
    return(
        <View style ={styles.container}>
            <Text>Olá</Text>
        </View>

    )
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e2d27',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text:{
    color:'#fff',
  }
 
});
