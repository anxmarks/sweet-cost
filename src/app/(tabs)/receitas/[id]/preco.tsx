import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { buscarConfiguracao } from '@/database/configuracaoRepository';
import { buscarReceitaPorId, listarIngredientesPorReceita } from '@/database/receitaRepository';
import { listarProdutos } from '@/database/produtoRepository';
import { calcularCustoIngrediente } from '@/services/calculoCusto';
import { calcularCustoFixoRateado } from '@/services/calculoCustoFixo';
import { calcularCustoMaoDeObra } from '@/services/calculoMaoDeObra';
import { formatarMoeda } from '@/utils/formatarMoeda';

export default function PrecoReceitaScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const receitaId = Number(id);

  const [carregando, setCarregando] = useState(true);
  const [naoEncontrado, setNaoEncontrado] = useState(false);

  const [nome, setNome] = useState('');
  const [rendimento, setRendimento] = useState(1);
  const [unidadeRendimento, setUnidadeRendimento] = useState('un');
  const [margemLucro, setMargemLucro] = useState(0);
  const [horasProducao, setHorasProducao] = useState(0);
  const [custoEmbalagem, setCustoEmbalagem] = useState(0);
  const [custoIngredientes, setCustoIngredientes] = useState(0);
  const [custoMaoDeObra, setCustoMaoDeObra] = useState(0);
  const [custoFixoRateado, setCustoFixoRateado] = useState(0);

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
      const custoIngredientesTotal = ingredientesReceita.reduce((total, ingrediente) => {
        const produto = produtos.find((p) => p.id === ingrediente.produto_id);
        return produto ? total + calcularCustoIngrediente(produto, ingrediente) : total;
      }, 0);

      const configuracao = buscarConfiguracao();

      setNome(receita.nome);
      setRendimento(receita.rendimento);
      setUnidadeRendimento(receita.unidade_rendimento);
      setMargemLucro(receita.margem_lucro);
      setHorasProducao(receita.horas_producao);
      setCustoEmbalagem(receita.custo_embalagem);
      setCustoIngredientes(custoIngredientesTotal);
      setCustoMaoDeObra(calcularCustoMaoDeObra(receita.horas_producao, configuracao.valor_hora_mao_de_obra));
      setCustoFixoRateado(calcularCustoFixoRateado());
      setNaoEncontrado(false);
      setCarregando(false);
    }, [receitaId])
  );

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

  const custoTotal = custoIngredientes + custoMaoDeObra + custoFixoRateado + custoEmbalagem;
  const precoPorUnidade = rendimento > 0 ? (custoTotal / rendimento) * (1 + margemLucro / 100) : 0;
  const lucro = custoTotal * (margemLucro / 100);
  const unidadeSingular = unidadeRendimento.replace(/s$/, '');

  const linhas = [
    { rotulo: 'Insumos', valor: formatarMoeda(custoIngredientes) },
    { rotulo: `Seu trabalho (${String(horasProducao).replace('.', ',')} h)`, valor: formatarMoeda(custoMaoDeObra) },
    { rotulo: 'Custos fixos rateados', valor: formatarMoeda(custoFixoRateado) },
    { rotulo: 'Embalagem', valor: formatarMoeda(custoEmbalagem) },
  ];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.cabecalho}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <ThemedText type="link" themeColor="accent">
              ← Ficha técnica
            </ThemedText>
          </Pressable>
          <ThemedText type="subtitle" style={styles.tituloTela}>
            Preço
          </ThemedText>
        </View>

        <ScrollView contentContainerStyle={styles.conteudo}>
          <ThemedText type="small" themeColor="accent" style={styles.rotuloNome}>
            {nome.toUpperCase()}
          </ThemedText>

          <ThemedText type="title" style={styles.precoGrande}>
            {formatarMoeda(precoPorUnidade)}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            por {unidadeSingular}
          </ThemedText>

          <View style={[styles.divisor, { backgroundColor: theme.border }]} />

          {linhas.map((linha) => (
            <View key={linha.rotulo} style={[styles.linha, { borderBottomColor: theme.border }]}>
              <ThemedText type="small">{linha.rotulo}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {linha.valor}
              </ThemedText>
            </View>
          ))}

          <View style={[styles.linha, { borderBottomColor: theme.border }]}>
            <ThemedText type="small" themeColor="accent">
              Custo total
            </ThemedText>
            <ThemedText type="subtitle" style={styles.linhaValorGrande}>
              {formatarMoeda(custoTotal)}
            </ThemedText>
          </View>

          <View style={styles.linha}>
            <ThemedText type="small" themeColor="amberDeep">
              Lucro de {margemLucro}%
            </ThemedText>
            <ThemedText type="subtitle" themeColor="amberDeep" style={styles.linhaValorGrande}>
              {formatarMoeda(lucro)}
            </ThemedText>
          </View>

          <Pressable onPress={() => router.back()}>
            <View style={[styles.botaoContorno, { borderColor: theme.border }]}>
              <ThemedText type="smallBold">Ajustar receita</ThemedText>
            </View>
          </Pressable>

          <ThemedText type="small" themeColor="textSecondary" style={styles.notaFinal}>
            Cada {unidadeSingular} precisa sair por {formatarMoeda(precoPorUnidade)} para a receita fechar em{' '}
            {formatarMoeda(precoPorUnidade * rendimento)}.
          </ThemedText>
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
  cabecalho: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    gap: Spacing.half,
  },
  tituloTela: {
    fontSize: 28,
    lineHeight: 32,
  },
  conteudo: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.one,
  },
  rotuloNome: {
    letterSpacing: 1.5,
  },
  precoGrande: {
    fontSize: 52,
    lineHeight: 56,
    fontWeight: '300',
    marginTop: Spacing.one,
  },
  divisor: {
    height: 1,
    marginVertical: Spacing.four,
  },
  linha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
  },
  linhaValorGrande: {
    fontSize: 19,
  },
  botaoContorno: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: Spacing.one,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.four,
  },
  notaFinal: {
    fontStyle: 'italic',
    marginTop: Spacing.three,
    lineHeight: 20,
  },
});
