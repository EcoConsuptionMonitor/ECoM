import { useCallback, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { getToken, getUsuario } from '../../services/session';
import { cores } from '../../styles/theme';

const formatar = (valor, casas = 0) => Number(valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });

export default function Home() {
  const navigation = useNavigation();
  const [dashboard, setDashboard] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const usuario = getUsuario();

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      async function carregar() {
        setCarregando(true);
        try {
          const dados = await api('/dashboard', { token: getToken() });
          if (ativo) setDashboard(dados);
        } catch {
          if (ativo) setDashboard(null);
        } finally {
          if (ativo) setCarregando(false);
        }
      }
      carregar();
      return () => { ativo = false; };
    }, [])
  );

  const totais = dashboard?.totais || { energia: 0, agua: 0, custoTotal: 0 };
  const ativos = dashboard?.alertas?.ativos || 0;
  const alertas = dashboard?.alertasRecentes || [];
  const primeiroNome = usuario?.nome?.split(' ')[0] || 'você';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topo}>
          <View><Text style={styles.saudacao}>Olá, {primeiroNome}</Text><Text style={styles.data}>Sua casa, em um só lugar.</Text></View>
          <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate('Profile')} accessibilityLabel="Abrir perfil">
            <Text style={styles.avatarTexto}>{primeiroNome.slice(0, 1).toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        {carregando ? <View style={styles.carregando}><ActivityIndicator size="large" color={cores.verde} /></View> : <>
          <View style={styles.hero}>
            <View style={styles.heroTopo}><View><Text style={styles.heroEtiqueta}>GASTO ACUMULADO</Text><Text style={styles.heroValor}>R$ {formatar(totais.custoTotal, 2)}</Text></View><View style={styles.folha}><Ionicons name="leaf" size={27} color="#D3F0B4" /></View></View>
            <View style={styles.heroLinha} />
            <Text style={styles.heroTexto}>Acompanhe seus recursos e faça escolhas mais leves para o planeta.</Text>
          </View>

          <View style={styles.secaoTopo}><Text style={styles.secaoTitulo}>Consumo total</Text><TouchableOpacity onPress={() => navigation.navigate('Dashboard')}><Text style={styles.link}>Ver análises</Text></TouchableOpacity></View>
          <View style={styles.metricas}>
            <Metrica icone="flash" cor={cores.verde} fundo={cores.verdeClaro} valor={`${formatar(totais.energia, 2)} kWh`} titulo="Energia" />
            <Metrica icone="water" cor={cores.agua} fundo={cores.aguaClaro} valor={`${formatar(totais.agua)} L`} titulo="Água" />
          </View>

          <TouchableOpacity style={styles.alertaResumo} onPress={() => navigation.navigate('Alerts')}>
            <View style={[styles.alertaIcone, ativos ? styles.alertaAtivo : styles.alertaOk]}><Ionicons name={ativos ? 'notifications' : 'checkmark'} size={19} color={ativos ? cores.alerta : cores.verde} /></View>
            <View style={styles.alertaTexto}><Text style={styles.alertaTitulo}>{ativos ? `${ativos} alerta${ativos > 1 ? 's' : ''} para revisar` : 'Tudo sob controle'}</Text><Text style={styles.alertaSub}>{ativos ? 'Toque para ver os detalhes' : 'Nenhuma pendência recente.'}</Text></View>
            <Ionicons name="chevron-forward" size={19} color={cores.textoSuave} />
          </TouchableOpacity>

          <View style={styles.secaoTopo}><Text style={styles.secaoTitulo}>Aconteceu por aí</Text><Text style={styles.secaoMeta}>Recente</Text></View>
          <View style={styles.lista}>
            {alertas.length ? alertas.slice(0, 3).map((alerta) => <Alerta key={alerta.id} alerta={alerta} />) : <Text style={styles.vazio}>Ainda não há leituras ou alertas recentes.</Text>}
          </View>

          <TouchableOpacity style={styles.acao} onPress={() => navigation.navigate('Controls')}><Ionicons name="add-circle-outline" size={21} color="#fff" /><Text style={styles.acaoTexto}>Registrar consumo</Text><Ionicons name="arrow-forward" size={18} color="#fff" /></TouchableOpacity>
        </>}
      </ScrollView>
    </SafeAreaView>
  );
}

