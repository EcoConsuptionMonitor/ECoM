import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Botao } from '../../src/components/Botao';
import { useAuth } from '../../src/context/auth';
import { cores, espacamento, raio } from '../../src/styles/theme';

const ADMIN_EMAIL = process.env.EXPO_PUBLIC_ADMIN_EMAIL ?? 'admin@ecom.com';
const ADMIN_SENHA = process.env.EXPO_PUBLIC_ADMIN_SENHA ?? 'admin123';

const DIFERENCIAIS = [
  { icone: 'speedometer-outline' as const, titulo: 'Monitoramento em tempo real', descricao: 'Consumo de água e energia da sua casa em um só lugar.' },
  { icone: 'notifications-outline' as const, titulo: 'Alertas inteligentes', descricao: 'Avisos quando o consumo foge do esperado.' },
  { icone: 'leaf-outline' as const, titulo: 'Escolhas mais leves', descricao: 'Custos e histórico para economizar de verdade.' },
];

export default function Welcome() {
  const router = useRouter();
  const { entrar } = useAuth();
  const [entrandoAdmin, setEntrandoAdmin] = useState(false);

  async function entrarComoAdmin() {
    setEntrandoAdmin(true);
    try {
      await entrar(ADMIN_EMAIL, ADMIN_SENHA);
      router.replace('/(app)');
    } catch (e) {
      Alert.alert('Não foi possível entrar', e instanceof Error ? e.message : 'Tente novamente.');
    } finally {
      setEntrandoAdmin(false);
    }
  }

  return (
    <SafeAreaView style={estilos.container}>
      <View style={estilos.conteudo}>
        <Image source={require('../../assets/Logo_media.png')} style={estilos.logo} resizeMode="contain" />
        <Text style={estilos.titulo}>Bem-vindo ao ECoM</Text>
        <Text style={estilos.subtitulo}>EcoMonitor — sua casa mais consciente.</Text>

        <View style={estilos.lista}>
          {DIFERENCIAIS.map((item) => (
            <View key={item.titulo} style={estilos.item}>
              <View style={estilos.itemIcone}>
                <Ionicons name={item.icone} size={20} color={cores.verde} />
              </View>
              <View style={estilos.itemTexto}>
                <Text style={estilos.itemTitulo}>{item.titulo}</Text>
                <Text style={estilos.itemDescricao}>{item.descricao}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={estilos.rodape}>
        <Link href="/(auth)/login" asChild>
          <Botao titulo="Já tenho conta" />
        </Link>
        <Link href="/(auth)/cadastro" asChild>
          <Botao titulo="Criar conta grátis" variante="secundario" />
        </Link>
        <Botao
          titulo="Entrar como administrador"
          variante="fantasma"
          onPress={entrarComoAdmin}
          carregando={entrandoAdmin}
        />
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo, padding: espacamento.xl },
  conteudo: { flex: 1, justifyContent: 'center' },
  logo: { width: 140, height: 140, alignSelf: 'center', marginBottom: espacamento.xl },
  titulo: { color: cores.texto, fontSize: 28, fontWeight: '800', textAlign: 'center', letterSpacing: -0.5 },
  subtitulo: { color: cores.textoSuave, fontSize: 15, textAlign: 'center', marginTop: espacamento.sm },
  lista: { marginTop: espacamento.xxl, gap: espacamento.lg },
  item: {
    flexDirection: 'row',
    gap: espacamento.lg,
    backgroundColor: cores.superficie,
    borderRadius: raio.lg,
    borderWidth: 1,
    borderColor: cores.linha,
    padding: espacamento.lg,
    alignItems: 'center',
  },
  itemIcone: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: cores.verdeClaro,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTexto: { flex: 1 },
  itemTitulo: { color: cores.texto, fontSize: 14, fontWeight: '700' },
  itemDescricao: { color: cores.textoSuave, fontSize: 12.5, marginTop: 3, lineHeight: 18 },
  rodape: { gap: espacamento.md, paddingBottom: espacamento.md },
});
