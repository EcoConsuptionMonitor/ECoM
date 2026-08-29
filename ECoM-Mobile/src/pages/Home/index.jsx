import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AntDesign from '@expo/vector-icons/AntDesign';
import Entypo from '@expo/vector-icons/Entypo';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { api } from '../../services/api';
import { getToken, getUsuario } from '../../services/session';

export default function Home(){
  const navigation = useNavigation();
  const [consumo, setConsumo] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const usuario = getUsuario();

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      const token = getToken();

      async function carregar() {
        setCarregando(true);
        try {
          const [consumoData, alertasData] = await Promise.all([
            api('/consumo', { token }),
            api('/alertas', { token }),
          ]);
          if (!ativo) return;
          setConsumo(consumoData);
          setAlertas(alertasData);
        } catch {
          if (ativo) {
            setConsumo([]);
            setAlertas([]);
          }
        } finally {
          if (ativo) setCarregando(false);
        }
      }

      carregar();
      return () => { ativo = false; };
    }, [])
  );

  const totalEnergia = consumo
    .filter((c) => c.tipo === 'energia')
    .reduce((acc, c) => acc + Number(c.valor), 0);

  const totalAgua = consumo
    .filter((c) => c.tipo === 'agua')
    .reduce((acc, c) => acc + Number(c.valor), 0);

  const alertaAtivo = alertas.filter((a) => !a.lido);

  const nivelCor = (nivel) => {
    if (nivel === 'critico') return '#ff5252';
    if (nivel === 'alerta') return '#ffc107';
    return '#69f0ae';
  };

  return(
  <ScrollView style={styles.container}>

    <View style ={styles.containerLogo}>
      <TouchableOpacity style={styles.iconButton}>
        <Ionicons name="menu-outline" size={26} color="#fff" />
      </TouchableOpacity>
      <Image source={require("../../../assets/Logo_header.png")} resizeMode='contain'/>
      <TouchableOpacity style={styles.iconBell} onPress={() => navigation.navigate('Alerts')}>
        <AntDesign name="bell" size={24} color="#fff" />
        {alertaAtivo.length > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{alertaAtivo.length}</Text></View> : null}
      </TouchableOpacity>
    </View>

    <Text style={styles.textMensagem}>Olá, {usuario ? usuario.nome : 'equipe EcoMonitor'}!</Text>

    {carregando ? (
      <View style={styles.loading}>
        <ActivityIndicator color="#c8ff00" size="large" />
      </View>
    ) : (
      <>
        <View style={styles.cardPrincipal}>
          <Text style={styles.textCardP}>Sua casa no seu ritmo.</Text>
          <View style={styles.circulo}>
            <Text style={styles.grafico}>{totalEnergia}</Text>
          </View>
        </View>

        <View style={styles.minicards}>
          <View style={styles.minicard}>
            <View style={styles.minicardEnergia}>
              <Entypo name="flash" size={24} color="yellow" />
              <Text style={styles.textMCard}>Energia</Text>
            </View>
            <Text style={styles.textMCard}>{totalEnergia} kWh</Text>
          </View>

          <View style={styles.minicard}>
            <View style={styles.minicardAgua}>
              <Entypo name="drop" size={24} color="#1385ef" />
              <Text style={styles.textMCard}>Água</Text>
            </View>
            <Text style={styles.textMCard}>{totalAgua}L</Text>
          </View>

          <View style={styles.minicard}>
            <View style={styles.minicardCusto}>
              <Entypo name="credit" size={24} color="green" />
              <Text style={styles.textMCard}>Custo Total</Text>
            </View>
            <Text style={styles.textMCard}>R$ {(totalEnergia + totalAgua).toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.cardGraficos}>
          <Entypo name="bar-graph" size={24} color="red" />
          <Text style={styles.textGraficos}>Consumo ao longo do tempo</Text>
        </View>

        <View style={styles.cardAlertas}>
          <Text style={styles.textAlertas}>Alertas recentes</Text>
          {alertas.slice(0, 3).map((alerta) => (
            <View key={alerta.id} style={styles.linhaAlerta}>
              <Entypo name="flash" size={20} color={nivelCor(alerta.nivel)} style={styles.Entypo} />
              <Text style={styles.textAlerta}>{alerta.mensagem}</Text>
            </View>
          ))}
          {alertas.length === 0 ? (
            <View style={styles.linhaAlerta}>
              <FontAwesome name="check-circle" size={24} color="green" />
              <Text style={styles.textAlerta}>Tudo sob controle</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.cardAgua}>
          <Text style={styles.textAgua}>Uso consciente da água</Text>
          <View style={styles.circuloAgua}>
            <Text style={styles.grafico}>{totalAgua}</Text>
          </View>
        </View>

        <View style={styles.cardDica}>
          <Text style={styles.textDica}>Dica sustentável</Text>
          <Entypo name="flower" size={24} color="green" />
          <Text style={styles.textDicaS}>Troque lâmpadas comuns por Led e economize até 80% de energia!</Text>
        </View>
      </>
    )}
  </ScrollView>
  )
};



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e2d27',

  },
  containerLogo: {
    backgroundColor: '#1e2d27',
    alignSelf: 'center',
    flexDirection: 'row',

  },
  iconButton: {
    flexDirection: 'row',
    paddingRight: 30,
    marginTop: 35,
  },
  iconBell: {
    flexDirection: 'row',
    paddingLeft: 30,
    marginTop: 40,
  },
  badge: {
    position: 'absolute',
    top: 30,
    right: 0,
    backgroundColor: '#ff5252',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  loading: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  cardPrincipal:{
    flexDirection: 'row',
    backgroundColor: '#000',
    width: '95%',
    alignSelf: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: 5,
    paddingVertical: 50,
    paddingHorizontal: 120,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  circulo:{
    width: 70,
    height: 70,
    borderColor: '#c8ff00',
    borderEndColor: '#8e8e8e87',
    borderRadius: 90,
    borderWidth: 5,
    alignSelf: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  circuloAgua:{
    width: 70,
    height: 70,
    borderColor: '#1385ef',
    borderEndColor: '#8e8e8e87',
    borderRadius: 90,
    borderWidth: 5,
    alignSelf: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  minicards:{
    flexDirection: 'row',
    gap: 5,
    paddingLeft: '2%',
  },
  minicard:{
    backgroundColor: '#000',
    width: '31%',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: 5,
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  minicardCusto:{
    flexDirection: 'row',
  },
  minicardAgua:{
    flexDirection: 'row',
  },
  minicardEnergia:{
    flexDirection: 'row',
  },
  cardGraficos:{
    backgroundColor: '#000',
    width: '95%',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: 5,
    paddingVertical: 100,
    paddingHorizontal: 120,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  cardAlertas:{
    backgroundColor: '#000',
    width: '95%',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: 5,
    paddingVertical: 60,
    paddingHorizontal: 120,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  linhaAlerta:{
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  cardAgua:{
    flexDirection: 'row-reverse',
    backgroundColor: '#000',
    width: '95%',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    marginTop:5,
    paddingVertical: 40,
    paddingHorizontal: 120,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  cardDica:{
    backgroundColor: '#000',
    backgroundColor: '#000',
    width: '95%',
    alignSelf: 'center',
    marginBottom: 20,
    marginTop: 5,
    paddingVertical: 60,
    paddingHorizontal: 120,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  grafico:{
    paddingLeft: 18,
    color:'#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  Entypo:{
    paddingRight: 75,
  },
  textMensagem:{
    color: '#fff',
    fontSize: 20,
    paddingLeft: '5%',
    paddingTop: '5%',
    fontWeight: 'bold',
  },
  textCardP:{
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  textMCard:{
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  textGraficos:{
    color: '#fff',
  },
  textAlertas:{
    color: '#fff',
  },
  textAlerta:{
    flexDirection: 'row',
    color: '#fff',
  },
  textAgua:{
    color: '#fff',

  },
  textDica:{
    color: '#8cf75f',
  },
  textDicaS:{
    color: '#fff',
  },
});
