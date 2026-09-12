import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { listarReceitasPorProdutividade, ReceitaComProdutividade } from '@/services/calculoProdutividade';
import { formatarMoeda } from '@/utils/formatarMoeda';

export default function RankingProdutividadeScreen() {
  const [receitas, setReceitas] = useState<ReceitaComProdutividade[]>([]);

  useFocusEffect(
    useCallback(() => {
      setReceitas(listarReceitasPorProdutividade());
    }, [])
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.navigate('/receitas')} hitSlop={8}>
            <ThemedText type="link" themeColor="accent">
              ← Receitas
            </ThemedText>
          </Pressable>
          <ThemedText type="title" style={styles.title}>
            Ranking de produtividade
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Lucro por hora de produção — o que mais vale a pena fazer com o tempo disponível.
          </ThemedText>
        </View>

        <FlatList
          data={receitas}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <ThemedText themeColor="textSecondary">Nenhuma receita cadastrada ainda.</ThemedText>
          }
          renderItem={({ item, index }) => (
            <Pressable onPress={() => router.navigate(`/receitas/${item.id}`)}>
              <ThemedView type="backgroundElement" style={styles.card}>
                <View style={styles.cardHeader}>
                  <ThemedText type="small" themeColor="accent" style={styles.posicao}>
                    #{index + 1}
                  </ThemedText>
                  <ThemedText type="smallBold" style={styles.flex1}>
                    {item.nome}
                  </ThemedText>
                  <ThemedText type="subtitle" style={styles.lucroHora}>
                    {formatarMoeda(item.lucroPorHora)}/h
                  </ThemedText>
                </View>
                <ThemedText type="small" themeColor="textSecondary">
                  {String(item.horas_producao).replace('.', ',')}h de produção — lucro total{' '}
                  {formatarMoeda(item.lucroTotal)}
                </ThemedText>
              </ThemedView>
            </Pressable>
          )}
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
  },
  header: {
    paddingTop: Spacing.three,
    gap: Spacing.one,
  },
  title: {
    fontSize: 28,
    lineHeight: 32,
    marginTop: Spacing.one,
  },
  listContent: {
    gap: Spacing.two,
    paddingTop: Spacing.three,
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
  posicao: {
    minWidth: 28,
  },
  flex1: {
    flex: 1,
  },
  lucroHora: {
    fontSize: 19,
  },
});
