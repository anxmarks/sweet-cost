import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { listarReceitas } from '@/database/receitaRepository';
import { calcularPrecoVendaReceita } from '@/services/calculoMargem';
import { Receita } from '@/models';
import { formatarMoeda } from '@/utils/formatarMoeda';

export default function ReceitasScreen() {
  const [receitas, setReceitas] = useState<Receita[]>([]);

  useFocusEffect(
    useCallback(() => {
      setReceitas(listarReceitas());
    }, [])
  );

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

        <FlatList
          data={receitas}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <ThemedText themeColor="textSecondary">Nenhuma receita cadastrada ainda.</ThemedText>
          }
          renderItem={({ item }) => {
            const precoVenda = calcularPrecoVendaReceita(item.id);

            return (
              <Pressable onPress={() => router.push(`/receitas/${item.id}`)}>
                <ThemedView type="backgroundElement" style={styles.card}>
                  <ThemedText type="smallBold">{item.nome}</ThemedText>

                  <ThemedText type="small" themeColor="textSecondary">
                    Rende {item.rendimento} {item.unidade_rendimento} — margem {item.margem_lucro}%
                  </ThemedText>

                  <ThemedText type="small" themeColor="textSecondary">
                    Preço de venda sugerido: {formatarMoeda(precoVenda)} / {item.unidade_rendimento}
                  </ThemedText>
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
  listContent: {
    gap: Spacing.two,
    paddingBottom: Spacing.four,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
});
