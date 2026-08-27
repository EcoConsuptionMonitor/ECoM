import { StyleSheet, Text, View } from 'react-native';

function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Olá, bem-vindo de volta!</Text>
      <Text style={styles.subtitle}>Acompanhe aqui os seus consumos e alertas.</Text>
    </View>
  );
}

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e2d27',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  subtitle: {
    fontSize: 15,
    color: '#fff',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});