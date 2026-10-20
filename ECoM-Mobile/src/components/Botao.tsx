import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { cores, espacamento, raio } from '../styles/theme';

interface Props {
  titulo: string;
  onPress?: () => void;
  variante?: 'primario' | 'secundario' | 'perigo' | 'fantasma';
  carregando?: boolean;
  desabilitado?: boolean;
  estilo?: StyleProp<ViewStyle>;
}

export function Botao({ titulo, onPress, variante = 'primario', carregando, desabilitado, estilo }: Props) {
  const inativo = desabilitado || carregando;
  return (
    <TouchableOpacity
      style={[estilos.base, estilos[variante], inativo && estilos.desabilitado, estilo]}
      onPress={onPress}
      disabled={inativo}
      activeOpacity={0.8}
    >
      {carregando ? (
        <ActivityIndicator color={variante === 'primario' ? cores.branco : cores.verde} />
      ) : (
        <Text style={[estilos.texto, estilos[`texto_${variante}`]]}>{titulo}</Text>
      )}
    </TouchableOpacity>
  );
}

const estilos = StyleSheet.create({
  base: {
    borderRadius: raio.md,
    paddingVertical: espacamento.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primario: { backgroundColor: cores.verde },
  secundario: { backgroundColor: cores.verdeClaro },
  perigo: { backgroundColor: cores.perigoClaro },
  fantasma: { backgroundColor: 'transparent' },
  desabilitado: { opacity: 0.55 },
  texto: { fontSize: 15, fontWeight: '800' },
  texto_primario: { color: cores.branco },
  texto_secundario: { color: cores.verde },
  texto_perigo: { color: cores.perigo },
  texto_fantasma: { color: cores.textoSuave },
});
