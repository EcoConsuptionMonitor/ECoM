import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';


function Environments(){
    const navigation = useNavigation();
    return(
        <View style ={styles.container}>
            <Text>Olá</Text>
        </View>

    )
};

export default Environments;