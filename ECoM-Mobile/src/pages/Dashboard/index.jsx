import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { api } from '../../services/api';
import { getToken } from '../../services/session';

const LARGURA = Dimensions.get('window').width;

const chartConfig = {
  backgroundGradientFrom: '#000',
  backgroundGradientTo: '#1a1a1a',
  color: (opacity = 1) => `rgba(200, 255, 0, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.5,
  decimalPlaces: 0,
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: '#c8ff00',
  },
};

export default function Dashboard() {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [periodo, setPeriodo] = useState('mes');

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      const token = getToken();

      async function carregar() {
        setCarregando(true);
        try {
          const data = await api('/dashboard', { token });
          if (ativo) setDados(data);
        } catch {
          if (ativo) setDados(null);
        } finally {
          if (ativo) setCarregando(false);
        }
      }

      carregar();
      return () => { ativo = false; };
    }, [])
  );

  if (carregando) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#c8ff00" size="large" />
      </View>
    );
  }

  if (!dados) {
    return (
      <View style={styles.loading}>
        <Text style={styles.erroText}>Erro ao carregar dados.</Text>
      </View>
    );
  }

  const labelsHistorico = dados.historico.map((h) => h.dia.slice(5, 10));
  const dadosEnergia = dados.historico.map((h) => h.energia);
  const dadosAgua = dados.historico.map((h) => h.agua);

  const dadosPizza = [
    { name: 'Energia', valor: dados.totais.energia, cor: '#c8ff00', legendFontColor: '#fff', legendFontSize: 12 },
    { name: 'Água', valor: dados.totais.agua, cor: '#1385ef', legendFontColor: '#fff', legendFontSize: 12 },
  ].filter((d) => d.valor > 0);

  const dadosBarras = dados.consumoPorAmbiente.map((a) => ({
    nome: a.nome,
    agua: a.agua,
    energia: a.energia,
  }));

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Dashboard</Text>
        <Text style={styles.subtitulo}>Visão geral do consumo</Text>
      </View>

      <View style={styles.periodoRow}>
        {['semana', 'mes', 'ano'].map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodoBtn, periodo === p && styles.periodoBtnAtivo]}
            onPress={() => setPeriodo(p)}
          >
            <Text style={[styles.periodoText, periodo === p && styles.periodoTextAtivo]}>
              {p === 'semana' ? '7 dias' : p === 'mes' ? 'Mês' : 'Ano'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.resumoRow}>
        <View style={[styles.resumoCard, { borderLeftColor: '#c8ff00' }]}>
          <Ionicons name="flash" size={20} color="#c8ff00" />
          <Text style={styles.resumoValor}>{dados.mes.energia} kWh</Text>
          <Text style={styles.resumoLabel}>Energia (mês)</Text>
        </View>
        <View style={[styles.resumoCard, { borderLeftColor: '#1385ef' }]}>
          <Ionicons name="water" size={20} color="#1385ef" />
          <Text style={styles.resumoValor}>{dados.mes.agua} L</Text>
          <Text style={styles.resumoLabel}>Água (mês)</Text>
        </View>
      </View>

      <View style={styles.resumoRow}>
        <View style={[styles.resumoCard, { borderLeftColor: '#69f0ae' }]}>
          <Ionicons name="cash" size={20} color="#69f0ae" />
          <Text style={styles.resumoValor}>R$ {dados.totais.custoEnergia}</Text>
          <Text style={styles.resumoLabel}>Custo energia</Text>
        </View>
        <View style={[styles.resumoCard, { borderLeftColor: '#42a5f5' }]}>
          <Ionicons name="water" size={20} color="#42a5f5" />
          <Text style={styles.resumoValor}>R$ {dados.totais.custoAgua}</Text>
          <Text style={styles.resumoLabel}>Custo água</Text>
        </View>
      </View>

      <View style={styles.custoCard}>
        <Text style={styles.custoLabel}>Custo Total do Mês</Text>
        <Text style={styles.custoValor}>R$ {dados.totais.custoTotal}</Text>
        <Text style={styles.custoSub}>
          Tarifa energia: R$ {dados.tarifas.energia}/kWh | Tarifa água: R$ {dados.tarifas.agua}/m³
        </Text>
      </View>

      {dados.historico.length > 0 && (
        <View style={styles.graficoCard}>
          <Text style={styles.graficoTitulo}>Consumo de Energia</Text>
          <LineChart
            data={{
              labels: labelsHistorico.slice(-7),
              datasets: [{ data: dadosEnergia.slice(-7).length > 0 ? dadosEnergia.slice(-7) : [0] }],
            }}
            width={LARGURA - 48}
            height={200}
            chartConfig={chartConfig}
            bezier
            style={styles.grafico}
          />
        </View>
      )}

      {dados.historico.length > 0 && (
        <View style={styles.graficoCard}>
          <Text style={styles.graficoTitulo}>Consumo de Água</Text>
          <LineChart
            data={{
              labels: labelsHistorico.slice(-7),
              datasets: [{ data: dadosAgua.slice(-7).length > 0 ? dadosAgua.slice(-7) : [0] }],
            }}
            width={LARGURA - 48}
            height={200}
            chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(19, 133, 239, ${opacity})`, propsForDots: { stroke: '#1385ef' } }}
            bezier
            style={styles.grafico}
          />
        </View>
      )}

      {dadosPizza.length > 0 && (
        <View style={styles.graficoCard}>
          <Text style={styles.graficoTitulo}>Proporção do Consumo</Text>
          <PieChart
            data={dadosPizza}
            width={LARGURA - 48}
            height={200}
            chartConfig={chartConfig}
            accessor="valor"
            backgroundColor="transparent"
            paddingLeft="15"
          />
        </View>
      )}

      {dadosBarras.length > 0 && (
        <View style={styles.graficoCard}>
          <Text style={styles.graficoTitulo}>Consumo por Ambiente</Text>
          <BarChart
            data={{
              labels: dadosBarras.map((d) => d.nome.slice(0, 6)),
              datasets: [
                { data: dadosBarras.map((d) => d.energia), color: () => '#c8ff00' },
                { data: dadosBarras.map((d) => d.agua), color: () => '#1385ef' },
              ],
              legend: ['Energia', 'Água'],
            }}
            width={LARGURA - 48}
            height={220}
            chartConfig={chartConfig}
            style={styles.grafico}
          />
        </View>
      )}

      <View style={styles.alertasCard}>
        <View style={styles.alertasHeader}>
          <Text style={styles.alertasTitulo}>Alertas</Text>
          <View style={styles.alertasBadge}>
            <Text style={styles.alertasBadgeText}>{dados.alertas.ativos} ativo(s)</Text>
          </View>
        </View>
        {dados.alertasRecentes.length === 0 ? (
          <Text style={styles.semAlerta}>Nenhum alerta recente.</Text>
        ) : (
          dados.alertasRecentes.slice(0, 5).map((a) => (
            <View key={a.id} style={styles.alertaLinha}>
              <View style={[styles.alertaDot, { backgroundColor: a.nivel === 'critico' ? '#ff5252' : a.nivel === 'alerta' ? '#ffc107' : '#69f0ae' }]} />
              <Text style={styles.alertaMensagem} numberOfLines={1}>{a.mensagem}</Text>
            </View>
          ))
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e2d27',
  },
  loading: {
    flex: 1,
    backgroundColor: '#1e2d27',
    alignItems: 'center',
    justifyContent: 'center',
  },
  erroText: {
    color: '#fff',
    fontSize: 16,
  },
  header: {
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
    fontSize: 14,
    marginTop: 4,
  },
  periodoRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  periodoBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#000',
  },
  periodoBtnAtivo: {
    backgroundColor: '#c8ff00',
  },
  periodoText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
  },
  periodoTextAtivo: {
    color: '#1e2d27',
  },
  resumoRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },
  resumoCard: {
    flex: 1,
    backgroundColor: '#000',
    borderRadius: 16,
    padding: 14,
    borderLeftWidth: 3,
  },
  resumoValor: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 6,
  },
  resumoLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  custoCard: {
    backgroundColor: '#000',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  custoLabel: {
    color: '#888',
    fontSize: 14,
  },
  custoValor: {
    color: '#c8ff00',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 4,
  },
  custoSub: {
    color: '#666',
    fontSize: 11,
    marginTop: 8,
    textAlign: 'center',
  },
  graficoCard: {
    backgroundColor: '#000',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  graficoTitulo: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  grafico: {
    borderRadius: 12,
  },
  alertasCard: {
    backgroundColor: '#000',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  alertasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertasTitulo: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  alertasBadge: {
    backgroundColor: '#ff525230',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  alertasBadgeText: {
    color: '#ff5252',
    fontSize: 12,
    fontWeight: '600',
  },
  semAlerta: {
    color: '#69f0ae',
    fontSize: 14,
  },
  alertaLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  alertaDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  alertaMensagem: {
    color: '#ccc',
    fontSize: 13,
    flex: 1,
  },
});
