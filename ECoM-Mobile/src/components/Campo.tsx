import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type TextInputProps,
} from 'react-native';
import { cores, espacamento, raio } from '../styles/theme';

interface Props {
  label: string;
  valor: string;
  onChangeText: (texto: string) => void;
  placeholder?: string;
  erro?: string | null;
  seguro?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  maxLength?: number;
}

export function Campo({ label, valor, onChangeText, placeholder, erro, seguro, keyboardType, autoCapitalize, maxLength }: Props) {
  const [focado, setFocado] = useState(false);
  return (
    <View style={estilos.container}>
      <Text style={estilos.label}>{label}</Text>
      <TextInput
        style={[estilos.input, focado && estilos.inputFocado, erro && estilos.inputErro]}
        value={valor}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={cores.textoSuave}
        secureTextEntry={seguro}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
        onFocus={() => setFocado(true)}
        onBlur={() => setFocado(false)}
      />
      {erro ? <Text style={estilos.erro}>{erro}</Text> : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  container: { gap: 6, marginBottom: espacamento.lg },
  label: { color: cores.texto, fontSize: 13, fontWeight: '700' },
  input: {
    backgroundColor: cores.superficie,
    borderWidth: 1,
    borderColor: cores.linha,
    borderRadius: raio.md,
    paddingHorizontal: espacamento.lg,
    paddingVertical: 14,
    fontSize: 15,
    color: cores.texto,
  },
  inputFocado: { borderColor: cores.verde },
  inputErro: { borderColor: cores.perigo },
  erro: { color: cores.perigo, fontSize: 12 },
});
