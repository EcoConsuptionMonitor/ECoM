import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Carregando } from '../../src/components/Carregando';
import { Vazio } from '../../src/components/Vazio';
import { api } from '../../src/services/api';
import { cores, espacamento, raio } from '../../src/styles/theme';
import type { Alerta, NivelAlerta } from '../../src/types';

const CORES_NIVEL: Record<NivelAlerta, { cor: string; fundo: string; rotulo: string; icone: keyof typeof Ionicons.glyphMap }> = {
  critico: { cor: cores.perigo, fundo: cores.perigoClaro, rotulo: 'Crítico', icone: 'warning' },
  alerta: { cor: cores.alerta, fundo: cores.alertaClaro, rotulo: 'Alerta', icone: 'alert-circle' },
  info: { cor: cores.verde, fundo: cores.verdeClaro, rotulo: 'Info', icone: 'information-circle' },
};

export default function Alertas() {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [enviando, setEnviando] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      const dados = await api.getAlertas();
      setAlertas(dados);
    } catch {
      setAlertas([]);
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

  async function marcarLido(alerta: Alerta) {
    if (alerta.lido) return;
    setEnviando(alerta.id);
    try {
      const atualizado = await api.marcarAlertaLido(alerta.id);
      setAlertas((prev) => prev.map((a) => (a.id === atualizado.id ? atualizado : a)));
    } catch (e) {
      Alert.alert('Ops', e instanceof Error ? e.message : 'Não foi possível marcar como lido.');
    } finally {
      setEnviando(null);
    }
  }

  const naoLidos = alertas.filter((a) => !a.lido).length;

  return (
    <SafeAreaView style={estilos.container} edges={['top']}>
      <View style={estilos.cabecalho}>
        <Text style={estilos.titulo}>Alertas</Text>
        <Text style={estilos.subtitulo}>
          {naoLidos > 0 ? `${naoLidos} não lido${naoLidos > 1 ? 's' : ''}` : 'Tudo em dia'}
        </Text>
      </View>

      {carregando ? (
        <Carregando texto="Carregando alertas..." />
      ) : (
        <FlatList
          data={alertas}
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
              icone="notifications-off-outline"
              titulo="Nenhum alerta"
              descricao="Quando o consumo sair do padrão, avisaremos você aqui."
            />
          }
          renderItem={({ item }) => {
            const nivel = CORES_NIVEL[item.nivel] ?? CORES_NIVEL.info;
            const origem = item.tipo === 'agua' ? 'Água' : item.tipo === 'energia' ? 'Energia' : 'Sistema';
            return (
              <View style={[estilos.item, { borderLeftColor: nivel.cor }]}>
                <View style={[estilos.itemIcone, { backgroundColor: nivel.fundo }]}>
                  <Ionicons name={nivel.icone} size={20} color={nivel.cor} />
                </View>
                <View style={estilos.itemTexto}>
                  <Text style={estilos.itemMensagem}>{item.mensagem}</Text>
                  <Text style={estilos.itemMeta}>
                    {nivel.rotulo} · {origem} · {new Date(item.data).toLocaleDateString('pt-BR')}
                  </Text>
                </View>
                {!item.lido ? (
                  <TouchableOpacity
                    style={estilos.lidoBotao}
                    onPress={() => marcarLido(item)}
                    disabled={enviando === item.id}
                  >
                    <Text style={estilos.lidoTexto}>{enviando === item.id ? '...' : 'Lido'}</Text>
                  </TouchableOpacity>
                ) : (
                  <Ionicons name="checkmark-circle" size={20} color={cores.verde} />
                )}
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  cabecalho: { paddingHorizontal: espacamento.xl, paddingTop: espacamento.sm, paddingBottom: espacamento.lg },
  titulo: { color: cores.texto, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  subtitulo: { color: cores.textoSuave, fontSize: 14, marginTop: 4 },
  lista: { paddingHorizontal: espacamento.xl, paddingBottom: 40, gap: espacamento.md },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacamento.md,
    backgroundColor: cores.superficie,
    borderRadius: raio.md,
    borderWidth: 1,
    borderColor: cores.linha,
    borderLeftWidth: 4,
    padding: espacamento.lg,
  },
  itemIcone: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  itemTexto: { flex: 1 },
  itemMensagem: { color: cores.texto, fontSize: 13.5, fontWeight: '600', lineHeight: 19 },
  itemMeta: { color: cores.textoSuave, fontSize: 11.5, marginTop: 4 },
  lidoBotao: {
    backgroundColor: cores.verdeClaro,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: raio.redondo,
  },
  lidoTexto: { color: cores.verde, fontSize: 12, fontWeight: '700' },
});
