import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { atualizarFixada, contarReceitasFixadas, listarReceitas } from '@/database/receitaRepository';
import { calcularPrecoVendaReceita } from '@/services/calculoMargem';
import { Receita } from '@/models';
import { formatarMoeda } from '@/utils/formatarMoeda';
import { listarTags } from '@/utils/listarTags';

export default function ReceitasScreen() {
  const theme = useTheme();
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [tagFiltro, setTagFiltro] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setReceitas(listarReceitas());
      setTagFiltro(null);
    }, [])
  );

  function handleAlternarFixada(receita: Receita) {
    if (receita.fixada === 1) {
      atualizarFixada(receita.id, false);
      setReceitas((atual) => atual.map((r) => (r.id === receita.id ? { ...r, fixada: 0 } : r)));
      return;
    }
    if (contarReceitasFixadas() >= 5) {
      Alert.alert(
        'Limite de receitas fixadas',
        'Você já tem 5 receitas fixadas na tela Início. Remova uma antes de fixar esta.'
      );
      return;
    }
    atualizarFixada(receita.id, true);
    setReceitas((atual) => atual.map((r) => (r.id === receita.id ? { ...r, fixada: 1 } : r)));
  }

  const todasAsTags = [...new Set(receitas.flatMap((receita) => listarTags(receita.tags)))].sort((a, b) =>
    a.localeCompare(b)
  );

  const receitasFiltradas = tagFiltro
    ? receitas.filter((receita) => listarTags(receita.tags).includes(tagFiltro))
    : receitas;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Receitas
          </ThemedText>
          <Pressable onPress={() => router.push('/receitas/nova')}>
            <ThemedText type="linkPrimary">+ Nova receita</ThemedText>
          </Pressable>
        </View>

        {todasAsTags.length > 0 && (
          <View style={styles.filtrosRow}>
            {todasAsTags.map((tag) => {
              const ativo = tag === tagFiltro;
              return (
                <Pressable key={tag} onPress={() => setTagFiltro(ativo ? null : tag)}>
                  <View
                    style={[
                      styles.filtroChip,
                      { borderColor: ativo ? theme.accent : theme.border },
                      ativo && { backgroundColor: theme.backgroundSelected },
                    ]}>
                    <ThemedText type="small" themeColor={ativo ? 'accent' : 'textSecondary'}>
                      {tag}
                    </ThemedText>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        <FlatList
          data={receitasFiltradas}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <ThemedText themeColor="textSecondary">
              {tagFiltro ? 'Nenhuma receita com essa tag.' : 'Nenhuma receita cadastrada ainda.'}
            </ThemedText>
          }
          renderItem={({ item }) => {
            const precoVenda = calcularPrecoVendaReceita(item.id);
            const tags = listarTags(item.tags);

            return (
              <Pressable onPress={() => router.push(`/receitas/${item.id}`)}>
                <ThemedView type="backgroundElement" style={styles.card}>
                  <View style={styles.cardHeader}>
                    <ThemedText type="smallBold" style={styles.flex1}>
                      {item.nome}
                    </ThemedText>
                    <Pressable onPress={() => handleAlternarFixada(item)} hitSlop={8}>
                      <ThemedText themeColor={item.fixada ? 'amber' : 'textSecondary'} style={styles.estrela}>
                        {item.fixada ? '★' : '☆'}
                      </ThemedText>
                    </Pressable>
                  </View>

                  <ThemedText type="small" themeColor="textSecondary">
                    Rende {item.rendimento} {item.unidade_rendimento} — margem {item.margem_lucro}%
                  </ThemedText>

                  <ThemedText type="small" themeColor="textSecondary">
                    Preço de venda sugerido: {formatarMoeda(precoVenda)} / {item.unidade_rendimento}
                  </ThemedText>

                  {tags.length > 0 && (
                    <ThemedText type="small" themeColor="accent">
                      {tags.join(' · ')}
                    </ThemedText>
                  )}
                </ThemedView>
              </Pressable>
            );
          }}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset,
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.three,
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
  },
  filtrosRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  filtroChip: {
    borderWidth: 1,
    borderRadius: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  listContent: {
    gap: Spacing.two,
    paddingBottom: Spacing.four,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  flex1: {
    flex: 1,
  },
  estrela: {
    fontSize: 18,
  },
});
