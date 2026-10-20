import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { cores, espacamento } from '../styles/theme';

interface Props {
  icone?: keyof typeof Ionicons.glyphMap;
  titulo: string;
  descricao?: string;
  cor?: string;
}

export function Vazio({ icone = 'leaf-outline', titulo, descricao, cor = cores.verde }: Props) {
  return (
    <View style={estilos.container}>
      <View style={[estilos.icone, { backgroundColor: `${cor}1A` }]}>
        <Ionicons name={icone} size={28} color={cor} />
      </View>
      <Text style={estilos.titulo}>{titulo}</Text>
      {descricao ? <Text style={estilos.descricao}>{descricao}</Text> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  container: { alignItems: 'center', padding: espacamento.xxl, gap: espacamento.sm },
  icone: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: espacamento.xs,
  },
  titulo: { color: cores.texto, fontSize: 15, fontWeight: '700', textAlign: 'center' },
  descricao: { color: cores.textoSuave, fontSize: 13, textAlign: 'center', lineHeight: 19 },
});
