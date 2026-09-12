import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { buscarConfiguracao } from '@/database/configuracaoRepository';
import { listarProdutos } from '@/database/produtoRepository';
import { buscarReceitaMaisRecente, listarReceitasFixadas } from '@/database/receitaRepository';
import { Configuracao, Produto, Receita } from '@/models';
import { calcularAlertaValidade } from '@/services/alertaValidade';
import { calcularCustoTotalReceita } from '@/services/calculoCusto';
import { calcularCustoFixoRateado } from '@/services/calculoCustoFixo';
import { calcularCustoMaoDeObra } from '@/services/calculoMaoDeObra';
import { calcularPrecoVenda } from '@/services/calculoMargem';
import { listarReceitasPorProdutividade } from '@/services/calculoProdutividade';
import { formatarMoeda } from '@/utils/formatarMoeda';

type ReceitaRecente = {
  id: number;
  nome: string;
  rendimentoLabel: string;
  custoTotal: number;
  precoVenda: number;
};

type ReceitaFixada = {
  id: number;
  nome: string;
  rendimentoLabel: string;
  precoVenda: number;
};

type ReceitaMaisProdutiva = {
  id: number;
  nome: string;
  horasProducaoLabel: string;
  lucroPorHora: number;
};

function calcularResumoReceita(receita: Receita, configuracao: Configuracao, custoFixoRateado: number) {
  const custoIngredientes = calcularCustoTotalReceita(receita.id);
  const custoMaoDeObra = calcularCustoMaoDeObra(receita.horas_producao, configuracao.valor_hora_mao_de_obra);
  const custoTotal = custoIngredientes + custoMaoDeObra + receita.custo_embalagem;

  return {
    custoTotal: custoTotal + custoFixoRateado,
    precoVenda: calcularPrecoVenda(custoTotal, receita.rendimento, receita.margem_lucro, custoFixoRateado),
  };
}

