import { StyleSheet, Text, View, Image, TouchableOpacity} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import * as Animatable from 'react-native-animatable';
import Login from '../Login';


export default function Welcome(){
    const navigation = useNavigation();
    return(
        <View style ={styles.container}>

            <View style ={styles.containerLogo}>
                <Image source={require("../../../assets/Logo_media.png")} resizeMode='contain'/>          
            </View>

            <Animatable.View animation='fadeInUp' delay={500} style = {styles.containerForm}>
            <Text style ={styles.title}>Seja Bem-vindo a ECoM!</Text>
            <Text style ={styles.text}>Olá, aqui na ECoM você encontrará um aplicativo que vai te ajudar a controlar suas despesas de água e de energia.</Text>
            <Text style ={styles.text}>Sem falar que também estará ajudando o nosso meio ambiente.</Text>

            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
                <Text style ={styles.textbutton}>Continuar</Text>
            </TouchableOpacity>
            </Animatable.View>

        </View>

    )
};


//Estilização
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e2d27',
    alignItems: 'center',
    justifyContent: 'center',
  },
   containerLogo: {
    flex: 1,
    paddingRight: '3%',
    paddingLeft: '5%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerForm:{
    flex: 0.8,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  text:{
    fontSize: 17,
    color:'black',
    alignItems: 'center',
    paddingRight: '5%',
    paddingLeft: '5%',
    marginBottom: 13,
  },
  title:{
    fontSize: 25,
    fontWeight: 'bold',
    color:'black',
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 25,
  },
  button:{
    fontSize: 17,
    backgroundColor: '#122c1c',
    marginBottom: 40,
    marginTop: 20,
    alignItems: 'center',
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 25,
  },
  textbutton:{
    fontSize: 20,
    color: '#fff',
  }
});