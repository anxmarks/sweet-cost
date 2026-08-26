import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Unidade } from '@/models';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

type SeletorUnidadeProps = {
  value: Unidade;
  unidadesDisponiveis: Unidade[];
  onSelecionar: (unidade: Unidade) => void;
};

export function SeletorUnidade({ value, unidadesDisponiveis, onSelecionar }: SeletorUnidadeProps) {
  const theme = useTheme();
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <Pressable onPress={() => setAberto(true)}>
        <ThemedView type="backgroundElement" style={styles.campo}>
          <ThemedText type="small">{value}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            ▾
          </ThemedText>
        </ThemedView>
      </Pressable>

      <Modal visible={aberto} transparent animationType="fade" onRequestClose={() => setAberto(false)}>
        <Pressable style={styles.overlay} onPress={() => setAberto(false)}>
          <ThemedView style={styles.opcoes}>
            {unidadesDisponiveis.map((unidade) => (
              <Pressable
                key={unidade}
                onPress={() => {
                  onSelecionar(unidade);
                  setAberto(false);
                }}>
                <ThemedView
                  type={unidade === value ? 'backgroundSelected' : 'background'}
                  style={styles.opcao}>
                  <ThemedText type="small">{unidade}</ThemedText>
                </ThemedView>
              </Pressable>
            ))}
          </ThemedView>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  opcoes: {
    minWidth: 160,
    borderRadius: Spacing.three,
    padding: Spacing.two,
    gap: Spacing.half,
  },
  opcao: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
});
