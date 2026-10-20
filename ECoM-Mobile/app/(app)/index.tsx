import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/auth';
import { api } from '../../src/services/api';
import { cores, espacamento, raio } from '../../src/styles/theme';
import type { Alerta, Dashboard } from '../../src/types';

const formatar = (valor: number, casas = 0) =>
  Number(valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });

export default function Inicio() {
  const router = useRouter();
  const { usuario } = useAuth();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const dados = await api.getDashboard();
      setDashboard(dados);
    } catch {
      setDashboard(null);
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

  const totais = dashboard?.totais ?? { energia: 0, agua: 0, custoTotal: 0 };
  const ativos = dashboard?.alertas.ativos ?? 0;
  const alertas = dashboard?.alertasRecentes ?? [];
  const primeiroNome = usuario?.nome?.split(' ')[0] ?? 'você';

  return (
    <SafeAreaView style={estilos.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={estilos.conteudo}
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
      >
        <View style={estilos.topo}>
          <View>
            <Text style={estilos.saudacao}>Olá, {primeiroNome}</Text>
            <Text style={estilos.data}>Sua casa, em um só lugar.</Text>
          </View>
          <TouchableOpacity
            style={estilos.avatar}
            onPress={() => router.push('/perfil')}
            accessibilityLabel="Abrir perfil"
          >
            <Text style={estilos.avatarTexto}>{primeiroNome.slice(0, 1).toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        {carregando && !dashboard ? (
          <View style={estilos.carregando}>
            <ActivityIndicator size="large" color={cores.verde} />
          </View>
        ) : (
          <>
            <View style={estilos.hero}>
              <View style={estilos.heroTopo}>
                <View>
                  <Text style={estilos.heroEtiqueta}>GASTO ACUMULADO</Text>
                  <Text style={estilos.heroValor}>R$ {formatar(totais.custoTotal, 2)}</Text>
                </View>
                <View style={estilos.folha}>
                  <Ionicons name="leaf" size={27} color="#D3F0B4" />
                </View>
              </View>
              <View style={estilos.heroLinha} />
              <Text style={estilos.heroTexto}>
                Acompanhe seus recursos e faça escolhas mais leves para o planeta.
              </Text>
            </View>

            <View style={estilos.secaoTopo}>
              <Text style={estilos.secaoTitulo}>Consumo total</Text>
              <TouchableOpacity onPress={() => router.push('/(app)/dashboard')}>
                <Text style={estilos.link}>Ver análises</Text>
              </TouchableOpacity>
            </View>
            <View style={estilos.metricas}>
              <Metrica
                icone="flash"
                cor={cores.verde}
                fundo={cores.verdeClaro}
                valor={`${formatar(totais.energia, 2)} kWh`}
                titulo="Energia"
              />
              <Metrica
                icone="water"
                cor={cores.agua}
                fundo={cores.aguaClaro}
                valor={`${formatar(totais.agua)} L`}
                titulo="Água"
              />
            </View>

            <TouchableOpacity style={estilos.alertaResumo} onPress={() => router.push('/(app)/alertas')}>
              <View style={[estilos.alertaIcone, ativos ? estilos.alertaAtivo : estilos.alertaOk]}>
                <Ionicons
                  name={ativos ? 'notifications' : 'checkmark'}
                  size={19}
                  color={ativos ? cores.alerta : cores.verde}
                />
              </View>
              <View style={estilos.alertaTexto}>
                <Text style={estilos.alertaTitulo}>
                  {ativos ? `${ativos} alerta${ativos > 1 ? 's' : ''} para revisar` : 'Tudo sob controle'}
                </Text>
                <Text style={estilos.alertaSub}>
                  {ativos ? 'Toque para ver os detalhes' : 'Nenhuma pendência recente.'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={19} color={cores.textoSuave} />
            </TouchableOpacity>

            <View style={estilos.secaoTopo}>
              <Text style={estilos.secaoTitulo}>Aconteceu por aí</Text>
              <Text style={estilos.secaoMeta}>Recente</Text>
            </View>
            <View style={estilos.lista}>
              {alertas.length ? (
                alertas.slice(0, 3).map((alerta) => <ItemAlerta key={alerta.id} alerta={alerta} />)
              ) : (
                <Text style={estilos.vazio}>Ainda não há leituras ou alertas recentes.</Text>
              )}
            </View>

            <TouchableOpacity style={estilos.acao} onPress={() => router.push('/(app)/controles')}>
              <Ionicons name="add-circle-outline" size={21} color="#fff" />
              <Text style={estilos.acaoTexto}>Registrar consumo</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Metrica({
  icone,
  cor,
  fundo,
  valor,
  titulo,
}: {
  icone: keyof typeof Ionicons.glyphMap;
  cor: string;
  fundo: string;
  valor: string;
  titulo: string;
}) {
  return (
    <View style={estilos.metrica}>
      <View style={[estilos.metricaIcone, { backgroundColor: fundo }]}>
        <Ionicons name={icone} size={19} color={cor} />
      </View>
      <Text style={estilos.metricaValor}>{valor}</Text>
      <Text style={estilos.metricaTitulo}>{titulo}</Text>
    </View>
  );
}

function ItemAlerta({ alerta }: { alerta: Alerta }) {
  const cor = alerta.nivel === 'critico' ? cores.perigo : alerta.nivel === 'alerta' ? cores.alerta : cores.verde;
  const origem = alerta.tipo === 'agua' ? 'Água' : alerta.tipo === 'energia' ? 'Energia' : 'Sistema';
  return (
    <View style={estilos.item}>
      <View style={[estilos.itemBarra, { backgroundColor: cor }]} />
      <View style={estilos.itemTexto}>
        <Text style={estilos.itemTitulo} numberOfLines={1}>
          {alerta.mensagem}
        </Text>
        <Text style={estilos.itemMeta}>
          {origem} · {new Date(alerta.data).toLocaleDateString('pt-BR')}
        </Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espacamento.xl, paddingBottom: 36 },
  topo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: espacamento.sm,
    marginBottom: espacamento.xxl,
  },
  saudacao: { color: cores.texto, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  data: { color: cores.textoSuave, fontSize: 14, marginTop: 4 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#B7DDB0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexto: { color: cores.floresta, fontSize: 18, fontWeight: '800' },
  carregando: { height: 400, justifyContent: 'center' },
  hero: { backgroundColor: cores.floresta, borderRadius: raio.xl, padding: 22, marginBottom: espacamento.xxl },
  heroTopo: { flexDirection: 'row', justifyContent: 'space-between' },
  heroEtiqueta: { color: '#B9CCC0', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  heroValor: { color: '#fff', fontSize: 31, fontWeight: '800', marginTop: 7, letterSpacing: -0.8 },
  folha: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#285044',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLinha: { height: 1, backgroundColor: '#376154', marginVertical: 18 },
  heroTexto: { color: '#D0DDD5', fontSize: 13, lineHeight: 19, maxWidth: '88%' },
  secaoTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: espacamento.md,
  },
  secaoTitulo: { color: cores.texto, fontSize: 17, fontWeight: '700' },
  link: { color: cores.verde, fontSize: 13, fontWeight: '700' },
  secaoMeta: { color: cores.textoSuave, fontSize: 12 },
  metricas: { flexDirection: 'row', gap: espacamento.md, marginBottom: espacamento.lg },
  metrica: {
    flex: 1,
    backgroundColor: cores.superficie,
    borderRadius: raio.lg,
    padding: espacamento.lg,
    borderWidth: 1,
    borderColor: cores.linha,
  },
  metricaIcone: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  metricaValor: { color: cores.texto, fontSize: 17, fontWeight: '800' },
  metricaTitulo: { color: cores.textoSuave, fontSize: 12, marginTop: 4 },
  alertaResumo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacamento.md,
    backgroundColor: cores.superficie,
    borderRadius: 18,
    padding: 14,
    marginBottom: espacamento.xxl,
    borderWidth: 1,
    borderColor: cores.linha,
  },
  alertaIcone: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertaAtivo: { backgroundColor: cores.alertaClaro },
  alertaOk: { backgroundColor: cores.verdeClaro },
  alertaTexto: { flex: 1 },
  alertaTitulo: { color: cores.texto, fontSize: 14, fontWeight: '700' },
  alertaSub: { color: cores.textoSuave, fontSize: 12, marginTop: 3 },
  lista: {
    backgroundColor: cores.superficie,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: cores.linha,
    marginBottom: espacamento.xl,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 62,
    paddingRight: 15,
    borderBottomWidth: 1,
    borderBottomColor: cores.linha,
  },
  itemBarra: { width: 4, height: 32, borderRadius: 3, marginHorizontal: 14 },
  itemTexto: { flex: 1 },
  itemTitulo: { color: cores.texto, fontSize: 13, fontWeight: '600' },
  itemMeta: { color: cores.textoSuave, fontSize: 11, marginTop: 4 },
  vazio: { color: cores.textoSuave, fontSize: 13, padding: 18, textAlign: 'center' },
  acao: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.verde,
    borderRadius: 17,
    paddingVertical: 16,
  },
  acaoTexto: { color: '#fff', fontSize: 14, fontWeight: '800', flex: 1 },
});
