import { StyleSheet, Text, Touchable, TouchableOpacity, View, Image, TextInput} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import EvilIcons from '@expo/vector-icons/EvilIcons';


export default function Login(){
    const navigation = useNavigation();
    return(
        <View style = {styles.container}>

            <Text style = {styles.mensagem}>Login</Text>

            <View style ={styles.containerLogo}>
              <Image source={require("../../../assets/Casa__ECoM.png")} resizeMode='contain'/>          
            </View>

            <Text style = {styles.usuario}>Usuário</Text>
            <TextInput
              placeholder = "Ex: name@example.com"
              style={styles.input}
            />

            <Text style = {styles.senha}>Senha</Text>
            {/*<EvilIcons name="eye" size={24} color="black" />*/}
            <TextInput
              placeholder = "Ex: senha123"
              style={styles.inputSenha}
            />

            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Home')}>
              <Text style={styles.buttonText}>Entrar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.buttonRegister} onPress={() => navigation.navigate('Cadastro')}>
              <Text style={styles.buttonRegister}>Não tem uma conta? Cadastre-se
              </Text>
            </TouchableOpacity>
          </View>  

    )
};


//Estilização
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignSelf: 'center',
    backgroundColor: '#1e2d27',

  },
  containerLogo:{
    flex: 0.5,
    alignItems: 'center',
    marginTop: '1%',
    marginBottom: '10%',
    paddingRight: '5%',
  },
  mensagem:{
    fontSize: 25,
    fontWeight: 'bold',
    backgroundColor: '#fff',
    color: '#000',
    marginBottom: '8%',
    paddingLeft: '15%',
    paddingTop: 25,
  },
  usuario:{
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
    color: '#fff',
    paddingRight: '45%',
    marginBottom: 10,

  },
  senha:{
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
    color: '#fff',
    paddingRight: '45%',
    marginBottom: 10,
    borderColor: "#fff",
    
  },
  input:{
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 15,
    marginBottom: 18,
    paddingVertical: 5,
    paddingHorizontal: 40,
    backgroundColor: "#84828294",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    
  },

  inputSenha:{
    alignSelf: 'center',
    fontSize: 15,
    marginBottom: 13,
    paddingVertical: 5,
    paddingHorizontal: 80,
    backgroundColor: "#84828294",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    
  },

  button:{
    width: '60%',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginBottom: 20,
    marginTop: 30,
    paddingVertical: 5,
    paddingHorizontal: 40,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,


  },
  buttonText:{
    fontSize: 20,
    color: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonRegister:{
    fontSize: 15,
    color: '#fff',
    alignItems: 'center',
  },

});
