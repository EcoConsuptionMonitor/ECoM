import { useCallback, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Entypo from '@expo/vector-icons/Entypo';
import { api } from '../../services/api';
import { getToken } from '../../services/session';
import { cores } from '../../styles/theme';

export default function Alerts(){
    const [alertas, setAlertas] = useState([]);
    const [carregando, setCarregando] = useState(true);

    useFocusEffect(
        useCallback(() => {
            let ativo = true;
            const token = getToken();

            async function carregar() {
                setCarregando(true);
                try {
                    const data = await api('/alertas', { token });
                    if (ativo) setAlertas(data);
                } catch {
                    if (ativo) setAlertas([]);
                } finally {
                    if (ativo) setCarregando(false);
                }
            }

            carregar();
            return () => { ativo = false; };
        }, [])
    );

    const nivelCor = (nivel) => {
        if (nivel === 'critico') return '#ff5252';
        if (nivel === 'alerta') return '#ffc107';
        return '#69f0ae';
    };

    const marcarLido = async (id) => {
        const token = getToken();
        try {
            await api(`/alertas/${id}`, { method: 'PATCH', token, body: { lido: true } });
            setAlertas((prev) => prev.map((a) => (a.id === id ? { ...a, lido: true } : a)));
        } catch {
            // ignora falha ao marcar lido
        }
    };

    return(
        <View style ={styles.container}>
            <View style={styles.cabecalho}><Text style={styles.titulo}>Alertas</Text><Text style={styles.subtitulo}>Acompanhe o que pede sua atenção.</Text></View>
            {carregando ? (
                <ActivityIndicator color="#c8ff00" size="large" />
            ) : (
                <FlatList
                    data={alertas}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.lista}
                    ListEmptyComponent={<Text style={styles.vazio}>Nenhum alerta por enquanto.</Text>}
                    renderItem={({ item }) => (
                        <View style={[styles.card, item.lido && styles.cardLido]}>
                            <Entypo name="flash" size={22} color={nivelCor(item.nivel)} />
                            <View style={styles.cardCorpo}>
                                <Text style={styles.mensagem}>{item.mensagem}</Text>
                                <Text style={styles.meta}>{item.tipo} · {new Date(item.data).toLocaleString('pt-BR')}</Text>
                            </View>
                            {!item.lido ? (
                                <TouchableOpacity onPress={() => marcarLido(item.id)}>
                                    <Text style={styles.lidoBtn}>Lido</Text>
                                </TouchableOpacity>
                            ) : (
                                <Text style={styles.lidoTexto}>✓</Text>
                            )}
                        </View>
                    )}
                />
            )}
        </View>
    )
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
    paddingTop: 56,
  },
  cabecalho: { paddingHorizontal: 20, marginBottom: 14 },
  titulo: {
    color: cores.texto,
    fontSize: 26,
    fontWeight: '800',
  },
  subtitulo: { color: cores.textoSuave, fontSize: 13, marginTop: 5 },
  lista: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  vazio: {
    color: cores.textoSuave,
    textAlign: 'center',
    marginTop: 40,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: cores.superficie,
    borderRadius: 18,
    padding: 16,
    marginVertical: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: cores.linha,
  },
  cardLido: {
    opacity: 0.55,
  },
  cardCorpo: {
    flex: 1,
  },
  mensagem: {
    color: cores.texto,
    fontSize: 15,
    fontWeight: 'bold',
  },
  meta: {
    color: cores.textoSuave,
    fontSize: 12,
    marginTop: 4,
  },
  lidoBtn: {
    color: cores.verde,
    fontWeight: 'bold',
  },
  lidoTexto: {
    color: '#69f0ae',
    fontWeight: 'bold',
    fontSize: 18,
  },
});
