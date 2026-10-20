import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Carregando } from '../src/components/Carregando';
import { useAuth } from '../src/context/auth';
import { api } from '../src/services/api';
import { cores, espacamento, raio } from '../src/styles/theme';
import type { Usuario } from '../src/types';

const iniciais = (nome = '') =>
  nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase() || 'EC';

export default function Perfil() {
  const router = useRouter();
  const { usuario: usuarioSessao, sair } = useAuth();
  const [usuario, setUsuario] = useState<Usuario | null>(usuarioSessao);
  const [carregando, setCarregando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      (async () => {
        try {
          const dados = await api.getMe();
          if (ativo) setUsuario(dados);
        } catch {
          if (ativo) setUsuario(usuarioSessao);
        } finally {
          if (ativo) setCarregando(false);
        }
      })();
      return () => {
        ativo = false;
      };
    }, [usuarioSessao])
  );

  function confirmarSaida() {
    Alert.alert('Sair da conta?', 'Você precisará entrar novamente para acessar seus dados.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await sair();
          router.replace('/(auth)/welcome');
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={estilos.container}>
      <ScrollView contentContainerStyle={estilos.conteudo}>
        <View style={estilos.topo}>
          <TouchableOpacity style={estilos.voltar} onPress={() => router.back()} accessibilityLabel="Voltar">
            <Ionicons name="arrow-back" size={21} color={cores.floresta} />
          </TouchableOpacity>
          <Text style={estilos.titulo}>Minha conta</Text>
          <View style={estilos.espacador} />
        </View>

        <View style={estilos.hero}>
          <View style={estilos.avatar}>
            <Text style={estilos.avatarTexto}>{iniciais(usuario?.nome)}</Text>
          </View>
          <Text style={estilos.nome}>{usuario?.nome || 'EcoMonitor'}</Text>
          <Text style={estilos.email}>{usuario?.email || 'Sua conta ECoM'}</Text>
          <View style={estilos.selo}>
            <Ionicons name="leaf" size={14} color={cores.verde} />
            <Text style={estilos.seloTexto}>Monitoramento ativo</Text>
          </View>
        </View>

        <Text style={estilos.secao}>Dados da conta</Text>
        <View style={estilos.cartao}>
          <Linha icone="mail-outline" titulo="E-mail" valor={usuario?.email || 'Não informado'} />
          <View style={estilos.divisor} />
          <Linha icone="call-outline" titulo="Telefone" valor={usuario?.telefone || 'Não informado'} />
        </View>

        <Text style={estilos.secao}>Sobre o ECoM</Text>
        <View style={estilos.cartao}>
          <Linha icone="hardware-chip-outline" titulo="Integração" valor="Sensores e simulador" />
          <View style={estilos.divisor} />
          <Linha icone="shield-checkmark-outline" titulo="Privacidade" valor="Dados da sua conta" />
        </View>

        {carregando ? <Carregando /> : null}

        <TouchableOpacity style={estilos.sairBotao} onPress={confirmarSaida}>
          <Ionicons name="log-out-outline" size={20} color={cores.perigo} />
          <Text style={estilos.sairTexto}>Sair da conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Linha({ icone, titulo, valor }: { icone: keyof typeof Ionicons.glyphMap; titulo: string; valor: string }) {
  return (
    <View style={estilos.linha}>
      <View style={estilos.iconeLinha}>
        <Ionicons name={icone} size={19} color={cores.verde} />
      </View>
      <View style={estilos.linhaTexto}>
        <Text style={estilos.linhaTitulo}>{titulo}</Text>
        <Text style={estilos.linhaValor}>{valor}</Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espacamento.xl, paddingBottom: 48 },
  topo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: espacamento.xxl },
  voltar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: cores.superficie,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: cores.linha,
  },
  titulo: { fontSize: 18, fontWeight: '700', color: cores.texto },
  espacador: { width: 42 },
  hero: {
    alignItems: 'center',
    backgroundColor: cores.floresta,
    borderRadius: raio.xl + 2,
    paddingVertical: 30,
    paddingHorizontal: 20,
    marginBottom: espacamento.xxl,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#B6D8AE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarTexto: { color: cores.floresta, fontSize: 24, fontWeight: '800' },
  nome: { color: '#fff', fontSize: 22, fontWeight: '700' },
  email: { color: '#C7D6CF', fontSize: 13, marginTop: 5 },
  selo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 99,
    marginTop: 18,
  },
  seloTexto: { color: cores.verde, fontSize: 12, fontWeight: '700' },
  secao: { color: cores.texto, fontSize: 15, fontWeight: '700', marginBottom: 10, marginLeft: 4 },
  cartao: {
    backgroundColor: cores.superficie,
    borderRadius: raio.lg,
    paddingHorizontal: 16,
    marginBottom: 26,
    borderWidth: 1,
    borderColor: cores.linha,
  },
  linha: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15 },
  iconeLinha: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: cores.verdeClaro,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  linhaTexto: { flex: 1 },
  linhaTitulo: { color: cores.textoSuave, fontSize: 12, marginBottom: 3 },
  linhaValor: { color: cores.texto, fontSize: 14, fontWeight: '600' },
  divisor: { height: 1, backgroundColor: cores.linha, marginLeft: 50 },
  sairBotao: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderRadius: raio.md,
    backgroundColor: cores.perigoClaro,
    borderWidth: 1,
    borderColor: '#F5D4D4',
  },
  sairTexto: { color: cores.perigo, fontSize: 14, fontWeight: '700' },
});
