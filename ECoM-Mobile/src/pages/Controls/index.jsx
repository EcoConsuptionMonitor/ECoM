import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Switch } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Entypo from '@expo/vector-icons/Entypo';
import { api } from '../../services/api';
import { getToken } from '../../services/session';

const DISPOSITIVOS_PADRAO = [
  { id: 'lampada_sala', nome: 'Lâmpada Sala', icone: 'light-up', tipo: 'energia', potencia: 15, ligado: false },
  { id: 'lampada_quarto', nome: 'Lâmpada Quarto', icone: 'light-up', tipo: 'energia', potencia: 15, ligado: false },
  { id: 'lampada_cozinha', nome: 'Lâmpada Cozinha', icone: 'light-up', tipo: 'energia', potencia: 20, ligado: false },
  { id: 'tomada_tv', nome: 'TV', icone: 'tv', tipo: 'energia', potencia: 100, ligado: false },
  { id: 'tomada_geladeira', nome: 'Geladeira', icone: 'refrigerator', tipo: 'energia', potencia: 150, ligado: false },
  { id: 'chuveiro', nome: 'Chuveiro', icone: 'water', tipo: 'energia', potencia: 5500, ligado: false },
  { id: 'torneira_cozinha', nome: 'Torneira Cozinha', icone: 'drop', tipo: 'agua', vazao: 8, ligado: false },
  { id: 'torneira_banheiro', nome: 'Torneira Banheiro', icone: 'drop', tipo: 'agua', vazao: 6, ligado: false },
  { id: 'maquina_lavar', nome: 'Máquina de Lavar', icone: 'laundry', tipo: 'agua', vazao: 50, ligado: false },
];

