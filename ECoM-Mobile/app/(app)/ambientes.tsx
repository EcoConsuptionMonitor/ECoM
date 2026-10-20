import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Botao } from '../../src/components/Botao';
import { Carregando } from '../../src/components/Carregando';
import { Vazio } from '../../src/components/Vazio';
import { api } from '../../src/services/api';
import { cores, espacamento, raio } from '../../src/styles/theme';
import type { Ambiente } from '../../src/types';

function iconeAmbiente(nome: string): keyof typeof Ionicons.glyphMap {
  const n = nome.toLowerCase();
  if (n.includes('quarto') || n.includes('bedroom')) return 'bed-outline';
  if (n.includes('cozinha') || n.includes('kitchen')) return 'restaurant-outline';
  if (n.includes('banheiro') || n.includes('bath')) return 'water-outline';
  if (n.includes('sala') || n.includes('living')) return 'tv-outline';
  if (n.includes('lavanderia') || n.includes('laundry')) return 'shirt-outline';
  if (n.includes('jardim') || n.includes('garden')) return 'leaf-outline';
  return 'home-outline';
}

export default function Ambientes() {
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [localizacao, setLocalizacao] = useState('');
  const [descricao, setDescricao] = useState('');
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const dados = await api.getAmbientes();
      setAmbientes(dados);
    } catch {
      setAmbientes([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      (async () => {
        setCarregando(true);
        await carregar();
        if (ativo) setCarregando(false);
      })();
      return () => {
        ativo = false;
      };
    }, [carregar])
  );

  function limparForm() {
    setNome('');
    setLocalizacao('');
    setDescricao('');
    setEditandoId(null);
    setModalVisivel(false);
  }

  function abrirCriacao() {
    limparForm();
    setModalVisivel(true);
  }

  function abrirEdicao(amb: Ambiente) {
    setNome(amb.nome);
    setLocalizacao(amb.localizacao ?? '');
    setDescricao(amb.descricao ?? '');
    setEditandoId(amb.id);
    setModalVisivel(true);
  }

  async function salvar() {
    if (!nome.trim()) {
      Alert.alert('Erro', 'O nome do ambiente é obrigatório.');
      return;
    }
    setSalvando(true);
    try {
      const dados = { nome: nome.trim(), localizacao: localizacao.trim(), descricao: descricao.trim() };
      if (editandoId) {
        await api.updateAmbiente(editandoId, dados);
      } else {
        await api.createAmbiente(dados);
      }
      limparForm();
      await carregar();
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  }

  function excluir(id: string) {
    Alert.alert('Excluir', 'Tem certeza que deseja excluir este ambiente?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteAmbiente(id);
            setAmbientes((prev) => prev.filter((a) => a.id !== id));
          } catch (e) {
            Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível excluir.');
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={estilos.container} edges={['top']}>
      <View style={estilos.cabecalho}>
        <View>
          <Text style={estilos.titulo}>Ambientes</Text>
          <Text style={estilos.subtitulo}>{ambientes.length} ambiente(s) cadastrado(s)</Text>
        </View>
        <TouchableOpacity style={estilos.addBotao} onPress={abrirCriacao} accessibilityLabel="Adicionar ambiente">
          <Ionicons name="add" size={24} color={cores.branco} />
        </TouchableOpacity>
      </View>

      {carregando ? (
        <Carregando texto="Carregando ambientes..." />
      ) : (
        <FlatList
          data={ambientes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={estilos.lista}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={atualizando}
              onRefresh={async () => {
                setAtualizando(true);
                await carregar();
                setAtualizando(false);
              }}
              tintColor={cores.verde}
            />
          }
          ListEmptyComponent={
            <Vazio
              icone="home-outline"
              titulo="Nenhum ambiente cadastrado"
              descricao="Toque em + para adicionar o primeiro ambiente da sua casa."
            />
          }
          renderItem={({ item }) => (
            <View style={estilos.cartao}>
              <View style={estilos.cartaoCabecalho}>
                <View style={estilos.cartaoIcone}>
                  <Ionicons name={iconeAmbiente(item.nome)} size={24} color={cores.verde} />
                </View>
                <View style={estilos.cartaoInfo}>
                  <Text style={estilos.cartaoNome}>{item.nome}</Text>
                  {item.localizacao ? <Text style={estilos.cartaoLocal}>{item.localizacao}</Text> : null}
                </View>
                <View style={estilos.cartaoAcoes}>
                  <TouchableOpacity onPress={() => abrirEdicao(item)} style={estilos.acaoBotao} accessibilityLabel="Editar">
                    <Ionicons name="pencil" size={16} color={cores.verde} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => excluir(item.id)} style={estilos.acaoBotao} accessibilityLabel="Excluir">
                    <Ionicons name="trash" size={16} color={cores.perigo} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={estilos.cartaoStats}>
                <Stat icone="flash" cor={cores.verde} texto={`${Number(item.totalEnergia ?? 0).toFixed(1)} kWh`} />
                <Stat icone="water" cor={cores.agua} texto={`${Number(item.totalAgua ?? 0).toFixed(0)} L`} />
                <Stat
                  icone="document-text-outline"
                  cor={cores.textoSuave}
                  texto={`${item.totalRegistros ?? 0} registros`}
                />
              </View>

              {item.descricao ? <Text style={estilos.cartaoDesc}>{item.descricao}</Text> : null}
            </View>
          )}
        />
      )}

      <Modal visible={modalVisivel} transparent animationType="fade" onRequestClose={limparForm}>
        <KeyboardAvoidingView
          style={estilos.modalFundo}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={estilos.modalCartao}>
            <Text style={estilos.modalTitulo}>{editandoId ? 'Editar Ambiente' : 'Novo Ambiente'}</Text>
            <TextInput
              style={estilos.input}
              placeholder="Nome (ex: Cozinha)"
              placeholderTextColor={cores.textoSuave}
              value={nome}
              onChangeText={setNome}
            />
            <TextInput
              style={estilos.input}
              placeholder="Localização (ex: Térreo)"
              placeholderTextColor={cores.textoSuave}
              value={localizacao}
              onChangeText={setLocalizacao}
            />
            <TextInput
              style={estilos.input}
              placeholder="Descrição (opcional)"
              placeholderTextColor={cores.textoSuave}
              value={descricao}
              onChangeText={setDescricao}
            />
            <View style={estilos.modalBotoes}>
              <Botao titulo="Cancelar" variante="fantasma" onPress={limparForm} estilo={estilos.modalCancelar} />
              <Botao
                titulo={editandoId ? 'Atualizar' : 'Criar'}
                onPress={salvar}
                carregando={salvando}
                estilo={estilos.modalSalvar}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function Stat({ icone, cor, texto }: { icone: keyof typeof Ionicons.glyphMap; cor: string; texto: string }) {
  return (
    <View style={estilos.stat}>
      <Ionicons name={icone} size={14} color={cor} />
      <Text style={estilos.statTexto}>{texto}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  cabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: espacamento.xl,
    paddingTop: espacamento.sm,
    paddingBottom: espacamento.lg,
  },
  titulo: { color: cores.texto, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  subtitulo: { color: cores.textoSuave, fontSize: 13, marginTop: 4 },
  addBotao: {
    backgroundColor: cores.verde,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lista: { paddingHorizontal: espacamento.xl, paddingBottom: 40, gap: espacamento.md },
  cartao: {
    backgroundColor: cores.superficie,
    borderRadius: raio.md,
    borderWidth: 1,
    borderColor: cores.linha,
    padding: espacamento.lg,
  },
  cartaoCabecalho: { flexDirection: 'row', alignItems: 'center' },
  cartaoIcone: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: cores.verdeClaro,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: espacamento.md,
  },
  cartaoInfo: { flex: 1 },
  cartaoNome: { color: cores.texto, fontSize: 16, fontWeight: '700' },
  cartaoLocal: { color: cores.textoSuave, fontSize: 12, marginTop: 2 },
  cartaoAcoes: { flexDirection: 'row', gap: espacamento.md },
  acaoBotao: { padding: 6 },
  cartaoStats: {
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: cores.linha,
    gap: espacamento.xl,
  },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statTexto: { color: cores.textoSuave, fontSize: 13 },
  cartaoDesc: { color: cores.textoSuave, fontSize: 12, marginTop: 10, fontStyle: 'italic' },
  modalFundo: {
    flex: 1,
    backgroundColor: 'rgba(22, 53, 43, 0.45)',
    justifyContent: 'center',
    padding: espacamento.xl,
  },
  modalCartao: {
    backgroundColor: cores.superficie,
    borderRadius: raio.lg,
    padding: espacamento.xl,
  },
  modalTitulo: { color: cores.texto, fontSize: 18, fontWeight: '800', marginBottom: espacamento.lg },
  input: {
    backgroundColor: cores.fundo,
    borderWidth: 1,
    borderColor: cores.linha,
    borderRadius: raio.md,
    paddingHorizontal: espacamento.lg,
    paddingVertical: 13,
    marginBottom: espacamento.md,
    fontSize: 14,
    color: cores.texto,
  },
  modalBotoes: { flexDirection: 'row', justifyContent: 'flex-end', gap: espacamento.md, marginTop: espacamento.sm },
  modalCancelar: { minHeight: 46, paddingVertical: 12 },
  modalSalvar: { minHeight: 46, paddingVertical: 12, minWidth: 110 },
});
