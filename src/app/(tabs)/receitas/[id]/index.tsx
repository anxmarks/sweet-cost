import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { listarProdutos } from '@/database/produtoRepository';
import { atualizarReceita, buscarReceitaPorId, listarIngredientesPorReceita } from '@/database/receitaRepository';
import { calcularCustoIngrediente } from '@/services/calculoCusto';
import { calcularPrecoVenda } from '@/services/calculoMargem';
import { formatarMoeda } from '@/utils/formatarMoeda';
import { Unidade } from '@/models';

const INCREMENTO_MARGEM = 5;

type IngredienteView = {
  produtoId: number;
  nome: string;
  quantidadeUsada: number;
  unidadeUsada: Unidade;
  custo: number;
};

export default function ReceitaDetalheScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const receitaId = Number(id);

  const [carregando, setCarregando] = useState(true);
  const [naoEncontrado, setNaoEncontrado] = useState(false);

  const [nome, setNome] = useState('');
  const [rendimento, setRendimento] = useState(0);
  const [unidadeRendimento, setUnidadeRendimento] = useState('un');
  const [margemLucro, setMargemLucro] = useState(0);
  const [ingredientes, setIngredientes] = useState<IngredienteView[]>([]);

  useFocusEffect(
    useCallback(() => {
      const receita = buscarReceitaPorId(receitaId);

      if (!receita) {
        setNaoEncontrado(true);
        setCarregando(false);
        return;
      }

      const produtos = listarProdutos();
      const ingredientesReceita = listarIngredientesPorReceita(receitaId);

      const ingredientesView = ingredientesReceita
        .map((ingrediente) => {
          const produto = produtos.find((p) => p.id === ingrediente.produto_id);
          if (!produto) return null;

          return {
            produtoId: produto.id,
            nome: produto.nome,
            quantidadeUsada: ingrediente.quantidade_usada,
            unidadeUsada: ingrediente.unidade_usada,
            custo: calcularCustoIngrediente(produto, ingrediente),
          };
        })
        .filter((item): item is IngredienteView => item !== null);

      setNome(receita.nome);
      setRendimento(receita.rendimento);
      setUnidadeRendimento(receita.unidade_rendimento);
      setMargemLucro(receita.margem_lucro);
      setIngredientes(ingredientesView);
      setNaoEncontrado(false);
      setCarregando(false);
    }, [receitaId])
  );

  function handleAjustarMargem(delta: number) {
    const novaMargem = Math.max(0, margemLucro + delta);

    atualizarReceita(receitaId, {
      nome,
      rendimento,
      unidade_rendimento: unidadeRendimento,
      margem_lucro: novaMargem,
    });

    setMargemLucro(novaMargem);
  }

  if (carregando) {
    return <ThemedView style={styles.container} />;
  }

  if (naoEncontrado) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedText type="subtitle">Receita não encontrada.</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const custoTotal = ingredientes.reduce((total, ingrediente) => total + ingrediente.custo, 0);
  const precoVenda = calcularPrecoVenda(custoTotal, rendimento, margemLucro);
  const lucroTotal = custoTotal * (margemLucro / 100);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.conteudo}>
          <View style={styles.header}>
            <ThemedText type="subtitle" style={styles.flex1}>
              {nome}
            </ThemedText>
            <Pressable onPress={() => router.push(`/receitas/${receitaId}/editar`)}>
              <ThemedText type="linkPrimary">Editar</ThemedText>
            </Pressable>
          </View>

          <View style={styles.secao}>
            <ThemedText type="smallBold">Ingredientes</ThemedText>
            {ingredientes.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                Nenhum ingrediente adicionado.
              </ThemedText>
            ) : (
              ingredientes.map((ingrediente) => (
                <View key={ingrediente.produtoId} style={styles.ingredienteRow}>
                  <ThemedText type="small" style={styles.flex1}>
                    {ingrediente.nome} — {ingrediente.quantidadeUsada} {ingrediente.unidadeUsada}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {formatarMoeda(ingrediente.custo)}
                  </ThemedText>
                </View>
              ))
            )}
          </View>

          <View style={styles.secao}>
            <ThemedText type="smallBold">Rendimento</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {rendimento} {unidadeRendimento}
            </ThemedText>
          </View>

          <View style={styles.secao}>
            <ThemedText type="smallBold">Valor gasto</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {formatarMoeda(custoTotal)}
            </ThemedText>
          </View>

          <View style={styles.secao}>
            <ThemedText type="smallBold">Preço de venda sugerido</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {formatarMoeda(precoVenda)} / {unidadeRendimento}
            </ThemedText>
          </View>

          <View style={styles.secao}>
            <ThemedText type="smallBold">Lucro</ThemedText>
            <View style={styles.margemRow}>
              <Pressable onPress={() => handleAjustarMargem(-INCREMENTO_MARGEM)}>
                <ThemedView type="backgroundElement" style={styles.margemBotao}>
                  <ThemedText type="smallBold">-</ThemedText>
                </ThemedView>
              </Pressable>
              <ThemedText type="small" themeColor="textSecondary" style={styles.margemTexto}>
                Lucro de {margemLucro}% = {formatarMoeda(lucroTotal)}
              </ThemedText>
              <Pressable onPress={() => handleAjustarMargem(INCREMENTO_MARGEM)}>
                <ThemedView type="backgroundElement" style={styles.margemBotao}>
                  <ThemedText type="smallBold">+</ThemedText>
                </ThemedView>
              </Pressable>
            </View>
          </View>
        </ScrollView>
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
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  conteudo: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flex1: {
    flex: 1,
  },
  secao: {
    gap: Spacing.one,
  },
  ingredienteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  margemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  margemTexto: {
    flex: 1,
  },
  margemBotao: {
    width: 36,
    height: 36,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
