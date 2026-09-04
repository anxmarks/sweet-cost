import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { useTheme } from '@/hooks/use-theme';

const ALTURA_TOQUE = 32;
const DIAMETRO_BOLINHA = 20;

type SliderAjusteProps = {
  valor: number;
  minimo: number;
  maximo: number;
  passo: number;
  onMudar: (valor: number) => void;
  onFinalizar?: (valor: number) => void;
};

function arredondarPasso(bruto: number, minimo: number, maximo: number, passo: number) {
  'worklet';
  const passos = Math.round((bruto - minimo) / passo);
  return Math.min(maximo, Math.max(minimo, minimo + passos * passo));
}

export function SliderAjuste({ valor, minimo, maximo, passo, onMudar, onFinalizar }: SliderAjusteProps) {
  const theme = useTheme();
  const [largura, setLargura] = useState(0);

  const fracaoDoValor = maximo === minimo ? 0 : Math.min(1, Math.max(0, (valor - minimo) / (maximo - minimo)));

  const fracao = useSharedValue(fracaoDoValor);
  const ultimoValorEnviado = useSharedValue(valor);
  const arrastando = useSharedValue(false);

  useEffect(() => {
    if (!arrastando.value) {
      fracao.value = fracaoDoValor;
      ultimoValorEnviado.value = valor;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fracaoDoValor, valor]);

  const gesto = Gesture.Pan()
    .activeOffsetX([-6, 6])
    .failOffsetY([-10, 10])
    .onStart((evento) => {
      'worklet';
      if (largura <= 0) return;
      arrastando.value = true;
      const nova = Math.min(1, Math.max(0, evento.x / largura));
      fracao.value = nova;
      const valorFinal = arredondarPasso(minimo + nova * (maximo - minimo), minimo, maximo, passo);
      if (valorFinal !== ultimoValorEnviado.value) {
        ultimoValorEnviado.value = valorFinal;
        runOnJS(onMudar)(valorFinal);
      }
    })
    .onUpdate((evento) => {
      'worklet';
      if (largura <= 0) return;
      const nova = Math.min(1, Math.max(0, evento.x / largura));
      fracao.value = nova;
      const valorFinal = arredondarPasso(minimo + nova * (maximo - minimo), minimo, maximo, passo);
      if (valorFinal !== ultimoValorEnviado.value) {
        ultimoValorEnviado.value = valorFinal;
        runOnJS(onMudar)(valorFinal);
      }
    })
    .onFinalize(() => {
      'worklet';
      arrastando.value = false;
      if (onFinalizar) {
        runOnJS(onFinalizar)(ultimoValorEnviado.value);
      }
    });

  const estiloPreenchida = useAnimatedStyle(() => ({
    width: `${fracao.value * 100}%`,
  }));

  const estiloBolinha = useAnimatedStyle(() => ({
    left: `${fracao.value * 100}%`,
    marginLeft: -DIAMETRO_BOLINHA / 2,
  }));

  return (
    <GestureDetector gesture={gesto}>
      <View
        style={styles.container}
        onLayout={(evento) => setLargura(evento.nativeEvent.layout.width)}>
        <View style={[styles.trilhaFundo, { backgroundColor: theme.border }]} />
        <Animated.View style={[styles.trilhaPreenchida, { backgroundColor: theme.accent }, estiloPreenchida]} />
        <Animated.View style={[styles.bolinha, { backgroundColor: theme.accent }, estiloBolinha]} />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    height: ALTURA_TOQUE,
    justifyContent: 'center',
  },
  trilhaFundo: {
    height: 4,
    borderRadius: 2,
  },
  trilhaPreenchida: {
    position: 'absolute',
    height: 4,
    borderRadius: 2,
  },
  bolinha: {
    position: 'absolute',
    width: DIAMETRO_BOLINHA,
    height: DIAMETRO_BOLINHA,
    borderRadius: DIAMETRO_BOLINHA / 2,
  },
});