function Metrica({ icone, cor, fundo, valor, titulo }) {
  return <View style={styles.metrica}><View style={[styles.metricaIcone, { backgroundColor: fundo }]}><Ionicons name={icone} size={19} color={cor} /></View><Text style={styles.metricaValor}>{valor}</Text><Text style={styles.metricaTitulo}>{titulo}</Text></View>;
}

function Alerta({ alerta }) {
  const cor = alerta.nivel === 'critico' ? cores.perigo : alerta.nivel === 'alerta' ? cores.alerta : cores.verde;
  return <View style={styles.item}><View style={[styles.itemBarra, { backgroundColor: cor }]} /><View style={styles.itemTexto}><Text style={styles.itemTitulo} numberOfLines={1}>{alerta.mensagem}</Text><Text style={styles.itemMeta}>{alerta.tipo === 'agua' ? 'Água' : 'Energia'} · {new Date(alerta.data).toLocaleDateString('pt-BR')}</Text></View></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo }, content: { padding: 20, paddingBottom: 36 },
  topo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 26 },
  saudacao: { color: cores.texto, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 }, data: { color: cores.textoSuave, fontSize: 14, marginTop: 4 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#B7DDB0', alignItems: 'center', justifyContent: 'center' }, avatarTexto: { color: cores.floresta, fontSize: 18, fontWeight: '800' },
  carregando: { height: 400, justifyContent: 'center' },
  hero: { backgroundColor: cores.floresta, borderRadius: 26, padding: 22, marginBottom: 28 }, heroTopo: { flexDirection: 'row', justifyContent: 'space-between' }, heroEtiqueta: { color: '#B9CCC0', fontSize: 11, fontWeight: '800', letterSpacing: 1 }, heroValor: { color: '#fff', fontSize: 31, fontWeight: '800', marginTop: 7, letterSpacing: -0.8 }, folha: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#285044', alignItems: 'center', justifyContent: 'center' }, heroLinha: { height: 1, backgroundColor: '#376154', marginVertical: 18 }, heroTexto: { color: '#D0DDD5', fontSize: 13, lineHeight: 19, maxWidth: '88%' },
  secaoTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }, secaoTitulo: { color: cores.texto, fontSize: 17, fontWeight: '700' }, link: { color: cores.verde, fontSize: 13, fontWeight: '700' }, secaoMeta: { color: cores.textoSuave, fontSize: 12 },
  metricas: { flexDirection: 'row', gap: 12, marginBottom: 18 }, metrica: { flex: 1, backgroundColor: cores.superficie, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: cores.linha }, metricaIcone: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 15 }, metricaValor: { color: cores.texto, fontSize: 17, fontWeight: '800' }, metricaTitulo: { color: cores.textoSuave, fontSize: 12, marginTop: 4 },
  alertaResumo: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: cores.superficie, borderRadius: 18, padding: 14, marginBottom: 28, borderWidth: 1, borderColor: cores.linha }, alertaIcone: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, alertaAtivo: { backgroundColor: '#FAECDD' }, alertaOk: { backgroundColor: cores.verdeClaro }, alertaTexto: { flex: 1 }, alertaTitulo: { color: cores.texto, fontSize: 14, fontWeight: '700' }, alertaSub: { color: cores.textoSuave, fontSize: 12, marginTop: 3 },
  lista: { backgroundColor: cores.superficie, borderRadius: 19, borderWidth: 1, borderColor: cores.linha, marginBottom: 22 }, item: { flexDirection: 'row', alignItems: 'center', minHeight: 62, paddingRight: 15, borderBottomWidth: 1, borderBottomColor: cores.linha }, itemBarra: { width: 4, height: 32, borderRadius: 3, marginHorizontal: 14 }, itemTexto: { flex: 1 }, itemTitulo: { color: cores.texto, fontSize: 13, fontWeight: '600' }, itemMeta: { color: cores.textoSuave, fontSize: 11, marginTop: 4 }, vazio: { color: cores.textoSuave, fontSize: 13, padding: 18, textAlign: 'center' },
  acao: { flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: cores.verde, borderRadius: 17, paddingVertical: 16 }, acaoTexto: { color: '#fff', fontSize: 14, fontWeight: '800', flex: 1 },
});
