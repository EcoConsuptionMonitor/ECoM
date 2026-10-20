import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../src/services/api';
import { cores, espacamento, raio } from '../../src/styles/theme';
import type { Ambiente, TipoConsumo } from '../../src/types';

interface Dispositivo {
  id: string;
  nome: string;
  icone: keyof typeof Ionicons.glyphMap;
  tipo: TipoConsumo;
  potencia?: number;
  vazao?: number;
  ligado: boolean;
}

const DISPOSITIVOS_PADRAO: Dispositivo[] = [
  { id: 'lampada_sala', nome: 'Lâmpada Sala', icone: 'bulb-outline', tipo: 'energia', potencia: 15, ligado: false },
  { id: 'lampada_quarto', nome: 'Lâmpada Quarto', icone: 'bulb-outline', tipo: 'energia', potencia: 15, ligado: false },
  { id: 'lampada_cozinha', nome: 'Lâmpada Cozinha', icone: 'bulb-outline', tipo: 'energia', potencia: 20, ligado: false },
  { id: 'tomada_tv', nome: 'TV', icone: 'tv-outline', tipo: 'energia', potencia: 100, ligado: false },
  { id: 'tomada_geladeira', nome: 'Geladeira', icone: 'snow-outline', tipo: 'energia', potencia: 150, ligado: false },
  { id: 'chuveiro', nome: 'Chuveiro', icone: 'flame-outline', tipo: 'energia', potencia: 5500, ligado: false },
  { id: 'torneira_cozinha', nome: 'Torneira Cozinha', icone: 'water-outline', tipo: 'agua', vazao: 8, ligado: false },
  { id: 'torneira_banheiro', nome: 'Torneira Banheiro', icone: 'water-outline', tipo: 'agua', vazao: 6, ligado: false },
  { id: 'maquina_lavar', nome: 'Máquina de Lavar', icone: 'shirt-outline', tipo: 'agua', vazao: 50, ligado: false },
];