function saudacao(): string {
  const hora = new Date().getHours();
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

function dataFormatada(): string {
  const texto = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function montarAvisoValidade(produtos: Produto[]): string | null {
  const vencendo = produtos.filter((produto) => calcularAlertaValidade(produto.data_validade) === 'vermelho');

  if (vencendo.length === 0) return null;
  if (vencendo.length === 1) return `${vencendo[0].nome} vence em breve — use logo nas próximas produções.`;

  return `${vencendo.map((produto) => produto.nome).join(', ')} vencem em breve — use logo nas próximas produções.`;
}

export default function InicioScreen() {
  const theme = useTheme();

  const [primeiroNome, setPrimeiroNome] = useState('');
  const [inicial, setInicial] = useState('?');
  const [receitaRecente, setReceitaRecente] = useState<ReceitaRecente | null>(null);
  const [receitasFixadas, setReceitasFixadas] = useState<ReceitaFixada[]>([]);
  const [maisProdutiva, setMaisProdutiva] = useState<ReceitaMaisProdutiva | null>(null);
  const [insumosCount, setInsumosCount] = useState(0);
  const [custoFixoRateado, setCustoFixoRateado] = useState(0);
  const [avisoValidade, setAvisoValidade] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const configuracao = buscarConfiguracao();

      if (!configuracao.onboarding_visto) {
        router.replace('/onboarding');
        return;
      }

      const produtos = listarProdutos();
      const receita = buscarReceitaMaisRecente();

      const custoFixo = calcularCustoFixoRateado();

      setPrimeiroNome(configuracao.nome_usuario.trim().split(' ')[0] || '');
      setInicial(configuracao.nome_usuario.trim().charAt(0).toUpperCase() || '?');
      setInsumosCount(produtos.length);
      setCustoFixoRateado(custoFixo);
      setAvisoValidade(montarAvisoValidade(produtos));

      if (receita) {
        const resumo = calcularResumoReceita(receita, configuracao, custoFixo);
        setReceitaRecente({
          id: receita.id,
          nome: receita.nome,
          rendimentoLabel: `${receita.rendimento} ${receita.unidade_rendimento}`,
          custoTotal: resumo.custoTotal,
          precoVenda: resumo.precoVenda,
        });
      } else {
        setReceitaRecente(null);
      }

      setReceitasFixadas(
        listarReceitasFixadas().map((r) => ({
          id: r.id,
          nome: r.nome,
          rendimentoLabel: `${r.rendimento} ${r.unidade_rendimento}`,
          precoVenda: calcularResumoReceita(r, configuracao, custoFixo).precoVenda,
        }))
      );

      const ranking = listarReceitasPorProdutividade();
      setMaisProdutiva(
        ranking.length > 0
          ? {
              id: ranking[0].id,
              nome: ranking[0].nome,
              horasProducaoLabel: String(ranking[0].horas_producao).replace('.', ','),
              lucroPorHora: ranking[0].lucroPorHora,
            }
          : null
      );
    }, [])
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.conteudo}>
          <View style={styles.cabecalho}>
            <View>
              <ThemedText type="small" themeColor="accent" style={styles.dataTexto}>
                {dataFormatada()}
              </ThemedText>
              <ThemedText type="subtitle" style={styles.saudacao}>
                {saudacao()}
                {primeiroNome ? `, ${primeiroNome}` : ''}
              </ThemedText>
            </View>
            <Pressable onPress={() => router.push('/perfil')}>
              <View style={[styles.avatar, { backgroundColor: theme.avatar, borderColor: theme.border }]}>
                <ThemedText type="subtitle" style={styles.avatarTexto}>
                  {inicial}
                </ThemedText>
              </View>
            </Pressable>
          </View>

          {receitaRecente ? (
            <View style={[styles.cardCalculo, { borderColor: theme.border }]}>
              <ThemedText type="small" themeColor="accent" style={styles.rotuloUppercase}>
                Último cálculo
              </ThemedText>
              <View style={styles.cardCalculoLinha}>
                <View style={styles.flex1}>
                  <ThemedText type="subtitle" style={styles.cardCalculoNome}>
                    {receitaRecente.nome}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {receitaRecente.rendimentoLabel} · custo {formatarMoeda(receitaRecente.custoTotal)}
                  </ThemedText>
                </View>
                <ThemedText type="title" style={styles.cardCalculoPreco}>
                  {formatarMoeda(receitaRecente.precoVenda)}
                </ThemedText>
              </View>
              <View style={[styles.divisor, { backgroundColor: theme.border }]} />
              <Pressable onPress={() => router.push(`/receitas/${receitaRecente.id}`)}>
                <View style={[styles.botaoAbrirFicha, { borderColor: theme.amber }]}>
                  <ThemedText type="smallBold" themeColor="amberDeep">
                    Abrir a ficha
                  </ThemedText>
                </View>
              </Pressable>
            </View>
          ) : (
            <View style={[styles.cardCalculo, { borderColor: theme.border }]}>
              <ThemedText type="small" themeColor="accent" style={styles.rotuloUppercase}>
                Último cálculo
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.semReceitaTexto}>
                Nenhuma receita calculada ainda.
              </ThemedText>
              <Pressable onPress={() => router.push('/receitas/nova')}>
                <View style={[styles.botaoAbrirFicha, { borderColor: theme.amber }]}>
                  <ThemedText type="smallBold" themeColor="amberDeep">
                    Nova receita
                  </ThemedText>
                </View>
              </Pressable>
            </View>
          )}

          {receitasFixadas.length > 0 && (
            <View style={styles.fixadasSecao}>
              <ThemedText type="small" themeColor="accent" style={styles.rotuloUppercase}>
                Receitas fixadas
              </ThemedText>
              {receitasFixadas.map((receita) => (
                <Pressable key={receita.id} onPress={() => router.push(`/receitas/${receita.id}`)}>
                  <View style={[styles.fixadaLinha, { borderColor: theme.border }]}>
                    <View style={styles.flex1}>
                      <ThemedText type="subtitle" style={styles.fixadaNome}>
                        {receita.nome}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {receita.rendimentoLabel}
                      </ThemedText>
                    </View>
                    <ThemedText type="smallBold" themeColor="amberDeep">
                      {formatarMoeda(receita.precoVenda)}
                    </ThemedText>
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          {maisProdutiva && (
            <Pressable onPress={() => router.push('/receitas/ranking')}>
              <View style={[styles.cardProdutividade, { borderColor: theme.amber }]}>
                <ThemedText type="small" themeColor="accent" style={styles.rotuloUppercase}>
                  Mais rende por hora
                </ThemedText>
                <View style={styles.cardCalculoLinha}>
                  <View style={styles.flex1}>
                    <ThemedText type="subtitle" style={styles.cardCalculoNome}>
                      {maisProdutiva.nome}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {maisProdutiva.horasProducaoLabel}h de produção
                    </ThemedText>
                  </View>
                  <ThemedText type="title" style={styles.cardCalculoPreco}>
                    {formatarMoeda(maisProdutiva.lucroPorHora)}/h
                  </ThemedText>
                </View>
                <ThemedText type="small" themeColor="amberDeep" style={styles.verRankingTexto}>
                  Ver ranking completo →
                </ThemedText>
              </View>
            </Pressable>
          )}

          <View style={styles.statsRow}>
            <View style={[styles.statBox, { borderColor: theme.border }]}>
              <ThemedText type="small" themeColor="accent" style={styles.rotuloUppercaseSmall}>
                Dispensa
              </ThemedText>
              <ThemedText type="subtitle" style={styles.statValor}>
                {insumosCount}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                insumos cadastrados
              </ThemedText>
            </View>
            <View style={[styles.statBox, { borderColor: theme.border }]}>
              <ThemedText type="small" themeColor="accent" style={styles.rotuloUppercaseSmall}>
                Custos fixos
              </ThemedText>
              <ThemedText type="subtitle" style={styles.statValor}>
                {formatarMoeda(custoFixoRateado)}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                por produção
              </ThemedText>
            </View>
          </View>

          {avisoValidade && (
            <ThemedText type="small" themeColor="textSecondary" style={styles.aviso}>
              {avisoValidade}
            </ThemedText>
          )}
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
    paddingTop: Spacing.four,
    paddingBottom: Spacing.six + BottomTabInset,
    gap: Spacing.three,
  },
  cabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dataTexto: {
    letterSpacing: 1.5,
  },
  saudacao: {
    fontSize: 30,
    lineHeight: 36,
    marginTop: Spacing.one,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexto: {
    fontSize: 17,
    lineHeight: 20,
  },
  cardCalculo: {
    marginTop: Spacing.three,
    borderWidth: 1,
    borderRadius: Spacing.two,
    padding: Spacing.three,
  },
  rotuloUppercase: {
    letterSpacing: 1.5,
  },
  cardCalculoLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  flex1: {
    flex: 1,
  },
  cardCalculoNome: {
    fontSize: 21,
    lineHeight: 25,
  },
  cardCalculoPreco: {
    fontSize: 32,
    lineHeight: 36,
  },
  semReceitaTexto: {
    marginTop: Spacing.two,
    marginBottom: Spacing.one,
  },
  divisor: {
    height: 1,
    marginVertical: Spacing.three,
  },
  botaoAbrirFicha: {
    alignSelf: 'flex-start',
    minHeight: 38,
    borderWidth: 1,
    borderRadius: Spacing.one,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fixadasSecao: {
    gap: Spacing.two,
  },
  fixadaLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Spacing.two,
    padding: Spacing.three,
  },
  fixadaNome: {
    fontSize: 18,
    lineHeight: 22,
  },
  cardProdutividade: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  verRankingTexto: {
    marginTop: Spacing.one,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  statBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Spacing.two,
    padding: Spacing.three,
  },
  rotuloUppercaseSmall: {
    letterSpacing: 1,
  },
  statValor: {
    fontSize: 26,
    lineHeight: 30,
    marginTop: Spacing.one,
  },
  aviso: {
    fontStyle: 'italic',
    marginTop: Spacing.two,
    lineHeight: 20,
  },
});
