import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
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

export default function Cadastro() {
  const router = useRouter();
  const { registrar } = useAuth();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [confirma, setConfirma] = useState('');
  const [visivel, setVisivel] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function aoRegistrar() {
    if (!nome.trim() || !email.trim() || !senha) {
      setErro('Preencha nome, e-mail e senha.');
      return;
    }
    if (senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (senha !== confirma) {
      setErro('As senhas não coincidem.');
      return;
    }
    setCarregando(true);
    setErro(null);
    try {
      await registrar({
        nome: nome.trim(),
        email: email.trim(),
        senha,
        telefone: telefone.trim() || undefined,
      });
      router.replace('/(app)');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível criar a conta.');
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

          <Text style={estilos.titulo}>Crie sua conta</Text>
          <Text style={estilos.subtitulo}>Leva menos de um minuto.</Text>

          <View style={estilos.formulario}>
            <Campo label="Nome" valor={nome} onChangeText={setNome} placeholder="Seu nome" autoCapitalize="words" />
            <Campo
              label="E-mail"
              valor={email}
              onChangeText={setEmail}
              placeholder="seu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Campo
              label="Telefone (opcional)"
              valor={telefone}
              onChangeText={setTelefone}
              placeholder="(11) 99999-9999"
              keyboardType="phone-pad"
              maxLength={11}
            />
            <Campo label="Senha" valor={senha} onChangeText={setSenha} placeholder="Mínimo 6 caracteres" seguro={!visivel} />
            <Campo label="Confirmar senha" valor={confirma} onChangeText={setConfirma} placeholder="Repita a senha" seguro={!visivel} />
            <TouchableOpacity style={estilos.olho} onPress={() => setVisivel((v) => !v)}>
              <Ionicons name={visivel ? 'eye-off-outline' : 'eye-outline'} size={18} color={cores.textoSuave} />
              <Text style={estilos.olhoTexto}>{visivel ? 'Ocultar senhas' : 'Mostrar senhas'}</Text>
            </TouchableOpacity>

            {erro ? (
              <View style={estilos.erroCaixa}>
                <Ionicons name="alert-circle" size={18} color={cores.perigo} />
                <Text style={estilos.erroTexto}>{erro}</Text>
              </View>
            ) : null}

            <Botao titulo="Criar conta" onPress={aoRegistrar} carregando={carregando} />
          </View>

          <View style={estilos.rodape}>
            <Text style={estilos.rodapeTexto}>Já tem conta? </Text>
            <Link href="/(auth)/login" replace>
              <Text style={estilos.rodapeLink}>Entrar</Text>
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
  subtitulo: { color: cores.textoSuave, fontSize: 14, marginTop: espacamento.sm },
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