export default function Controles() {
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>(DISPOSITIVOS_PADRAO);
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [ambienteId, setAmbienteId] = useState<string | null>(null);
  const [tarifas, setTarifas] = useState({ agua: 5.82, energia: 0.65 });
  const [enviando, setEnviando] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      (async () => {
        try {
          const [listaAmbientes, dashboard] = await Promise.all([api.getAmbientes(), api.getDashboard()]);
          if (!ativo) return;
          setAmbientes(listaAmbientes);
          setTarifas(dashboard.tarifas);
          setAmbienteId((atual) => atual ?? listaAmbientes[0]?.id ?? null);
        } catch {
          if (ativo) setAmbientes([]);
        }
      })();
      return () => {
        ativo = false;
      };
    }, [])
  );

  const consumoTempoReal = dispositivos.reduce(
    (acc, d) => {
      if (!d.ligado) return acc;
      if (d.tipo === 'energia') acc.energia += d.potencia ?? 0;
      else acc.agua += d.vazao ?? 0;
      return acc;
    },
    { energia: 0, agua: 0 }
  );

  function alternarDispositivo(id: string) {
    setDispositivos((prev) => prev.map((d) => (d.id === id ? { ...d, ligado: !d.ligado } : d)));
  }

  async function enviarLeitura(dispositivo: Dispositivo) {
    if (!ambienteId) {
      Alert.alert('Crie um ambiente', 'Cadastre ao menos um ambiente antes de enviar uma leitura.');
      return;
    }
    setEnviando(dispositivo.id);
    try {
      const valor =
        dispositivo.tipo === 'energia' ? (dispositivo.potencia ?? 0) / 60000 : dispositivo.vazao ?? 0;
      await api.enviarSensor({
        ambienteId,
        tipo: dispositivo.tipo,
        valor,
        unidade: dispositivo.tipo === 'energia' ? 'kWh' : 'L',
        potencia: dispositivo.tipo === 'energia' ? dispositivo.potencia : undefined,
        corrente: dispositivo.tipo === 'energia' ? Number(((dispositivo.potencia ?? 0) / 127).toFixed(2)) : undefined,
        tensao: dispositivo.tipo === 'energia' ? 127 : undefined,
      });
      Alert.alert('Registrado', `Leitura de "${dispositivo.nome}" enviada com sucesso.`);
    } catch (e) {
      Alert.alert('Leitura não enviada', e instanceof Error ? e.message : 'Verifique a conexão com a API.');
    } finally {
      setEnviando(null);
    }
  }

  const custoHoraEnergia = (consumoTempoReal.energia / 1000) * tarifas.energia;
  const custoHoraAgua = ((consumoTempoReal.agua * 60) / 1000) * tarifas.agua;
  const dispositivosLigados = dispositivos.filter((d) => d.ligado);

  return (
    <SafeAreaView style={estilos.container} edges={['top']}>
      <ScrollView contentContainerStyle={estilos.conteudo} showsVerticalScrollIndicator={false}>
        <Text style={estilos.titulo}>Controles</Text>
        <Text style={estilos.subtitulo}>Simule o consumo da mini-residência</Text>

        <View style={estilos.statusBar}>
          <View style={estilos.statusItem}>
            <Ionicons name="flash" size={18} color={cores.verde} />
            <Text style={estilos.statusValor}>{consumoTempoReal.energia} W</Text>
            <Text style={estilos.statusLabel}>Energia ativa</Text>
          </View>
          <View style={estilos.statusDivisor} />
          <View style={estilos.statusItem}>
            <Ionicons name="water" size={18} color={cores.agua} />
            <Text style={estilos.statusValor}>{consumoTempoReal.agua} L/min</Text>
            <Text style={estilos.statusLabel}>Água ativa</Text>
          </View>
        </View>

        <View style={estilos.custoBarra}>
          <Text style={estilos.custoTexto}>Custo/hora estimado: R$ {(custoHoraEnergia + custoHoraAgua).toFixed(4)}</Text>
        </View>

        <Text style={estilos.secaoTitulo}>Ambiente de destino</Text>
        {ambientes.length === 0 ? (
          <View style={estilos.semAmbiente}>
            <Ionicons name="grid-outline" size={18} color={cores.alerta} />
            <Text style={estilos.semAmbienteTexto}>
              Nenhum ambiente cadastrado — crie um em Ambientes para registrar leituras.
            </Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.pilhaAmbientes}>
            {ambientes.map((amb) => {
              const ativo = amb.id === ambienteId;
              return (
                <TouchableOpacity
                  key={amb.id}
                  style={[estilos.ambienteChip, ativo && estilos.ambienteChipAtivo]}
                  onPress={() => setAmbienteId(amb.id)}
                >
                  <Text style={[estilos.ambienteChipTexto, ativo && estilos.ambienteChipTextoAtivo]}>{amb.nome}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        <Secao titulo="Energia Elétrica" tipo="energia" dispositivos={dispositivos} alternar={alternarDispositivo} enviando={enviando} enviar={enviarLeitura} />
        <Secao titulo="Água" tipo="agua" dispositivos={dispositivos} alternar={alternarDispositivo} enviando={enviando} enviar={enviarLeitura} />

        {dispositivosLigados.length > 0 && (
          <View style={estilos.resumoCartao}>
            <Text style={estilos.resumoTitulo}>Dispositivos ligados</Text>
            {dispositivosLigados.map((d) => (
              <View key={d.id} style={estilos.resumoLinha}>
                <Text style={estilos.resumoNome}>{d.nome}</Text>
                <Text style={estilos.resumoValor}>
                  {d.tipo === 'energia' ? `${d.potencia}W` : `${d.vazao} L/min`}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Secao({
  titulo,
  tipo,
  dispositivos,
  alternar,
  enviando,
  enviar,
}: {
  titulo: string;
  tipo: TipoConsumo;
  dispositivos: Dispositivo[];
  alternar: (id: string) => void;
  enviando: string | null;
  enviar: (d: Dispositivo) => void;
}) {
  const cor = tipo === 'energia' ? cores.verde : cores.agua;
  const lista = dispositivos.filter((d) => d.tipo === tipo);

  return (
    <View style={estilos.secao}>
      <Text style={estilos.secaoTitulo}>{titulo}</Text>
      {lista.map((disp) => (
        <View key={disp.id} style={[estilos.dispCartao, disp.ligado && { borderColor: `${cor}66` }]}>
          <View style={estilos.dispCabecalho}>
            <View style={estilos.dispIcone}>
              <Ionicons name={disp.icone} size={22} color={disp.ligado ? cor : cores.textoSuave} />
            </View>
            <View style={estilos.dispInfo}>
              <Text style={estilos.dispNome}>{disp.nome}</Text>
              <Text style={estilos.dispPotencia}>
                {disp.tipo === 'energia' ? `${disp.potencia}W` : `${disp.vazao} L/min`}
              </Text>
            </View>
            <Switch
              value={disp.ligado}
              onValueChange={() => alternar(disp.id)}
              trackColor={{ false: cores.linha, true: `${cor}40` }}
              thumbColor={disp.ligado ? cor : '#9AA8A2'}
            />
          </View>
          {disp.ligado && (
            <TouchableOpacity
              style={[estilos.enviarBotao, { backgroundColor: cor }]}
              onPress={() => enviar(disp)}
              disabled={enviando === disp.id}
            >
              {enviando === disp.id ? (
                <ActivityIndicator color={cores.branco} size="small" />
              ) : (
                <Text style={estilos.enviarTexto}>Registrar 1 min de consumo</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espacamento.xl, paddingBottom: 40 },
  titulo: { color: cores.texto, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  subtitulo: { color: cores.textoSuave, fontSize: 13, marginTop: 4, marginBottom: espacamento.lg },
  statusBar: {
    flexDirection: 'row',
    backgroundColor: cores.superficie,
    borderRadius: raio.md,
    padding: espacamento.lg,
    borderWidth: 1,
    borderColor: cores.linha,
    marginBottom: espacamento.md,
  },
  statusItem: { flex: 1, alignItems: 'center' },
  statusDivisor: { width: 1, backgroundColor: cores.linha, marginVertical: 4 },
  statusValor: { color: cores.texto, fontSize: 18, fontWeight: '800', marginTop: 4 },
  statusLabel: { color: cores.textoSuave, fontSize: 11, marginTop: 2 },
  custoBarra: {
    backgroundColor: cores.verdeClaro,
    borderRadius: raio.sm,
    padding: 12,
    alignItems: 'center',
    marginBottom: espacamento.xl,
  },
  custoTexto: { color: cores.verde, fontSize: 13.5, fontWeight: '700' },
  semAmbiente: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacamento.sm,
    backgroundColor: cores.alertaClaro,
    borderRadius: raio.sm,
    padding: espacamento.md,
    marginBottom: espacamento.lg,
  },
  semAmbienteTexto: { color: cores.alerta, fontSize: 12.5, flex: 1, lineHeight: 18 },
  pilhaAmbientes: { gap: espacamento.sm, paddingBottom: espacamento.lg },
  ambienteChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: raio.redondo,
    backgroundColor: cores.superficie,
    borderWidth: 1,
    borderColor: cores.linha,
  },
  ambienteChipAtivo: { backgroundColor: cores.floresta, borderColor: cores.floresta },
  ambienteChipTexto: { color: cores.textoSuave, fontSize: 13, fontWeight: '600' },
  ambienteChipTextoAtivo: { color: cores.branco },
  secao: { marginBottom: espacamento.xl },
  secaoTitulo: { color: cores.texto, fontSize: 16, fontWeight: '800', marginBottom: espacamento.md },
  dispCartao: {
    backgroundColor: cores.superficie,
    borderRadius: raio.md,
    borderWidth: 1,
    borderColor: cores.linha,
    padding: 14,
    marginBottom: espacamento.md,
  },
  dispCabecalho: { flexDirection: 'row', alignItems: 'center' },
  dispIcone: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: cores.fundo,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: espacamento.md,
  },
  dispInfo: { flex: 1 },
  dispNome: { color: cores.texto, fontSize: 15, fontWeight: '600' },
  dispPotencia: { color: cores.textoSuave, fontSize: 12, marginTop: 2 },
  enviarBotao: { borderRadius: raio.sm, paddingVertical: 9, alignItems: 'center', marginTop: 10 },
  enviarTexto: { color: cores.branco, fontSize: 13, fontWeight: '700' },
  resumoCartao: {
    backgroundColor: cores.superficie,
    borderRadius: raio.md,
    borderWidth: 1,
    borderColor: cores.linha,
    padding: espacamento.lg,
    marginBottom: espacamento.lg,
  },
  resumoTitulo: { color: cores.texto, fontSize: 14, fontWeight: '800', marginBottom: espacamento.md },
  resumoLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: cores.linha,
  },
  resumoNome: { color: cores.textoSuave, fontSize: 13 },
  resumoValor: { color: cores.verde, fontSize: 13, fontWeight: '700' },
});
