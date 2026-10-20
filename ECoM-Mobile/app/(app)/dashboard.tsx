import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Carregando } from '../../src/components/Carregando';
import { Vazio } from '../../src/components/Vazio';
import { api } from '../../src/services/api';
import { cores, espacamento, raio } from '../../src/styles/theme';
import type { Dashboard as DashboardDados } from '../../src/types';

const LARGURA = Dimensions.get('window').width;

const PERIODOS = [
  { chave: '7', rotulo: '7 dias', dias: 7 },
  { chave: '14', rotulo: '14 dias', dias: 14 },
  { chave: '30', rotulo: '30 dias', dias: 30 },
] as const;

type ChavePeriodo = (typeof PERIODOS)[number]['chave'];

const chartConfigBase = {
  backgroundGradientFrom: cores.superficie,
  backgroundGradientTo: cores.superficie,
  color: (opacity = 1) => `rgba(62, 141, 98, ${opacity})`,
  labelColor: () => cores.textoSuave,
  strokeWidth: 2,
  barPercentage: 0.55,
  decimalPlaces: 1,
  propsForDots: { r: '3', strokeWidth: '2', stroke: cores.verde },
};

const formatar = (valor: number, casas = 2) =>
  Number(valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });

export default function Dashboard() {
  const [dados, setDados] = useState<DashboardDados | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [periodo, setPeriodo] = useState<ChavePeriodo>('7');
  const [erro, setErro] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      (async () => {
        setCarregando(true);
        setErro(false);
        try {
          const resposta = await api.getDashboard();
          if (ativo) setDados(resposta);
        } catch {
          if (ativo) setErro(true);
        } finally {
          if (ativo) setCarregando(false);
        }
      })();
      return () => {
        ativo = false;
      };
    }, [])
  );

  if (carregando) return <Carregando texto="Carregando análises..." />;
  if (erro || !dados) {
    return (
      <SafeAreaView style={estilos.container} edges={['top']}>
        <Cabecalho />
        <Vazio icone="cloud-offline-outline" titulo="Erro ao carregar dados" descricao="Verifique a conexão com a API e tente novamente." />
      </SafeAreaView>
    );
  }

  const dias = PERIODOS.find((p) => p.chave === periodo)?.dias ?? 7;
  const historico = dados.historico.slice(-dias);
  const labels = historico.map((h) => h.dia.slice(8, 10) + '/' + h.dia.slice(5, 7));
  const serieEnergia = historico.map((h) => h.energia);
  const serieAgua = historico.map((h) => h.agua);

  const dadosPizza = [
    { name: 'Energia', valor: dados.totais.energia, cor: cores.verde, legendFontColor: cores.texto, legendFontSize: 12 },
    { name: 'Água', valor: dados.totais.agua, cor: cores.agua, legendFontColor: cores.texto, legendFontSize: 12 },
  ].filter((d) => d.valor > 0);

  const porAmbiente = dados.consumoPorAmbiente;

  return (
    <SafeAreaView style={estilos.container} edges={['top']}>
      <ScrollView contentContainerStyle={estilos.conteudo} showsVerticalScrollIndicator={false}>
        <Cabecalho />

        <View style={estilos.periodoLinha}>
          {PERIODOS.map((p) => (
            <TouchableOpacity
              key={p.chave}
              style={[estilos.periodoBotao, periodo === p.chave && estilos.periodoBotaoAtivo]}
              onPress={() => setPeriodo(p.chave)}
            >
              <Text style={[estilos.periodoTexto, periodo === p.chave && estilos.periodoTextoAtivo]}>{p.rotulo}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={estilos.resumoLinha}>
          <ResumoCard icone="flash" cor={cores.verde} valor={`${formatar(dados.mes.energia)} kWh`} rotulo="Energia (mês)" />
          <ResumoCard icone="water" cor={cores.agua} valor={`${formatar(dados.mes.agua)} L`} rotulo="Água (mês)" />
        </View>
        <View style={estilos.resumoLinha}>
          <ResumoCard icone="cash" cor={cores.verde} valor={`R$ ${formatar(dados.totais.custoEnergia)}`} rotulo="Custo energia" />
          <ResumoCard icone="water" cor={cores.agua} valor={`R$ ${formatar(dados.totais.custoAgua)}`} rotulo="Custo água" />
        </View>

        <View style={estilos.custoCard}>
          <Text style={estilos.custoRotulo}>Custo total acumulado</Text>
          <Text style={estilos.custoValor}>R$ {formatar(dados.totais.custoTotal)}</Text>
          <Text style={estilos.custoSub}>
            Tarifa energia: R$ {dados.tarifas.energia}/kWh · Tarifa água: R$ {dados.tarifas.agua}/m³
          </Text>
        </View>

        {historico.length > 1 && (
          <Grafico titulo={`Energia — últimos ${dias} dias`}>
            <LineChart
              data={{
                labels,
                datasets: [{ data: serieEnergia.length ? serieEnergia : [0] }],
              }}
              width={LARGURA - espacamento.xl * 2 - espacamento.lg * 2}
              height={190}
              chartConfig={chartConfigBase}
              bezier
              style={estilos.grafico}
              fromZero
            />
          </Grafico>
        )}

        {historico.length > 1 && (
          <Grafico titulo={`Água — últimos ${dias} dias`}>
            <LineChart
              data={{
                labels,
                datasets: [{ data: serieAgua.length ? serieAgua : [0] }],
              }}
              width={LARGURA - espacamento.xl * 2 - espacamento.lg * 2}
              height={190}
              chartConfig={{
                ...chartConfigBase,
                color: (opacity = 1) => `rgba(52, 120, 197, ${opacity})`,
                propsForDots: { r: '3', strokeWidth: '2', stroke: cores.agua },
              }}
              bezier
              style={estilos.grafico}
              fromZero
            />
          </Grafico>
        )}

        {dadosPizza.length > 0 && (
          <Grafico titulo="Proporção do consumo (total)">
            <PieChart
              data={dadosPizza}
              width={LARGURA - espacamento.xl * 2 - espacamento.lg * 2}
              height={190}
              chartConfig={chartConfigBase}
              accessor="valor"
              backgroundColor="transparent"
              paddingLeft="15"
              hasLegend
            />
          </Grafico>
        )}

        {porAmbiente.length > 0 && (
          <Grafico titulo="Consumo por ambiente">
            <View style={estilos.legenda}>
              <View style={estilos.legendaItem}>
                <View style={[estilos.legendaPonto, { backgroundColor: cores.verde }]} />
                <Text style={estilos.legendaTexto}>Energia (kWh)</Text>
              </View>
              <View style={estilos.legendaItem}>
                <View style={[estilos.legendaPonto, { backgroundColor: cores.agua }]} />
                <Text style={estilos.legendaTexto}>Água (L)</Text>
              </View>
            </View>
            <BarChart
              data={{
                labels: porAmbiente.map((a) => a.nome.slice(0, 6)),
                datasets: [
                  { data: porAmbiente.map((a) => a.energia), color: () => cores.verde },
                  { data: porAmbiente.map((a) => a.agua), color: () => cores.agua },
                ],
              }}
              width={LARGURA - espacamento.xl * 2 - espacamento.lg * 2}
              height={210}
              chartConfig={chartConfigBase}
              style={estilos.grafico}
              fromZero
              yAxisLabel=""
              yAxisSuffix=""
            />
          </Grafico>
        )}

        <View style={estilos.alertasCard}>
          <View style={estilos.alertasCabecalho}>
            <Text style={estilos.alertasTitulo}>Alertas</Text>
            <View style={estilos.alertasBadge}>
              <Text style={estilos.alertasBadgeTexto}>{dados.alertas.ativos} ativo(s)</Text>
            </View>
          </View>
          {dados.alertasRecentes.length === 0 ? (
            <Text style={estilos.semAlerta}>Nenhum alerta recente.</Text>
          ) : (
            dados.alertasRecentes.slice(0, 5).map((a) => (
              <View key={a.id} style={estilos.alertaLinha}>
                <View
                  style={[
                    estilos.alertaPonto,
                    {
                      backgroundColor:
                        a.nivel === 'critico' ? cores.perigo : a.nivel === 'alerta' ? cores.alerta : cores.verde,
                    },
                  ]}
                />
                <Text style={estilos.alertaMensagem} numberOfLines={1}>
                  {a.mensagem}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Cabecalho() {
  return (
    <View style={estilos.cabecalho}>
      <Text style={estilos.titulo}>Análises</Text>
      <Text style={estilos.subtitulo}>Visão geral do consumo</Text>
    </View>
  );
}

function ResumoCard({ icone, cor, valor, rotulo }: { icone: keyof typeof Ionicons.glyphMap; cor: string; valor: string; rotulo: string }) {
  return (
    <View style={[estilos.resumoCard, { borderLeftColor: cor }]}>
      <Ionicons name={icone} size={20} color={cor} />
      <Text style={estilos.resumoValor}>{valor}</Text>
      <Text style={estilos.resumoRotulo}>{rotulo}</Text>
    </View>
  );
}

function Grafico({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <View style={estilos.graficoCard}>
      <Text style={estilos.graficoTitulo}>{titulo}</Text>
      {children}
    </View>
  );
}

const estilos = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espacamento.xl, paddingBottom: 40 },
  cabecalho: { marginTop: espacamento.sm, marginBottom: espacamento.lg },
  titulo: { color: cores.texto, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  subtitulo: { color: cores.textoSuave, fontSize: 14, marginTop: 4 },
  periodoLinha: { flexDirection: 'row', gap: espacamento.sm, marginBottom: espacamento.lg },
  periodoBotao: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: raio.redondo,
    backgroundColor: cores.superficie,
    borderWidth: 1,
    borderColor: cores.linha,
  },
  periodoBotaoAtivo: { backgroundColor: cores.verde, borderColor: cores.verde },
  periodoTexto: { color: cores.textoSuave, fontSize: 13, fontWeight: '600' },
  periodoTextoAtivo: { color: cores.branco },
  resumoLinha: { flexDirection: 'row', gap: espacamento.md, marginBottom: espacamento.md },
  resumoCard: {
    flex: 1,
    backgroundColor: cores.superficie,
    borderRadius: raio.md,
    padding: 14,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: cores.linha,
  },
  resumoValor: { color: cores.texto, fontSize: 17, fontWeight: '800', marginTop: 6 },
  resumoRotulo: { color: cores.textoSuave, fontSize: 12, marginTop: 2 },
  custoCard: {
    backgroundColor: cores.floresta,
    borderRadius: raio.lg,
    padding: 20,
    alignItems: 'center',
    marginBottom: espacamento.lg,
  },
  custoRotulo: { color: '#B9CCC0', fontSize: 13 },
  custoValor: { color: cores.branco, fontSize: 32, fontWeight: '800', marginTop: 4 },
  custoSub: { color: '#8FA89C', fontSize: 11, marginTop: 8, textAlign: 'center' },
  graficoCard: {
    backgroundColor: cores.superficie,
    borderRadius: raio.md,
    padding: espacamento.lg,
    marginBottom: espacamento.lg,
    borderWidth: 1,
    borderColor: cores.linha,
  },
  graficoTitulo: { color: cores.texto, fontSize: 15, fontWeight: '700', marginBottom: espacamento.md },
  legenda: { flexDirection: 'row', gap: espacamento.lg, marginBottom: espacamento.md },
  legendaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendaPonto: { width: 10, height: 10, borderRadius: 5 },
  legendaTexto: { color: cores.textoSuave, fontSize: 12 },
  grafico: { borderRadius: raio.sm },
  alertasCard: {
    backgroundColor: cores.superficie,
    borderRadius: raio.md,
    padding: espacamento.lg,
    marginBottom: espacamento.lg,
    borderWidth: 1,
    borderColor: cores.linha,
  },
  alertasCabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: espacamento.md,
  },
  alertasTitulo: { color: cores.texto, fontSize: 15, fontWeight: '700' },
  alertasBadge: { backgroundColor: cores.perigoClaro, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  alertasBadgeTexto: { color: cores.perigo, fontSize: 12, fontWeight: '600' },
  semAlerta: { color: cores.verde, fontSize: 14 },
  alertaLinha: { flexDirection: 'row', alignItems: 'center', marginVertical: 6, gap: espacamento.md },
  alertaPonto: { width: 8, height: 8, borderRadius: 4 },
  alertaMensagem: { color: cores.textoSuave, fontSize: 13, flex: 1 },
});
