import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, TextInput, Alert, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Entypo from '@expo/vector-icons/Entypo';
import { api } from '../../services/api';
import { getToken } from '../../services/session';

export default function Environments() {
  const [ambientes, setAmbientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalCriar, setModalCriar] = useState(false);
  const [editando, setEditando] = useState(null);
  const [nome, setNome] = useState('');
  const [localizacao, setLocalizacao] = useState('');
  const [descricao, setDescricao] = useState('');
  const [salvando, setSalvando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      carregar();
      return () => { ativo = false; };

      async function carregar() {
        setCarregando(true);
        try {
          const token = getToken();
          const data = await api('/ambientes', { token });
          if (ativo) setAmbientes(data);
        } catch {
          if (ativo) setAmbientes([]);
        } finally {
          if (ativo) setCarregando(false);
        }
      }
    }, [])
  );

  function limparForm() {
    setNome('');
    setLocalizacao('');
    setDescricao('');
    setEditando(null);
    setModalCriar(false);
  }

  function abrirEdicao(amb) {
    setNome(amb.nome);
    setLocalizacao(amb.localizacao || '');
    setDescricao(amb.descricao || '');
    setEditando(amb.id);
    setModalCriar(true);
  }

  async function salvar() {
    if (!nome.trim()) {
      Alert.alert('Erro', 'O nome do ambiente é obrigatório.');
      return;
    }
    setSalvando(true);
    try {
      const token = getToken();
      const body = { nome: nome.trim(), localizacao: localizacao.trim(), descricao: descricao.trim() };
      if (editando) {
        await api(`/ambientes/${editando}`, { method: 'PATCH', token, body });
      } else {
        await api('/ambientes', { method: 'POST', token, body });
      }
      limparForm();
      const data = await api('/ambientes', { token });
      setAmbientes(data);
    } catch (e) {
      Alert.alert('Erro', e.message);
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(id) {
    Alert.alert('Excluir', 'Tem certeza que deseja excluir este ambiente?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = getToken();
            await api(`/ambientes/${id}`, { method: 'DELETE', token });
            setAmbientes((prev) => prev.filter((a) => a.id !== id));
          } catch (e) {
            Alert.alert('Erro', e.message);
          }
        },
      },
    ]);
  }

  const iconeAmbiente = (nome) => {
    const n = nome.toLowerCase();
    if (n.includes('quarto') || n.includes('bedroom')) return 'bed';
    if (n.includes('cozinha') || n.includes('kitchen')) return 'bowl';
    if (n.includes('banheiro') || n.includes('bath')) return 'water';
    if (n.includes('sala') || n.includes('living')) return 'tv';
    if (n.includes('lavanderia') || n.includes('laundry')) return 'laundry';
    if (n.includes('jardim') || n.includes('garden')) return 'flower';
    return 'home';
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.titulo}>Ambientes</Text>
          <Text style={styles.subtitulo}>{ambientes.length} ambiente(s) cadastrado(s)</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => limparForm()}>
          <Ionicons name="add" size={24} color="#1e2d27" />
        </TouchableOpacity>
      </View>

      {carregando ? (
        <View style={styles.loading}>
          <ActivityIndicator color="#c8ff00" size="large" />
        </View>
      ) : (
        <>
          {modalCriar && (
            <View style={styles.formCard}>
              <Text style={styles.formTitulo}>{editando ? 'Editar Ambiente' : 'Novo Ambiente'}</Text>
              <TextInput
                style={styles.input}
                placeholder="Nome (ex: Cozinha)"
                placeholderTextColor="#666"
                value={nome}
                onChangeText={setNome}
              />
              <TextInput
                style={styles.input}
                placeholder="Localização (ex: Térreo)"
                placeholderTextColor="#666"
                value={localizacao}
                onChangeText={setLocalizacao}
              />
              <TextInput
                style={styles.input}
                placeholder="Descrição (opcional)"
                placeholderTextColor="#666"
                value={descricao}
                onChangeText={setDescricao}
              />
              <View style={styles.formBtns}>
                <TouchableOpacity style={styles.cancelarBtn} onPress={limparForm}>
                  <Text style={styles.cancelarText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.salvarBtn} onPress={salvar} disabled={salvando}>
                  {salvando ? (
                    <ActivityIndicator color="#1e2d27" />
                  ) : (
                    <Text style={styles.salvarText}>{editando ? 'Atualizar' : 'Criar'}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {ambientes.length === 0 ? (
            <View style={styles.vazio}>
              <Ionicons name="home-outline" size={60} color="#444" />
              <Text style={styles.vazioText}>Nenhum ambiente cadastrado.</Text>
              <Text style={styles.vazioSub}>Toque em + para adicionar um ambiente.</Text>
            </View>
          ) : (
            ambientes.map((amb) => (
              <View key={amb.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardIcon}>
                    <Entypo name={iconeAmbiente(amb.nome)} size={24} color="#c8ff00" />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardNome}>{amb.nome}</Text>
                    {amb.localizacao ? <Text style={styles.cardLocal}>{amb.localizacao}</Text> : null}
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity onPress={() => abrirEdicao(amb)} style={styles.actionBtn}>
                      <Ionicons name="pencil" size={16} color="#c8ff00" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => excluir(amb.id)} style={styles.actionBtn}>
                      <Ionicons name="trash" size={16} color="#ff5252" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.cardStats}>
                  <View style={styles.stat}>
                    <Entypo name="flash" size={14} color="#c8ff00" />
                    <Text style={styles.statText}>{amb.totalEnergia} kWh</Text>
                  </View>
                  <View style={styles.stat}>
                    <Entypo name="drop" size={14} color="#1385ef" />
                    <Text style={styles.statText}>{amb.totalAgua} L</Text>
                  </View>
                  <View style={styles.stat}>
                    <Ionicons name="document-text-outline" size={14} color="#888" />
                    <Text style={styles.statText}>{amb.totalRegistros} registros</Text>
                  </View>
                </View>

                {amb.descricao ? <Text style={styles.cardDesc}>{amb.descricao}</Text> : null}
              </View>
            ))
          )}
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e2d27',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
  },
  titulo: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitulo: {
    color: '#8cf75f',
    fontSize: 13,
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: '#c8ff00',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loading: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  formCard: {
    backgroundColor: '#000',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  formTitulo: {
    color: '#c8ff00',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 14,
  },
  formBtns: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 4,
  },
  cancelarBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#444',
  },
  cancelarText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  salvarBtn: {
    backgroundColor: '#c8ff00',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  salvarText: {
    color: '#1e2d27',
    fontSize: 14,
    fontWeight: 'bold',
  },
  vazio: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  vazioText: {
    color: '#888',
    fontSize: 16,
    marginTop: 16,
  },
  vazioSub: {
    color: '#555',
    fontSize: 13,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#000',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1e2d27',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardNome: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardLocal: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    padding: 6,
  },
  cardStats: {
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#222',
    gap: 20,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    color: '#ccc',
    fontSize: 13,
  },
  cardDesc: {
    color: '#666',
    fontSize: 12,
    marginTop: 10,
    fontStyle: 'italic',
  },
});
