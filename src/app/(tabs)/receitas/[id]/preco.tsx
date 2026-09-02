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

type Layout = 'ficha' | 'etiqueta' | 'recibo';

const LAYOUTS: { valor: Layout; rotulo: string }[] = [
  { valor: 'ficha', rotulo: 'Ficha' },
  { valor: 'etiqueta', rotulo: 'Etiqueta' },
  { valor: 'recibo', rotulo: 'Recibo' },
];

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

  const [layout, setLayout] = useState<Layout>('ficha');
  const [porFatia, setPorFatia] = useState(true);

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
  const precoTotal = custoTotal * (1 + margemLucro / 100);
  const lucroTotal = precoTotal - custoTotal;
  const divisor = porFatia ? Math.max(rendimento, 1) : 1;
  const precoExibido = precoTotal / divisor;
  const custoExibido = custoTotal / divisor;
  const lucroExibido = lucroTotal / divisor;
  const unidadeSingular = unidadeRendimento.replace(/s$/, '');
  const unidadeLabel = porFatia ? `por ${unidadeSingular}` : 'a receita inteira';
  const rendimentoLabel = `${rendimento} ${unidadeRendimento}`;
  const horasLabel = String(horasProducao).replace('.', ',');

  const linhas = [
    { rotulo: 'Insumos', valor: formatarMoeda(custoIngredientes / divisor) },
    { rotulo: `Seu trabalho (${horasLabel} h)`, valor: formatarMoeda(custoMaoDeObra / divisor) },
    { rotulo: 'Custos fixos rateados', valor: formatarMoeda(custoFixoRateado / divisor) },
    { rotulo: 'Embalagem', valor: formatarMoeda(custoEmbalagem / divisor) },
  ];

  const notaFinal = porFatia
    ? `Cada ${unidadeSingular} precisa sair por ${formatarMoeda(precoExibido)} para a receita fechar em ${formatarMoeda(precoTotal)}.`
    : `Se cobrar menos de ${formatarMoeda(custoTotal)} você paga para trabalhar.`;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.cabecalho}>
          <Pressable onPress={() => router.navigate(`/receitas/${receitaId}`)} hitSlop={8}>
            <ThemedText type="link" themeColor="accent">
              ← Ficha técnica
            </ThemedText>
          </Pressable>
          <View style={styles.tituloRow}>
            <ThemedText type="subtitle" style={styles.tituloTela}>
              Preço
            </ThemedText>
            <Segmentado
              opcoes={[
                { valor: 'inteira', rotulo: 'Inteira' },
                { valor: 'unidade', rotulo: 'Unidade' },
              ]}
              valor={porFatia ? 'unidade' : 'inteira'}
              onSelecionar={(v) => setPorFatia(v === 'unidade')}
            />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.conteudo}>
          <Segmentado opcoes={LAYOUTS} valor={layout} onSelecionar={setLayout} preencher />

          {layout === 'ficha' && (
            <View style={styles.fichaBox}>
              <ThemedText type="small" themeColor="accent" style={styles.rotuloUppercase}>
                {nome.toUpperCase()}
              </ThemedText>
              <ThemedText type="title" style={styles.precoGrande}>
                {formatarMoeda(precoExibido)}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {unidadeLabel}
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
                  {formatarMoeda(custoExibido)}
                </ThemedText>
              </View>

              <View style={styles.linha}>
                <ThemedText type="small" themeColor="amberDeep">
                  Lucro de {margemLucro}%
                </ThemedText>
                <ThemedText type="subtitle" themeColor="amberDeep" style={styles.linhaValorGrande}>
                  {formatarMoeda(lucroExibido)}
                </ThemedText>
              </View>
            </View>
          )}

          {layout === 'etiqueta' && (
            <>
              <View style={[styles.etiquetaOuter, { borderColor: theme.amber }]}>
                <View style={[styles.etiquetaInner, { backgroundColor: theme.backgroundElement }]}>
                  <ThemedText type="small" themeColor="accent" style={styles.rotuloUppercase}>
                    Preço sugerido
                  </ThemedText>
                  <ThemedText type="title" style={styles.precoEtiqueta}>
                    {formatarMoeda(precoExibido)}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {unidadeLabel} · {nome}
                  </ThemedText>
                  <View style={[styles.etiquetaDivisor, { backgroundColor: theme.amber }]} />
                  <ThemedText type="small" themeColor="textSecondary" style={styles.centralizado}>
                    Custo {formatarMoeda(custoExibido)} · lucro {formatarMoeda(lucroExibido)}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.chipsRow}>
                {linhas.map((linha) => (
                  <View key={linha.rotulo} style={[styles.chip, { borderColor: theme.border }]}>
                    <ThemedText type="small" themeColor="textSecondary">
                      {linha.rotulo}{' '}
                    </ThemedText>
                    <ThemedText type="small">{linha.valor}</ThemedText>
                  </View>
                ))}
              </View>
            </>
          )}

          {layout === 'recibo' && (
            <View style={[styles.reciboBox, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <ThemedText type="small" themeColor="accent" style={[styles.rotuloUppercase, styles.centralizado]}>
                {nome.toUpperCase()}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={[styles.centralizado, styles.reciboSubtitulo]}>
                {rendimentoLabel} · {unidadeLabel}
              </ThemedText>

              <View style={[styles.reciboTracejado, { borderColor: theme.border }]} />

              {linhas.map((linha) => (
                <View key={linha.rotulo} style={styles.reciboLinha}>
                  <ThemedText type="small">{linha.rotulo}</ThemedText>
                  <View style={[styles.reciboPontilhado, { borderColor: theme.border }]} />
                  <ThemedText type="small">{linha.valor}</ThemedText>
                </View>
              ))}

              <View style={[styles.reciboTracejado, { borderColor: theme.border }]} />

              <View style={styles.reciboLinha}>
                <ThemedText type="small">Custo total</ThemedText>
                <ThemedText type="small">{formatarMoeda(custoExibido)}</ThemedText>
              </View>
              <View style={styles.reciboLinha}>
                <ThemedText type="small" themeColor="amberDeep">
                  Margem {margemLucro}%
                </ThemedText>
                <ThemedText type="small" themeColor="amberDeep">
                  {formatarMoeda(lucroExibido)}
                </ThemedText>
              </View>

              <View style={[styles.reciboVenderPor, { borderColor: theme.text }]}>
                <ThemedText type="subtitle" style={styles.reciboVenderPorRotulo}>
                  Vender por
                </ThemedText>
                <ThemedText type="subtitle" style={styles.reciboVenderPorValor}>
                  {formatarMoeda(precoExibido)}
                </ThemedText>
              </View>
            </View>
          )}

          <Pressable onPress={() => router.navigate(`/receitas/${receitaId}`)}>
            <View style={[styles.botaoContorno, { borderColor: theme.border }]}>
              <ThemedText type="smallBold">Ajustar receita</ThemedText>
            </View>
          </Pressable>

          <ThemedText type="small" themeColor="textSecondary" style={styles.notaFinal}>
            {notaFinal}
          </ThemedText>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function Segmentado<T extends string>({
  opcoes,
  valor,
  onSelecionar,
  preencher,
}: {
  opcoes: { valor: T; rotulo: string }[];
  valor: T;
  onSelecionar: (valor: T) => void;
  preencher?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.segmentado, { borderColor: theme.border }, preencher && styles.segmentadoPreencher]}>
      {opcoes.map((opcao, index) => {
        const ativo = opcao.valor === valor;
        return (
          <Pressable
            key={opcao.valor}
            onPress={() => onSelecionar(opcao.valor)}
            style={preencher && styles.segmentadoItemFlex}>
            <View
              style={[
                styles.segmentadoItem,
                index > 0 && { borderLeftWidth: 1, borderLeftColor: theme.border },
                ativo && { backgroundColor: theme.accent },
              ]}>
              <ThemedText type="small" themeColor={ativo ? 'backgroundElement' : 'text'} style={styles.centralizado}>
                {opcao.rotulo}
              </ThemedText>
            </View>
          </Pressable>
        );
      })}
    </View>
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
  tituloRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.three,
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
  segmentado: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: Spacing.one,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  segmentadoPreencher: {
    alignSelf: 'stretch',
    marginBottom: Spacing.three,
  },
  segmentadoItemFlex: {
    flex: 1,
  },
  segmentadoItem: {
    minHeight: 34,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centralizado: {
    textAlign: 'center',
  },
  fichaBox: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(75,52,44,0.2)',
    paddingTop: Spacing.three,
  },
  rotuloUppercase: {
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
  etiquetaOuter: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    padding: Spacing.half,
  },
  etiquetaInner: {
    borderWidth: 1,
    borderColor: 'rgba(182,130,53,0.45)',
    borderRadius: Spacing.one,
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
  },
  precoEtiqueta: {
    fontSize: 54,
    lineHeight: 58,
    fontWeight: '300',
    marginTop: Spacing.two,
  },
  etiquetaDivisor: {
    width: 56,
    height: 1,
    marginVertical: Spacing.three,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
  chip: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: Spacing.one,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  reciboBox: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.three,
  },
  reciboSubtitulo: {
    marginTop: Spacing.one,
  },
  reciboTracejado: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
    marginVertical: Spacing.three,
  },
  reciboLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  reciboPontilhado: {
    flex: 1,
    borderBottomWidth: 1,
    borderStyle: 'dotted',
  },
  reciboVenderPor: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: Spacing.three,
    marginTop: Spacing.three,
  },
  reciboVenderPorRotulo: {
    fontSize: 18,
  },
  reciboVenderPorValor: {
    fontSize: 32,
    lineHeight: 36,
  },
  botaoContorno: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: Spacing.one,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.five,
  },
  notaFinal: {
    fontStyle: 'italic',
    marginTop: Spacing.three,
    lineHeight: 20,
  },
});
