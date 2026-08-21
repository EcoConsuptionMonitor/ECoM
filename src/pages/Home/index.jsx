import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import styles from "./styles";

function Home(){
    const navigation = useNavigation();
    return(
        <View style ={styles.container}>
            <Text style ={styles.text}>Tela Home</Text>
        </View>

    )
};


export default Home;