import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';



function Login(){
    const navigation = useNavigation();
    return(
        <View style = {styles.container}>
            <Image source={require("../../../assets/Logo_media.png")} resizeMode='contain'/>

            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Welcome')}>
                <Text style={styles.text}> Next </Text>
            </TouchableOpacity>

        </View>

    )
};

export default Login;


//Estilização
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
