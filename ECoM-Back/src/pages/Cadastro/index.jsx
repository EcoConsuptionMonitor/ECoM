import { StyleSheet, Text, View, Image, TextInput, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function Register(){
    const navigation = useNavigation();
    return(
        <View style ={styles.container}>

          <View style ={styles.containerLogo}>
            <Image source={require("../../../assets/Logo_minimalista.png")} resizeMode='contain'/>          
          </View>

          <View style={styles.containerCadastro}>
            <Text style = {styles.usuario}>Usuário</Text>
              <TextInput
                placeholder = "Ex: João da Silva"
                style={styles.input}
              />

            <Text style = {styles.email}>Email</Text>
              <TextInput
                placeholder = "Ex: name@example.com"
                style={styles.input}
              />

            <Text style = {styles.telefone}>Telefone</Text>
              <TextInput
                placeholder = "Ex: (ddd) 987654321"
                style={styles.inputTelefone}
              />

            <Text style = {styles.senha}>Senha</Text>
              <TextInput
                placeholder = "Ex: senha123"
                style={styles.inputSenha}
              />

            <Text style = {styles.confirma}>Confirmar senha</Text>
              <TextInput
                placeholder = "Ex: senha123"
                style={styles.inputConfirma}
              />

              <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Home')}>
                <Text style={styles.buttonText}>Cadastrar</Text>
              </TouchableOpacity>
          </View>
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
  containerLogo:{
    alignItems: 'center',
    marginBottom: '10%',
  }, 
  containerCadastro:{
    flex: 1,
    alignItems: 'center',
    marginBottom: '10%',
  }, 

  usuario:{
    fontSize: 17,
    color:'#fff',
    paddingRight: '45%',
  },
  email:{
    fontSize: 17,
    color:'#fff',
    paddingRight: '50%',
  },
  senha:{
    fontSize: 17,
    color:'#fff',
    paddingRight: '50%',
  },
  confirma:{
    fontSize: 17,
    color:'#fff',
    paddingRight: '30%',
  },
  telefone:{
    fontSize: 17,
    color:'#fff',
    paddingRight: '45%',
  },
  input:{
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 15,
    marginBottom: 18,
    paddingVertical: 5,
    paddingHorizontal: 40,
    width: 250,
    height: 40,
    backgroundColor: "#a2a2a294",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  inputSenha:{
   alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 15,
    marginBottom: 18,
    paddingVertical: 5,
    paddingHorizontal: 40,
    width: 250,
    height: 40,
    backgroundColor: "#a2a2a294",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  inputTelefone:{
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 15,
    marginBottom: 18,
    paddingVertical: 5,
    paddingHorizontal: 40,
    width: 250,
    height: 40,
    backgroundColor: "#a2a2a294",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  inputEmail:{
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 15,
    marginBottom: 18,
    paddingVertical: 5,
    paddingHorizontal: 40,
    width: 250,
    height: 40,
    backgroundColor: "#a2a2a294",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  inputConfirma:{
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 15,
    marginBottom: 18,
    paddingVertical: 5,
    paddingHorizontal: 40,
    width: 250,
    height: 40,
    backgroundColor: "#a2a2a294",
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
});