export default function Controls() {
  const [dispositivos, setDispositivos] = useState(DISPOSITIVOS_PADRAO);
  const [ambientes, setAmbientes] = useState([]);
  const [consumoTempoReal, setConsumoTempoReal] = useState({ energia: 0, agua: 0 });
  const [enviando, setEnviando] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      carregar();
      return () => { ativo = false; };

      async function carregar() {
        try {
          const token = getToken();
          const data = await api('/ambientes', { token });
          if (ativo) setAmbientes(data);
        } catch {
          if (ativo) setAmbientes([]);
        }
      }
    }, [])
  );

  function toggleDispositivo(id) {
    setDispositivos((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const novo = { ...d, ligado: !d.ligado };
        if (novo.ligado) {
          if (novo.tipo === 'energia') {
            setConsumoTempoReal((c) => ({ ...c, energia: c.energia + novo.potencia }));
          } else {
            setConsumoTempoReal((c) => ({ ...c, agua: c.agua + (novo.vazao || 0) }));
          }
        } else {
          if (novo.tipo === 'energia') {
            setConsumoTempoReal((c) => ({ ...c, energia: Math.max(0, c.energia - novo.potencia) }));
          } else {
            setConsumoTempoReal((c) => ({ ...c, agua: Math.max(0, c.agua - (novo.vazao || 0)) }));
          }
        }
        return novo;
      })
    );
  }

  async function enviarLeitura(dispositivo) {
    if (ambientes.length === 0) {
      return;
    }
    setEnviando(dispositivo.id);
    try {
      const token = getToken();
      const valor = dispositivo.tipo === 'energia'
        ? (dispositivo.potencia / 1000)
        : (dispositivo.vazao || 0);
      await api('/sensores', {
        method: 'POST',
        token,
        body: {
          ambienteId: ambientes[0].id,
          tipo: dispositivo.tipo,
          valor,
          potencia: dispositivo.tipo === 'energia' ? dispositivo.potencia : null,
          corrente: dispositivo.tipo === 'energia' ? (dispositivo.potencia / 127).toFixed(2) : null,
          tensao: dispositivo.tipo === 'energia' ? 127 : null,
        },
      });
    } catch {
      // ignora erro silenciosamente
    } finally {
      setEnviando(null);
    }
  }

  const dispositivosLigados = dispositivos.filter((d) => d.ligado);
  const custoHoraEnergia = consumoTempoReal.energia * 0.00065;
  const custoHoraAgua = consumoTempoReal.agua * 0.00582;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Controles</Text>
        <Text style={styles.subtitulo}>Simule o consumo da mini-residência</Text>
      </View>

      <View style={styles.statusBar}>
        <View style={styles.statusItem}>
          <Entypo name="flash" size={18} color="#c8ff00" />
          <Text style={styles.statusValor}>{consumoTempoReal.energia} W</Text>
          <Text style={styles.statusLabel}>Energia ativa</Text>
        </View>
        <View style={styles.statusDivider} />
        <View style={styles.statusItem}>
          <Entypo name="drop" size={18} color="#1385ef" />
          <Text style={styles.statusValor}>{consumoTempoReal.agua} L/min</Text>
          <Text style={styles.statusLabel}>Água ativa</Text>
        </View>
      </View>

      <View style={styles.custoBar}>
        <Text style={styles.custoText}>
          Custo/hora: R$ {(custoHoraEnergia + custoHoraAgua).toFixed(4)}
        </Text>
      </View>

      <View style={styles.secao}>
        <Text style={styles.secaoTitulo}>Energia Elétrica</Text>
        {dispositivos.filter((d) => d.tipo === 'energia').map((disp) => (
          <View key={disp.id} style={[styles.dispCard, disp.ligado && styles.dispCardLigado]}>
            <View style={styles.dispHeader}>
              <View style={styles.dispIcone}>
                <Entypo name={disp.icone} size={22} color={disp.ligado ? '#c8ff00' : '#555'} />
              </View>
              <View style={styles.dispInfo}>
                <Text style={styles.dispNome}>{disp.nome}</Text>
                <Text style={styles.dispPotencia}>{disp.potencia}W</Text>
              </View>
              <Switch
                value={disp.ligado}
                onValueChange={() => toggleDispositivo(disp.id)}
                trackColor={{ false: '#333', true: '#c8ff0040' }}
                thumbColor={disp.ligado ? '#c8ff00' : '#666'}
              />
            </View>
            {disp.ligado && (
              <TouchableOpacity
                style={styles.enviarBtn}
                onPress={() => enviarLeitura(disp)}
                disabled={enviando === disp.id}
              >
                {enviando === disp.id ? (
                  <ActivityIndicator color="#1e2d27" size="small" />
                ) : (
                  <Text style={styles.enviarText}>Enviar para API</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      <View style={styles.secao}>
        <Text style={styles.secaoTitulo}>Água</Text>
        {dispositivos.filter((d) => d.tipo === 'agua').map((disp) => (
          <View key={disp.id} style={[styles.dispCard, disp.ligado && styles.dispCardLigado]}>
            <View style={styles.dispHeader}>
              <View style={styles.dispIcone}>
                <Entypo name={disp.icone} size={22} color={disp.ligado ? '#1385ef' : '#555'} />
              </View>
              <View style={styles.dispInfo}>
                <Text style={styles.dispNome}>{disp.nome}</Text>
                <Text style={styles.dispPotencia}>{disp.vazao} L/min</Text>
              </View>
              <Switch
                value={disp.ligado}
                onValueChange={() => toggleDispositivo(disp.id)}
                trackColor={{ false: '#333', true: '#1385ef40' }}
                thumbColor={disp.ligado ? '#1385ef' : '#666'}
              />
            </View>
            {disp.ligado && (
              <TouchableOpacity
                style={styles.enviarBtn}
                onPress={() => enviarLeitura(disp)}
                disabled={enviando === disp.id}
              >
                {enviando === disp.id ? (
                  <ActivityIndicator color="#1e2d27" size="small" />
                ) : (
                  <Text style={styles.enviarText}>Enviar para API</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      {dispositivosLigados.length > 0 && (
        <View style={styles.resumoCard}>
          <Text style={styles.resumoTitulo}>Resumo - Dispositivos Ligados</Text>
          {dispositivosLigados.map((d) => (
            <View key={d.id} style={styles.resumoLinha}>
              <Text style={styles.resumoNome}>{d.nome}</Text>
              <Text style={styles.resumoValor}>
                {d.tipo === 'energia' ? `${d.potencia}W` : `${d.vazao} L/min`}
              </Text>
            </View>
          ))}
        </View>
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
  statusBar: {
    flexDirection: 'row',
    backgroundColor: '#000',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginTop: 10,
    marginBottom: 10,
  },
  statusItem: {
    flex: 1,
    alignItems: 'center',
  },
  statusDivider: {
    width: 1,
    backgroundColor: '#333',
    marginVertical: 4,
  },
  statusValor: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  statusLabel: {
    color: '#888',
    fontSize: 11,
    marginTop: 2,
  },
  custoBar: {
    backgroundColor: '#000',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  custoText: {
    color: '#c8ff00',
    fontSize: 14,
    fontWeight: '600',
  },
  secao: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  secaoTitulo: {
    color: '#c8ff00',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  dispCard: {
    backgroundColor: '#000',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#222',
  },
  dispCardLigado: {
    borderColor: '#c8ff0040',
  },
  dispHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dispIcone: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e2d27',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dispInfo: {
    flex: 1,
  },
  dispNome: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  dispPotencia: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  enviarBtn: {
    backgroundColor: '#c8ff00',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  enviarText: {
    color: '#1e2d27',
    fontSize: 13,
    fontWeight: 'bold',
  },
  resumoCard: {
    backgroundColor: '#000',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  resumoTitulo: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resumoLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  resumoNome: {
    color: '#ccc',
    fontSize: 13,
  },
  resumoValor: {
    color: '#c8ff00',
    fontSize: 13,
    fontWeight: '600',
  },
});
