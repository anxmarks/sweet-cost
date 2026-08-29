import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

const NOMES_MES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];
const NOMES_DIA_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

type SeletorDataProps = {
  value: string;
  onSelecionar: (dataIso: string) => void;
  placeholder?: string;
  opcional?: boolean;
};

function paraIso(ano: number, mes: number, dia: number): string {
  return `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

function formatarBR(dataIso: string): string {
  const [ano, mes, dia] = dataIso.split('-');
  return `${dia}/${mes}/${ano}`;
}

function dataDeReferencia(value: string): Date {
  return value ? new Date(`${value}T00:00:00`) : new Date();
}

export function SeletorData({ value, onSelecionar, placeholder = 'Selecionar data', opcional }: SeletorDataProps) {
  const [aberto, setAberto] = useState(false);
  const [anoVisivel, setAnoVisivel] = useState(() => dataDeReferencia(value).getFullYear());
  const [mesVisivel, setMesVisivel] = useState(() => dataDeReferencia(value).getMonth());

  function abrir() {
    const referencia = dataDeReferencia(value);
    setAnoVisivel(referencia.getFullYear());
    setMesVisivel(referencia.getMonth());
    setAberto(true);
  }

  function irParaMesAnterior() {
    if (mesVisivel === 0) {
      setMesVisivel(11);
      setAnoVisivel((atual) => atual - 1);
    } else {
      setMesVisivel((atual) => atual - 1);
    }
  }

  function irParaProximoMes() {
    if (mesVisivel === 11) {
      setMesVisivel(0);
      setAnoVisivel((atual) => atual + 1);
    } else {
      setMesVisivel((atual) => atual + 1);
    }
  }

  const primeiroDiaSemana = new Date(anoVisivel, mesVisivel, 1).getDay();
  const totalDias = new Date(anoVisivel, mesVisivel + 1, 0).getDate();
  const celulas: (number | null)[] = [
    ...Array(primeiroDiaSemana).fill(null),
    ...Array.from({ length: totalDias }, (_, indice) => indice + 1),
  ];

  const agora = new Date();
  const hojeIso = paraIso(agora.getFullYear(), agora.getMonth(), agora.getDate());

  return (
    <>
      <Pressable onPress={abrir}>
        <ThemedView type="backgroundElement" style={styles.campo}>
          <ThemedText type="small" themeColor={value ? 'text' : 'textSecondary'}>
            {value ? formatarBR(value) : placeholder}
          </ThemedText>
        </ThemedView>
      </Pressable>

      <Modal visible={aberto} transparent animationType="fade" onRequestClose={() => setAberto(false)}>
        <Pressable style={styles.overlay} onPress={() => setAberto(false)}>
          <ThemedView style={styles.calendario}>
            <View style={styles.cabecalho}>
              <Pressable onPress={irParaMesAnterior} hitSlop={8}>
                <ThemedText type="smallBold">‹</ThemedText>
              </Pressable>
              <ThemedText type="smallBold">
                {NOMES_MES[mesVisivel]} de {anoVisivel}
              </ThemedText>
              <Pressable onPress={irParaProximoMes} hitSlop={8}>
                <ThemedText type="smallBold">›</ThemedText>
              </Pressable>
            </View>

            <View style={styles.linha}>
              {NOMES_DIA_SEMANA.map((diaSemana, indice) => (
                <ThemedText key={indice} type="small" themeColor="textSecondary" style={styles.celula}>
                  {diaSemana}
                </ThemedText>
              ))}
            </View>

            <View style={styles.linha}>
              {celulas.map((dia, indice) => {
                if (dia === null) {
                  return <View key={indice} style={styles.celula} />;
                }

                const dataIso = paraIso(anoVisivel, mesVisivel, dia);
                const selecionado = dataIso === value;
                const hoje = dataIso === hojeIso;

                return (
                  <Pressable
                    key={indice}
                    onPress={() => {
                      onSelecionar(dataIso);
                      setAberto(false);
                    }}
                    style={styles.celula}>
                    <ThemedView
                      type={selecionado ? 'backgroundSelected' : 'background'}
                      style={[styles.diaCirculo, hoje && !selecionado && styles.diaHoje]}>
                      <ThemedText type="small">{dia}</ThemedText>
                    </ThemedView>
                  </Pressable>
                );
              })}
            </View>

            {opcional && value ? (
              <Pressable
                onPress={() => {
                  onSelecionar('');
                  setAberto(false);
                }}>
                <ThemedText type="link" style={styles.limpar}>
                  Limpar data
                </ThemedText>
              </Pressable>
            ) : null}
          </ThemedView>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  campo: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendario: {
    width: 300,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  cabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
  },
  linha: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  celula: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diaCirculo: {
    width: '80%',
    aspectRatio: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diaHoje: {
    borderWidth: 1,
    borderColor: '#3c87f7',
  },
  limpar: {
    textAlign: 'center',
    marginTop: Spacing.one,
  },
});
