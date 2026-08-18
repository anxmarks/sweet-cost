import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { listarProdutos } from '@/database/produtoRepository';
import { Produto } from '@/models';
import { calcularAlertaValidade, NivelAlerta } from '@/services/alertaValidade';
import { formatarMoeda } from '@/utils/formatarMoeda';

const CORES_ALERTA: Record<Exclude<NivelAlerta, null>, string> = {
  vermelho: '#E5484D',
  amarelo: '#F5A623',
};

const TEXTO_ALERTA: Record<Exclude<NivelAlerta, null>, string> = {
  vermelho: 'Vence em breve',
  amarelo: 'Atenção à validade',
};

export default function DispensaScreen() {
  const [produtos, setProdutos] = useState<Produto[]>([]);

  useFocusEffect(
    useCallback(() => {
      setProdutos(listarProdutos());
    }, [])
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Dispensa
          </ThemedText>
          <Pressable onPress={() => router.push('/dispensa/novo')}>
            <ThemedText type="linkPrimary">+ Novo produto</ThemedText>
          </Pressable>
        </View>

        <FlatList
          data={produtos}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <ThemedText themeColor="textSecondary">Nenhum produto cadastrado ainda.</ThemedText>
          }
          renderItem={({ item }) => {
            const alerta = calcularAlertaValidade(item.data_validade);

            return (
              <Pressable onPress={() => router.push(`/dispensa/${item.id}`)}>
                <ThemedView type="backgroundElement" style={styles.card}>
                  <View style={styles.cardHeader}>
                    <ThemedText type="smallBold">{item.nome}</ThemedText>
                    {alerta && (
                      <View style={[styles.badge, { backgroundColor: CORES_ALERTA[alerta] }]}>
                        <ThemedText type="small" style={styles.badgeText}>
                          {TEXTO_ALERTA[alerta]}
                        </ThemedText>
                      </View>
                    )}
                  </View>

                  {item.marca && (
                    <ThemedText type="small" themeColor="textSecondary">
                      {item.marca}
                    </ThemedText>
                  )}

                  <ThemedText type="small" themeColor="textSecondary">
                    {formatarMoeda(item.valor_pago)} — {item.quantidade} {item.unidade}
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  badgeText: {
    color: '#ffffff',
  },
});
