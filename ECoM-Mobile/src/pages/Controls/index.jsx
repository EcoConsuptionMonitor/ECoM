import { StyleSheet, Text, View } from 'react-native';

function Controls() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Olá</Text>
    </View>
  );
}

export default Controls;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e2d27',
  },
  text: {
    fontSize: 18,
    color: '#fff',
  },
});