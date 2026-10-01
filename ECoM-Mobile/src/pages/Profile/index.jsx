import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { clearSession, getToken, getUsuario } from '../../services/session';
import { cores } from '../../styles/theme';

const iniciais = (nome = '') => nome.split(' ').filter(Boolean).slice(0, 2).map((parte) => parte[0]).join('').toUpperCase() || 'EC';

export default function Profile() {
  const navigation = useNavigation();
  const [usuario, setUsuario] = useState(getUsuario());
  const [carregando, setCarregando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;

      async function carregar() {
        try {
          const dados = await api('/auth/me', { token: getToken() });
          if (ativo) setUsuario(dados);
        } catch {
          if (ativo) setUsuario(getUsuario());
        } finally {
          if (ativo) setCarregando(false);
        }
      }

      carregar();
      return () => { ativo = false; };
    }, [])
  );

  function sair() {
    Alert.alert('Sair da conta?', 'Você precisará entrar novamente para acessar seus dados.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: () => {
          clearSession();
          navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topo}>
          <TouchableOpacity style={styles.voltar} onPress={() => navigation.goBack()} accessibilityLabel="Voltar">
            <Ionicons name="arrow-back" size={21} color={cores.floresta} />
          </TouchableOpacity>
          <Text style={styles.titulo}>Minha conta</Text>
          <View style={styles.espacador} />
        </View>

        <View style={styles.hero}>
          <View style={styles.avatar}><Text style={styles.avatarTexto}>{iniciais(usuario?.nome)}</Text></View>
          <Text style={styles.nome}>{usuario?.nome || 'EcoMonitor'}</Text>
          <Text style={styles.email}>{usuario?.email || 'Sua conta ECoM'}</Text>
          <View style={styles.selo}><Ionicons name="leaf" size={14} color={cores.verde} /><Text style={styles.seloTexto}>Monitoramento ativo</Text></View>
        </View>

        <Text style={styles.secao}>Dados da conta</Text>
        <View style={styles.cartao}>
          <Linha icone="mail-outline" titulo="E-mail" valor={usuario?.email || 'Não informado'} />
          <View style={styles.divisor} />
          <Linha icone="call-outline" titulo="Telefone" valor={usuario?.telefone || 'Não informado'} />
        </View>

        <Text style={styles.secao}>Sobre o ECoM</Text>
        <View style={styles.cartao}>
          <Linha icone="hardware-chip-outline" titulo="Integração" valor="Sensores e simulador" />
          <View style={styles.divisor} />
          <Linha icone="shield-checkmark-outline" titulo="Privacidade" valor="Dados da sua conta" />
        </View>

        {carregando ? <ActivityIndicator color={cores.verde} style={styles.carregando} /> : null}

        <TouchableOpacity style={styles.sairBtn} onPress={sair}>
          <Ionicons name="log-out-outline" size={20} color={cores.perigo} />
          <Text style={styles.sairTexto}>Sair da conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Linha({ icone, titulo, valor }) {
  return <View style={styles.linha}><View style={styles.iconeLinha}><Ionicons name={icone} size={19} color={cores.verde} /></View><View style={styles.linhaTexto}><Text style={styles.linhaTitulo}>{titulo}</Text><Text style={styles.linhaValor}>{valor}</Text></View></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  content: { padding: 20, paddingBottom: 48 },
  topo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  voltar: { width: 42, height: 42, borderRadius: 21, backgroundColor: cores.superficie, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: cores.linha },
  titulo: { fontSize: 18, fontWeight: '700', color: cores.texto },
  espacador: { width: 42 },
  hero: { alignItems: 'center', backgroundColor: cores.floresta, borderRadius: 28, paddingVertical: 30, paddingHorizontal: 20, marginBottom: 28 },
  avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: '#B6D8AE', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  avatarTexto: { color: cores.floresta, fontSize: 24, fontWeight: '800' },
  nome: { color: '#fff', fontSize: 22, fontWeight: '700' },
  email: { color: '#C7D6CF', fontSize: 13, marginTop: 5 },
  selo: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 99, marginTop: 18 },
  seloTexto: { color: cores.verde, fontSize: 12, fontWeight: '700' },
  secao: { color: cores.texto, fontSize: 15, fontWeight: '700', marginBottom: 10, marginLeft: 4 },
  cartao: { backgroundColor: cores.superficie, borderRadius: 20, paddingHorizontal: 16, marginBottom: 26, borderWidth: 1, borderColor: cores.linha },
  linha: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15 },
  iconeLinha: { width: 38, height: 38, borderRadius: 12, backgroundColor: cores.verdeClaro, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  linhaTexto: { flex: 1 },
  linhaTitulo: { color: cores.textoSuave, fontSize: 12, marginBottom: 3 },
  linhaValor: { color: cores.texto, fontSize: 14, fontWeight: '600' },
  divisor: { height: 1, backgroundColor: cores.linha, marginLeft: 50 },
  carregando: { marginBottom: 16 },
  sairBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, padding: 16, borderRadius: 16, backgroundColor: '#FCECEC', borderWidth: 1, borderColor: '#F5D4D4' },
  sairTexto: { color: cores.perigo, fontSize: 14, fontWeight: '700' },
});
