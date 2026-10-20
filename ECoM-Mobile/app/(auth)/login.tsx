import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Botao } from '../../src/components/Botao';
import { Campo } from '../../src/components/Campo';
import { useAuth } from '../../src/context/auth';
import { cores, espacamento, raio } from '../../src/styles/theme';

export default function Login() {
  const router = useRouter();
  const { entrar } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [visivel, setVisivel] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function aoEntrar() {
    if (!email.trim() || !senha) {
      setErro('Preencha e-mail e senha.');
      return;
    }
    setCarregando(true);
    setErro(null);
    try {
      await entrar(email.trim(), senha);
      router.replace('/(app)');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível entrar.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={estilos.container}>
      <KeyboardAvoidingView style={estilos.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={estilos.voltar} onPress={() => router.back()} accessibilityLabel="Voltar">
            <Ionicons name="arrow-back" size={22} color={cores.texto} />
          </TouchableOpacity>

          <Text style={estilos.titulo}>Que bom te ver de novo</Text>
          <Text style={estilos.subtitulo}>Entre para acompanhar o consumo da sua casa.</Text>

          <View style={estilos.formulario}>
            <Campo
              label="E-mail"
              valor={email}
              onChangeText={setEmail}
              placeholder="seu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Campo label="Senha" valor={senha} onChangeText={setSenha} placeholder="Sua senha" seguro={!visivel} />
            <TouchableOpacity style={estilos.olho} onPress={() => setVisivel((v) => !v)}>
              <Ionicons name={visivel ? 'eye-off-outline' : 'eye-outline'} size={18} color={cores.textoSuave} />
              <Text style={estilos.olhoTexto}>{visivel ? 'Ocultar senha' : 'Mostrar senha'}</Text>
            </TouchableOpacity>

            {erro ? (
              <View style={estilos.erroCaixa}>
                <Ionicons name="alert-circle" size={18} color={cores.perigo} />
                <Text style={estilos.erroTexto}>{erro}</Text>
              </View>
            ) : null}

            <Botao titulo="Entrar" onPress={aoEntrar} carregando={carregando} />
          </View>

          <View style={estilos.rodape}>
            <Text style={estilos.rodapeTexto}>Ainda não tem conta? </Text>
            <Link href="/(auth)/cadastro" replace>
              <Text style={estilos.rodapeLink}>Cadastre-se</Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espacamento.xl, flexGrow: 1 },
  voltar: {
    width: 40,
    height: 40,
    borderRadius: raio.sm,
    backgroundColor: cores.superficie,
    borderWidth: 1,
    borderColor: cores.linha,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: espacamento.xxl,
  },
  titulo: { color: cores.texto, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  subtitulo: { color: cores.textoSuave, fontSize: 14, marginTop: espacamento.sm, lineHeight: 20 },
  formulario: { marginTop: espacamento.xxl },
  olho: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -espacamento.sm, marginBottom: espacamento.xl },
  olhoTexto: { color: cores.textoSuave, fontSize: 12.5, fontWeight: '600' },
  erroCaixa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacamento.sm,
    backgroundColor: cores.perigoClaro,
    borderRadius: raio.md,
    padding: espacamento.md,
    marginBottom: espacamento.lg,
  },
  erroTexto: { color: cores.perigo, fontSize: 13, flex: 1 },
  rodape: { flexDirection: 'row', justifyContent: 'center', marginTop: 'auto', paddingTop: espacamento.xl },
  rodapeTexto: { color: cores.textoSuave, fontSize: 14 },
  rodapeLink: { color: cores.verde, fontSize: 14, fontWeight: '800' },
});
