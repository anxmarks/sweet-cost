import { useRef } from 'react';
import { PanResponder, View, StyleSheet } from 'react-native';

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

export function SliderAjuste({ valor, minimo, maximo, passo, onMudar, onFinalizar }: SliderAjusteProps) {
  const theme = useTheme();
  const larguraRef = useRef(0);
  const configRef = useRef({ minimo, maximo, passo, onMudar, onFinalizar });
  configRef.current = { minimo, maximo, passo, onMudar, onFinalizar };

  function xParaValor(x: number): number {
    const { minimo, maximo, passo } = configRef.current;
    const largura = larguraRef.current;
    if (largura <= 0) return minimo;
    const fracao = Math.min(1, Math.max(0, x / largura));
    const bruto = minimo + fracao * (maximo - minimo);
    const passos = Math.round((bruto - minimo) / passo);
    return Math.min(maximo, Math.max(minimo, minimo + passos * passo));
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evento) => configRef.current.onMudar(xParaValor(evento.nativeEvent.locationX)),
      onPanResponderMove: (evento) => configRef.current.onMudar(xParaValor(evento.nativeEvent.locationX)),
      onPanResponderRelease: (evento) => configRef.current.onFinalizar?.(xParaValor(evento.nativeEvent.locationX)),
      onPanResponderTerminate: (evento) => configRef.current.onFinalizar?.(xParaValor(evento.nativeEvent.locationX)),
    })
  ).current;

  const fracao = maximo === minimo ? 0 : Math.min(1, Math.max(0, (valor - minimo) / (maximo - minimo)));

  return (
    <View
      style={styles.container}
      onLayout={(evento) => {
        larguraRef.current = evento.nativeEvent.layout.width;
      }}
      {...panResponder.panHandlers}>
      <View style={[styles.trilhaFundo, { backgroundColor: theme.border }]} />
      <View style={[styles.trilhaPreenchida, { backgroundColor: theme.accent, width: `${fracao * 100}%` }]} />
      <View
        style={[
          styles.bolinha,
          { backgroundColor: theme.accent, left: `${fracao * 100}%`, marginLeft: -DIAMETRO_BOLINHA / 2 },
        ]}
      />
    </View>
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
