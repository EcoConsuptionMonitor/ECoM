import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { cores } from '../styles/theme';

interface Props {
  texto?: string;
  tamanho?: number;
}

export function Carregando({ texto, tamanho = 48 }: Props) {
  return (
    <View style={estilos.container}>
      <ActivityIndicator size="large" color={cores.verde} />
      {texto ? <Text style={estilos.texto}>{texto}</Text> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: cores.fundo, gap: 12 },
  texto: { color: cores.textoSuave, fontSize: 14 },
});
