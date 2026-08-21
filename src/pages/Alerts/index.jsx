import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import styles from "./styles";

function Alerts(){
    const navigation = useNavigation();
    return(
        <View style ={styles.container}>
            <Text>Olá</Text>
        </View>

    )
};

export default Alerts;