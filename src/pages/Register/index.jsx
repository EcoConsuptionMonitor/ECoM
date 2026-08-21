import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import styles from "./styles";

function Register(){
    const navigation = useNavigation();
    return(
        <View style ={styles.container}>
            <Text>Olá</Text>
        </View>

    )
};

export default Register;