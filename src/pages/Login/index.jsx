import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import styles from "./styles";



function Login(){
    const navigation = useNavigation();
    return(
        <View style ={styles.container}>
            <Text>Olá Login</Text>
        </View>

    )
};

export default Login;