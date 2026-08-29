import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { listarProdutos } from '@/database/produtoRepository';
import { Produto } from '@/models';
import { calcularAlertaValidade, NivelAlerta } from '@/services/alertaValidade';
import { formatarMoeda } from '@/utils/formatarMoeda';

const TEXTO_ALERTA: Record<Exclude<NivelAlerta, null>, string> = {
  vermelho: 'Vence em breve',
  amarelo: 'Atenção à validade',
};

function formatarValorUnitario(produto: Produto): string {
  const precoPorUnidade = produto.valor_pago / produto.quantidade;

  if (produto.unidade === 'un') {
    return `${formatarMoeda(precoPorUnidade)} / un`;
  }
  if (produto.unidade === 'kg' || produto.unidade === 'l') {
    return `${formatarMoeda(precoPorUnidade)} / ${produto.unidade}`;
  }
  return `${formatarMoeda(precoPorUnidade * 100)} / 100 ${produto.unidade}`;
}

export default function DispensaScreen() {
  const theme = useTheme();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState('');

  useFocusEffect(
    useCallback(() => {
      setProdutos(listarProdutos());
    }, [])
  );

  const produtosFiltrados = produtos.filter((produto) =>
    `${produto.nome} ${produto.marca ?? ''}`.toLowerCase().includes(busca.toLowerCase())
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

        <TextInput
          value={busca}
          onChangeText={setBusca}
          placeholder="Buscar na dispensa"
          placeholderTextColor={theme.textSecondary}
          style={[styles.busca, { color: theme.text, borderBottomColor: theme.border }]}
        />

        <FlatList
          data={produtosFiltrados}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <ThemedText themeColor="textSecondary">Nenhum produto cadastrado ainda.</ThemedText>
          }
          renderItem={({ item }) => {
            const alerta = calcularAlertaValidade(item.data_validade);
            const corValidade = alerta === 'vermelho' ? theme.danger : alerta === 'amarelo' ? theme.amber : theme.textSecondary;
            const textoValidade = alerta ? TEXTO_ALERTA[alerta] : 'sem validade informada';

            return (
              <Pressable onPress={() => router.push(`/dispensa/${item.id}`)}>
                <View style={[styles.card, { borderBottomColor: theme.border }]}>
                  <View style={styles.cardInfo}>
                    <ThemedText type="smallBold" style={styles.nomeTexto}>
                      {item.nome}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {(item.marca ? `${item.marca} · ` : '') + `${item.quantidade} ${item.unidade} · ${formatarMoeda(item.valor_pago)}`}
                    </ThemedText>
                    <ThemedText type="small" style={[styles.validadeTexto, { color: corValidade }]}>
                      {textoValidade}
                    </ThemedText>
                  </View>
                  <View style={styles.cardAcao}>
                    <ThemedText type="small" themeColor="accent">
                      {formatarValorUnitario(item)}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      editar →
                    </ThemedText>
                  </View>
                </View>
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
  busca: {
    borderBottomWidth: 1,
    paddingVertical: Spacing.two,
    fontSize: 15,
  },
  listContent: {
    paddingBottom: Spacing.four,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    minHeight: 66,
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  nomeTexto: {
    fontSize: 18,
  },
  validadeTexto: {
    fontSize: 12.5,
  },
  cardAcao: {
    alignItems: 'flex-end',
    gap: 2,
  },
});
