import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SeletorUnidade } from '@/components/seletor-unidade';
import { SliderAjuste } from '@/components/slider-ajuste';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { buscarConfiguracao } from '@/database/configuracaoRepository';
import { inserirProduto, listarProdutos } from '@/database/produtoRepository';
import {
  atualizarFixada,
  atualizarIngredienteReceita,
  atualizarReceita,
  buscarReceitaPorId,
  contarReceitasFixadas,
  duplicarReceita,
  excluirIngredienteReceita,
  excluirReceita,
  inserirIngredienteReceita,
  listarIngredientesPorReceita,
} from '@/database/receitaRepository';
import { useTheme } from '@/hooks/use-theme';
import { Produto, Receita, Unidade } from '@/models';
import { calcularCustoIngrediente } from '@/services/calculoCusto';
import { calcularCustoFixoRateado, calcularTotalCustosFixos } from '@/services/calculoCustoFixo';
import { calcularCustoMaoDeObra } from '@/services/calculoMaoDeObra';
import { listarUnidadesCompativeis, TODAS_UNIDADES } from '@/utils/converterUnidade';
import { formatarMoeda } from '@/utils/formatarMoeda';
import { listarTags } from '@/utils/listarTags';

type IngredienteView = {
  ingredienteId: number;
  produtoId: number;
  nome: string;
  marca: string | null;
  quantidadeUsada: number;
  unidadeUsada: Unidade;
  unidadeCompra: Unidade;
  custo: number;
};

function passoQuantidade(unidade: Unidade): number {
  if (unidade === 'un') return 1;
  if (unidade === 'kg' || unidade === 'l') return 0.05;
  return 10;
}

function formatarQuantidade(quantidade: number, unidade: Unidade): string {
  if (unidade === 'kg' || unidade === 'l') {
    return quantidade.toFixed(2).replace('.', ',');
  }
  const arredondado = Math.round(quantidade * 100) / 100;
  return String(arredondado).replace('.', ',');
}

function dataDeHoje(): string {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function quantidadeInicial(unidade: Unidade): number {
  if (unidade === 'un') return 1;
  if (unidade === 'kg' || unidade === 'l') return 0.25;
  return 100;
}

export default function ReceitaDetalheScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const receitaId = Number(id);

  const [carregando, setCarregando] = useState(true);
  const [naoEncontrado, setNaoEncontrado] = useState(false);

  const [nome, setNome] = useState('');
  const [nomeRascunho, setNomeRascunho] = useState('');
  const [editandoNome, setEditandoNome] = useState(false);

  const [rendimento, setRendimento] = useState(0);
  const [rendimentoTexto, setRendimentoTexto] = useState('');
  const [unidadeRendimento, setUnidadeRendimento] = useState<Unidade>('un');
  const [margemLucro, setMargemLucro] = useState(0);
  const [horasProducao, setHorasProducao] = useState(0.5);
  const [custoEmbalagem, setCustoEmbalagem] = useState(0);
  const [custoEmbalagemTexto, setCustoEmbalagemTexto] = useState('0');
  const [anotacoes, setAnotacoes] = useState('');
  const [fixada, setFixada] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [novaTagTexto, setNovaTagTexto] = useState('');

  const [ingredientes, setIngredientes] = useState<IngredienteView[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [pickerAberto, setPickerAberto] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const [editandoQuantidadeId, setEditandoQuantidadeId] = useState<number | null>(null);
  const [quantidadeRascunho, setQuantidadeRascunho] = useState('');

  const [valorHoraMaoDeObra, setValorHoraMaoDeObra] = useState(0);
  const [totalCustosFixos, setTotalCustosFixos] = useState(0);
  const [receitasEstimadasPorMes, setReceitasEstimadasPorMes] = useState(0);
  const [custoFixoRateado, setCustoFixoRateado] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const receita = buscarReceitaPorId(receitaId);

      if (!receita) {
        setNaoEncontrado(true);
        setCarregando(false);
        return;
      }

      const todosProdutos = listarProdutos();
      const ingredientesReceita = listarIngredientesPorReceita(receitaId);

      const ingredientesView = ingredientesReceita
        .map((ingrediente) => {
          const produto = todosProdutos.find((p) => p.id === ingrediente.produto_id);
          if (!produto) return null;

          return {
            ingredienteId: ingrediente.id,
            produtoId: produto.id,
            nome: produto.nome,
            marca: produto.marca,
            quantidadeUsada: ingrediente.quantidade_usada,
            unidadeUsada: ingrediente.unidade_usada,
            unidadeCompra: produto.unidade,
            custo: calcularCustoIngrediente(produto, ingrediente),
          };
        })
        .filter((item): item is IngredienteView => item !== null);

      const configuracao = buscarConfiguracao();

      setNome(receita.nome);
      setRendimento(receita.rendimento);
      setRendimentoTexto(String(receita.rendimento));
      setUnidadeRendimento(receita.unidade_rendimento);
      setMargemLucro(receita.margem_lucro);
      setHorasProducao(receita.horas_producao);
      setCustoEmbalagem(receita.custo_embalagem);
      setCustoEmbalagemTexto(String(receita.custo_embalagem));
      setAnotacoes(receita.anotacoes);
      setFixada(receita.fixada);
      setTags(listarTags(receita.tags));
      setIngredientes(ingredientesView);
      setProdutos(todosProdutos);
      setValorHoraMaoDeObra(configuracao.valor_hora_mao_de_obra);
      setReceitasEstimadasPorMes(configuracao.receitas_estimadas_por_mes);
      setTotalCustosFixos(calcularTotalCustosFixos());
      setCustoFixoRateado(calcularCustoFixoRateado());
      setNaoEncontrado(false);
      setCarregando(false);
      setEditandoNome(false);
      setPickerAberto(false);
    }, [receitaId])
  );

  function persistir(parciais: Partial<Omit<Receita, 'id' | 'criado_em'>>) {
    atualizarReceita(receitaId, {
      nome,
      rendimento,
      unidade_rendimento: unidadeRendimento,
      margem_lucro: margemLucro,
      horas_producao: horasProducao,
      custo_embalagem: custoEmbalagem,
      anotacoes,
      fixada,
      tags: tags.join(','),
      ...parciais,
    });
  }

  function adicionarTag() {
    const tagTratada = novaTagTexto.trim();
    setNovaTagTexto('');
    if (!tagTratada || tags.some((tag) => tag.toLowerCase() === tagTratada.toLowerCase())) return;

    const novasTags = [...tags, tagTratada];
    setTags(novasTags);
    persistir({ tags: novasTags.join(',') });
  }

  function removerTag(tag: string) {
    const novasTags = tags.filter((t) => t !== tag);
    setTags(novasTags);
    persistir({ tags: novasTags.join(',') });
  }

  function confirmarAnotacoes() {
    persistir({ anotacoes });
  }

  function confirmarNome() {
    setEditandoNome(false);
    const nomeTratado = nomeRascunho.trim();
    if (!nomeTratado || nomeTratado === nome) return;
    setNome(nomeTratado);
    persistir({ nome: nomeTratado });
  }

  function handleAlternarFixada() {
    if (fixada === 1) {
      setFixada(0);
      atualizarFixada(receitaId, false);
      return;
    }
    if (contarReceitasFixadas() >= 5) {
      Alert.alert(
        'Limite de receitas fixadas',
        'Você já tem 5 receitas fixadas na tela Início. Remova uma antes de fixar esta.'
      );
      return;
    }
    setFixada(1);
    atualizarFixada(receitaId, true);
  }

  function confirmarRendimento() {
    const numero = Number(rendimentoTexto.replace(',', '.'));
    if (!rendimentoTexto || Number.isNaN(numero) || numero <= 0) {
      setRendimentoTexto(String(rendimento));
      return;
    }
    setRendimento(numero);
    persistir({ rendimento: numero });
  }

  function handleAlterarUnidadeRendimento(unidade: Unidade) {
    setUnidadeRendimento(unidade);
    persistir({ unidade_rendimento: unidade });
  }

  function confirmarEmbalagem() {
    const numero = Number(custoEmbalagemTexto.replace(',', '.'));
    if (custoEmbalagemTexto === '' || Number.isNaN(numero) || numero < 0) {
      setCustoEmbalagemTexto(String(custoEmbalagem));
      return;
    }
    setCustoEmbalagem(numero);
    persistir({ custo_embalagem: numero });
  }

  function handleFinalizarMargem(nova: number) {
    persistir({ margem_lucro: nova });
  }

  function handleFinalizarHoras(nova: number) {
    persistir({ horas_producao: nova });
  }

  function handleAjustarQuantidade(item: IngredienteView, direcao: 1 | -1) {
    const passo = passoQuantidade(item.unidadeUsada);
    const novaQuantidade = Math.max(0, Number((item.quantidadeUsada + direcao * passo).toFixed(2)));
    atualizarQuantidadeOuUnidade(item, novaQuantidade, item.unidadeUsada);
  }

  function handleAlterarUnidade(item: IngredienteView, unidade: Unidade) {
    atualizarQuantidadeOuUnidade(item, item.quantidadeUsada, unidade);
  }

  function abrirEdicaoQuantidade(item: IngredienteView) {
    setQuantidadeRascunho(String(item.quantidadeUsada).replace('.', ','));
    setEditandoQuantidadeId(item.ingredienteId);
  }

  function confirmarQuantidade(item: IngredienteView) {
    setEditandoQuantidadeId(null);
    const numero = Number(quantidadeRascunho.replace(',', '.'));
    if (!quantidadeRascunho || Number.isNaN(numero) || numero < 0) return;
    atualizarQuantidadeOuUnidade(item, Number(numero.toFixed(2)), item.unidadeUsada);
  }

  function atualizarQuantidadeOuUnidade(item: IngredienteView, quantidade: number, unidade: Unidade) {
    atualizarIngredienteReceita(item.ingredienteId, { quantidade_usada: quantidade, unidade_usada: unidade });

    const produto = produtos.find((p) => p.id === item.produtoId);
    if (!produto) return;

    const custo = calcularCustoIngrediente(produto, {
      id: item.ingredienteId,
      receita_id: receitaId,
      produto_id: item.produtoId,
      quantidade_usada: quantidade,
      unidade_usada: unidade,
    });

    setIngredientes((atual) =>
      atual.map((i) =>
        i.ingredienteId === item.ingredienteId ? { ...i, quantidadeUsada: quantidade, unidadeUsada: unidade, custo } : i
      )
    );
  }

  function removerIngrediente(item: IngredienteView) {
    excluirIngredienteReceita(item.ingredienteId);
    setIngredientes((atual) => atual.filter((i) => i.ingredienteId !== item.ingredienteId));
  }

  function alternarProdutoNaReceita(produto: Produto) {
    const existente = ingredientes.find((i) => i.produtoId === produto.id);

    if (existente) {
      removerIngrediente(existente);
      return;
    }

    const inicial = quantidadeInicial(produto.unidade);
    const novoId = inserirIngredienteReceita({
      receita_id: receitaId,
      produto_id: produto.id,
      quantidade_usada: inicial,
      unidade_usada: produto.unidade,
    });
    const custo = calcularCustoIngrediente(produto, {
      id: novoId,
      receita_id: receitaId,
      produto_id: produto.id,
      quantidade_usada: inicial,
      unidade_usada: produto.unidade,
    });

    setIngredientes((atual) => [
      ...atual,
      {
        ingredienteId: novoId,
        produtoId: produto.id,
        nome: produto.nome,
        marca: produto.marca,
        quantidadeUsada: inicial,
        unidadeUsada: produto.unidade,
        unidadeCompra: produto.unidade,
        custo,
      },
    ]);
  }

  function handleMetadeOuDobro(fator: 2 | 0.5) {
    const novoRendimento = Math.max(1, Math.round(rendimento * fator));
    const fatorHoras = fator === 2 ? 1.5 : 0.7;
    const novasHoras = Math.max(0.5, Math.min(10, Number((horasProducao * fatorHoras).toFixed(1))));

    const novosIngredientes = ingredientes.map((item) => {
      const novaQuantidade = Number((item.quantidadeUsada * fator).toFixed(2));
      atualizarIngredienteReceita(item.ingredienteId, {
        quantidade_usada: novaQuantidade,
        unidade_usada: item.unidadeUsada,
      });

      const produto = produtos.find((p) => p.id === item.produtoId);
      const custo = produto
        ? calcularCustoIngrediente(produto, {
            id: item.ingredienteId,
            receita_id: receitaId,
            produto_id: item.produtoId,
            quantidade_usada: novaQuantidade,
            unidade_usada: item.unidadeUsada,
          })
        : item.custo;

      return { ...item, quantidadeUsada: novaQuantidade, custo };
    });

    setIngredientes(novosIngredientes);
    setRendimento(novoRendimento);
    setRendimentoTexto(String(novoRendimento));
    setHorasProducao(novasHoras);
    persistir({ rendimento: novoRendimento, horas_producao: novasHoras });
  }

  function handleDuplicar() {
    setMenuAberto(false);
    const novoId = duplicarReceita(receitaId);
    if (novoId) {
      router.navigate(`/receitas/${novoId}`);
    }
  }

  function handleExcluir() {
    setMenuAberto(false);
    Alert.alert('Excluir receita', `Tem certeza que deseja excluir "${nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          excluirReceita(receitaId);
          router.navigate('/receitas');
        },
      },
    ]);
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

  const custoIngredientes = ingredientes.reduce((total, item) => total + item.custo, 0);
  const custoMaoDeObra = calcularCustoMaoDeObra(horasProducao, valorHoraMaoDeObra);
  const custoTotal = custoIngredientes + custoMaoDeObra + custoFixoRateado + custoEmbalagem;
  const precoVenda = rendimento > 0 ? (custoTotal / rendimento) * (1 + margemLucro / 100) : 0;
  const lucroTotal = custoTotal * (margemLucro / 100);

  const produtosDisponiveis = [...produtos].sort((a, b) => a.nome.localeCompare(b.nome));

  function handleTransformarEmProduto() {
    setMenuAberto(false);
    const novoProdutoId = inserirProduto({
      nome,
      marca: 'Receita própria',
      valor_pago: Math.round(custoTotal * 100) / 100,
      quantidade: rendimento,
      unidade: unidadeRendimento,
      data_compra: dataDeHoje(),
      data_validade: null,
    });
    router.navigate(`/dispensa/${novoProdutoId}`);
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.cabecalho}>
          <View style={styles.topoRow}>
            <Pressable onPress={() => router.navigate('/receitas')} hitSlop={8}>
              <ThemedText type="link" themeColor="accent">
                ← Receitas
              </ThemedText>
            </Pressable>
            <Pressable onPress={() => setMenuAberto(true)} hitSlop={8}>
              <ThemedText type="subtitle" themeColor="textSecondary" style={styles.engrenagem}>
                ⚙
              </ThemedText>
            </Pressable>
          </View>

          <View style={styles.tituloComFixarRow}>
            <View style={styles.flex1}>
              {editandoNome ? (
                <TextInput
                  value={nomeRascunho}
                  onChangeText={setNomeRascunho}
                  onBlur={confirmarNome}
                  onSubmitEditing={confirmarNome}
                  autoFocus
                  style={[styles.tituloInput, { color: theme.text, borderBottomColor: theme.border }]}
                />
              ) : (
                <Pressable
                  onPress={() => {
                    setNomeRascunho(nome);
                    setEditandoNome(true);
                  }}>
                  <View style={styles.tituloRow}>
                    <ThemedText type="subtitle" style={styles.titulo}>
                      {nome}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      ✎
                    </ThemedText>
                  </View>
                </Pressable>
              )}
            </View>
            <Pressable onPress={handleAlternarFixada} hitSlop={8}>
              <ThemedText type="subtitle" themeColor={fixada ? 'amber' : 'textSecondary'} style={styles.estrela}>
                {fixada ? '★' : '☆'}
              </ThemedText>
            </Pressable>
          </View>

          <ThemedText type="small" themeColor="textSecondary">
            {rendimento} {unidadeRendimento} · {ingredientes.length} insumos · custo {formatarMoeda(custoTotal)}
          </ThemedText>

          <View style={styles.tagsRow}>
            {tags.map((tag) => (
              <Pressable key={tag} onPress={() => removerTag(tag)}>
                <View style={[styles.tagChip, { borderColor: theme.border }]}>
                  <ThemedText type="small" themeColor="accent">
                    {tag} ×
                  </ThemedText>
                </View>
              </Pressable>
            ))}
            <TextInput
              value={novaTagTexto}
              onChangeText={setNovaTagTexto}
              onSubmitEditing={adicionarTag}
              onBlur={adicionarTag}
              placeholder="+ tag"
              placeholderTextColor={theme.textSecondary}
              style={[styles.tagInput, { color: theme.text }]}
            />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.conteudo}>
          <SecaoHeader titulo="Rendimento" />
          <View style={styles.rendimentoRow}>
            <View style={styles.rendimentoQuantas}>
              <ThemedText type="small" themeColor="textSecondary">
                Quantas
              </ThemedText>
              <TextInput
                value={rendimentoTexto}
                onChangeText={setRendimentoTexto}
                onBlur={confirmarRendimento}
                keyboardType="decimal-pad"
                style={[styles.inputSublinhado, { color: theme.text, borderBottomColor: theme.border }]}
              />
            </View>
            <View style={styles.flex1}>
              <ThemedText type="small" themeColor="textSecondary">
                Do quê
              </ThemedText>
              <SeletorUnidade
                value={unidadeRendimento}
                unidadesDisponiveis={TODAS_UNIDADES}
                onSelecionar={handleAlterarUnidadeRendimento}
              />
            </View>
          </View>
          <View style={styles.botoesRendimentoRow}>
            <Pressable style={styles.flex1} onPress={() => handleMetadeOuDobro(0.5)}>
              <View style={[styles.botaoContorno, { borderColor: theme.border }]}>
                <ThemedText type="smallBold">Metade da receita</ThemedText>
              </View>
            </Pressable>
            <Pressable style={styles.flex1} onPress={() => handleMetadeOuDobro(2)}>
              <View style={[styles.botaoContorno, { borderColor: theme.border }]}>
                <ThemedText type="smallBold">Dobrar receita</ThemedText>
              </View>
            </Pressable>
          </View>

          <SecaoHeader titulo="Insumos" valor={formatarMoeda(custoIngredientes)} />
          {ingredientes.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              Nenhum insumo adicionado ainda.
            </ThemedText>
          ) : (
            ingredientes.map((item) => {
              const unidadesCompativeis = listarUnidadesCompativeis(item.unidadeCompra);
              return (
                <View key={item.ingredienteId} style={[styles.ingredienteRow, { borderBottomColor: theme.border }]}>
                  <View style={styles.flex1}>
                    <ThemedText type="subtitle" style={styles.ingredienteNome}>
                      {item.nome}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {formatarMoeda(item.custo)} · {item.marca || 'sem marca'}
                    </ThemedText>
                  </View>
                  <View style={styles.ingredienteControles}>
                    <Pressable onPress={() => handleAjustarQuantidade(item, -1)} hitSlop={8}>
                      <View style={[styles.stepperBotao, { borderColor: theme.border }]}>
                        <ThemedText type="smallBold">−</ThemedText>
                      </View>
                    </Pressable>
                    {editandoQuantidadeId === item.ingredienteId ? (
                      <TextInput
                        value={quantidadeRascunho}
                        onChangeText={setQuantidadeRascunho}
                        onBlur={() => confirmarQuantidade(item)}
                        onSubmitEditing={() => confirmarQuantidade(item)}
                        keyboardType="decimal-pad"
                        autoFocus
                        selectTextOnFocus
                        style={[styles.qtdInput, { color: theme.text, borderBottomColor: theme.border }]}
                      />
                    ) : (
                      <Pressable onPress={() => abrirEdicaoQuantidade(item)} hitSlop={6}>
                        <ThemedText type="small" style={styles.qtdTexto}>
                          {formatarQuantidade(item.quantidadeUsada, item.unidadeUsada)}
                        </ThemedText>
                      </Pressable>
                    )}
                    {unidadesCompativeis.length > 1 ? (
                      <SeletorUnidade
                        value={item.unidadeUsada}
                        unidadesDisponiveis={unidadesCompativeis}
                        onSelecionar={(unidade) => handleAlterarUnidade(item, unidade)}
                      />
                    ) : (
                      <ThemedText type="small" themeColor="textSecondary">
                        {item.unidadeUsada}
                      </ThemedText>
                    )}
                    <Pressable onPress={() => handleAjustarQuantidade(item, 1)} hitSlop={8}>
                      <View style={[styles.stepperBotao, { borderColor: theme.border }]}>
                        <ThemedText type="smallBold">+</ThemedText>
                      </View>
                    </Pressable>
                    <Pressable onPress={() => removerIngrediente(item)} hitSlop={8}>
                      <ThemedText themeColor="danger" style={styles.removerX}>
                        ×
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}
          <Pressable onPress={() => setPickerAberto(true)}>
            <View style={[styles.botaoTracejado, { borderColor: theme.border }]}>
              <ThemedText type="smallBold" themeColor="accent">
                Escolher da dispensa
              </ThemedText>
            </View>
          </Pressable>

          <SecaoHeader titulo="Seu trabalho" />
          <View style={styles.linhaEntreValores}>
            <ThemedText type="small">Horas na produção</ThemedText>
            <ThemedText type="subtitle" style={styles.horasTexto}>
              {String(horasProducao).replace('.', ',')} h
            </ThemedText>
          </View>
          <SliderAjuste
            valor={horasProducao}
            minimo={0.5}
            maximo={10}
            passo={0.5}
            onMudar={setHorasProducao}
            onFinalizar={handleFinalizarHoras}
          />
          <View style={styles.linhaEntreValores}>
            <ThemedText type="small" themeColor="textSecondary">
              a {formatarMoeda(valorHoraMaoDeObra)} por hora
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {formatarMoeda(custoMaoDeObra)}
            </ThemedText>
          </View>

          <View style={styles.campo}>
            <ThemedText type="small" themeColor="textSecondary">
              Embalagem e caixa
            </ThemedText>
            <TextInput
              value={custoEmbalagemTexto}
              onChangeText={setCustoEmbalagemTexto}
              onBlur={confirmarEmbalagem}
              keyboardType="decimal-pad"
              style={[styles.inputSublinhado, { color: theme.text, borderBottomColor: theme.border }]}
            />
          </View>

          <Pressable onPress={() => router.push('/perfil/custos-fixos')}>
            <View style={[styles.custosFixosBox, { borderColor: theme.border }]}>
              <View>
                <ThemedText type="small">Custos fixos rateados</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {formatarMoeda(totalCustosFixos)} no mês ÷ {receitasEstimadasPorMes} produções
                </ThemedText>
              </View>
              <ThemedText type="subtitle" style={styles.custosFixosValor}>
                {formatarMoeda(custoFixoRateado)}
              </ThemedText>
            </View>
          </Pressable>

          <SecaoHeader titulo="Margem de lucro" valor={`${margemLucro}%`} />
          <SliderAjuste
            valor={margemLucro}
            minimo={0}
            maximo={150}
            passo={1}
            onMudar={setMargemLucro}
            onFinalizar={handleFinalizarMargem}
          />
          <ThemedText type="small" themeColor="textSecondary" style={styles.margemTexto}>
            Sobre o custo total de {formatarMoeda(custoTotal)}, sua margem é {formatarMoeda(lucroTotal)}.
          </ThemedText>

          <Pressable onPress={() => router.push(`/receitas/${receitaId}/preco`)}>
            <View style={[styles.botaoPrimario, { borderColor: theme.accent }]}>
              <ThemedText type="smallBold">Ver o preço · {formatarMoeda(precoVenda)}</ThemedText>
            </View>
          </Pressable>

          <SecaoHeader titulo="Anotações" />
          <TextInput
            value={anotacoes}
            onChangeText={setAnotacoes}
            onBlur={confirmarAnotacoes}
            placeholder="Ex: Assar a 180°C por 25 minutos"
            placeholderTextColor={theme.textSecondary}
            multiline
            style={[styles.anotacoesInput, { color: theme.text, borderColor: theme.border }]}
          />

        </ScrollView>
      </SafeAreaView>

      <Modal visible={menuAberto} transparent animationType="fade" onRequestClose={() => setMenuAberto(false)}>
        <Pressable style={styles.menuOverlay} onPress={() => setMenuAberto(false)}>
          <ThemedView style={styles.menuOpcoes}>
            <Pressable onPress={handleTransformarEmProduto}>
              <View style={styles.menuOpcao}>
                <ThemedText type="small">Transformar em produto</ThemedText>
              </View>
            </Pressable>
            <Pressable onPress={handleDuplicar}>
              <View style={styles.menuOpcao}>
                <ThemedText type="small">Duplicar receita</ThemedText>
              </View>
            </Pressable>
            <Pressable onPress={handleExcluir}>
              <View style={styles.menuOpcao}>
                <ThemedText type="small" themeColor="danger">
                  Excluir receita
                </ThemedText>
              </View>
            </Pressable>
          </ThemedView>
        </Pressable>
      </Modal>

      <Modal visible={pickerAberto} transparent animationType="slide" onRequestClose={() => setPickerAberto(false)}>
        <View style={styles.pickerOverlay}>
          <ThemedView style={styles.pickerSheet}>
            <View style={styles.pickerCabecalho}>
              <ThemedText type="subtitle" style={styles.pickerTitulo}>
                Escolher insumos
              </ThemedText>
              <Pressable onPress={() => setPickerAberto(false)}>
                <View style={[styles.botaoContorno, { borderColor: theme.border }]}>
                  <ThemedText type="small">Pronto</ThemedText>
                </View>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.pickerLista}>
              {produtosDisponiveis.length === 0 ? (
                <ThemedText type="small" themeColor="textSecondary">
                  Nenhum produto cadastrado na dispensa.
                </ThemedText>
              ) : (
                produtosDisponiveis.map((produto) => {
                  const usado = ingredientes.some((i) => i.produtoId === produto.id);
                  return (
                    <Pressable
                      key={produto.id}
                      onPress={() => alternarProdutoNaReceita(produto)}
                      style={[styles.pickerItem, { borderBottomColor: theme.border }]}>
                      <View style={styles.flex1}>
                        <ThemedText type="subtitle" style={styles.pickerItemNome}>
                          {produto.nome}
                        </ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          {(produto.marca ? `${produto.marca} · ` : '') +
                            `${produto.quantidade} ${produto.unidade} · ${formatarMoeda(produto.valor_pago)}`}
                        </ThemedText>
                      </View>
                      <ThemedText type="small" themeColor={usado ? 'accent' : 'amberDeep'}>
                        {usado ? 'na receita ✓' : '+ adicionar'}
                      </ThemedText>
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
          </ThemedView>
        </View>
      </Modal>
    </ThemedView>
  );
}

function SecaoHeader({ titulo, valor }: { titulo: string; valor?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.secaoHeaderRow}>
      <ThemedText type="small" themeColor="accent" style={styles.secaoHeaderLabel}>
        {titulo.toUpperCase()}
      </ThemedText>
      <View style={[styles.secaoHeaderLinha, { backgroundColor: theme.border }]} />
      {valor !== undefined && (
        <ThemedText type="small" themeColor="textSecondary">
          {valor}
        </ThemedText>
      )}
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
  topoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  engrenagem: {
    fontSize: 20,
  },
  tituloComFixarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  tituloRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  estrela: {
    fontSize: 24,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: Spacing.one,
  },
  tagChip: {
    borderWidth: 1,
    borderRadius: Spacing.four,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
  },
  tagInput: {
    minWidth: 64,
    fontSize: 13,
    paddingVertical: 2,
  },
  titulo: {
    fontSize: 28,
    lineHeight: 32,
  },
  tituloInput: {
    fontSize: 28,
    lineHeight: 32,
    borderBottomWidth: 1,
    paddingVertical: Spacing.one,
  },
  conteudo: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.two,
  },
  flex1: {
    flex: 1,
  },
  secaoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
  secaoHeaderLabel: {
    letterSpacing: 1.5,
  },
  secaoHeaderLinha: {
    flex: 1,
    height: 1,
  },
  rendimentoRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'flex-end',
  },
  rendimentoQuantas: {
    width: 88,
  },
  campo: {
    gap: Spacing.one,
    marginTop: Spacing.three,
  },
  inputSublinhado: {
    borderBottomWidth: 1,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  botoesRendimentoRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  botaoContorno: {
    minHeight: 42,
    borderWidth: 1,
    borderRadius: Spacing.one,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  botaoTracejado: {
    minHeight: 46,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Spacing.one,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  botaoPrimario: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: Spacing.one,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.five,
  },
  ingredienteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
  },
  ingredienteNome: {
    fontSize: 18,
    lineHeight: 22,
  },
  ingredienteControles: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  stepperBotao: {
    width: 30,
    height: 30,
    borderWidth: 1,
    borderRadius: Spacing.one,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtdTexto: {
    minWidth: 48,
    textAlign: 'center',
  },
  qtdInput: {
    minWidth: 48,
    textAlign: 'center',
    borderBottomWidth: 1,
    fontSize: 14,
    paddingVertical: 2,
  },
  removerX: {
    fontSize: 18,
    paddingHorizontal: Spacing.one,
  },
  linhaEntreValores: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  horasTexto: {
    fontSize: 19,
    minWidth: 56,
    textAlign: 'center',
  },
  margemTexto: {
    marginTop: Spacing.two,
  },
  anotacoesInput: {
    minHeight: 90,
    borderWidth: 1,
    borderRadius: Spacing.two,
    padding: Spacing.three,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  custosFixosBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Spacing.two,
    padding: Spacing.three,
    marginTop: Spacing.four,
  },
  custosFixosValor: {
    fontSize: 19,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuOpcoes: {
    minWidth: 200,
    borderRadius: Spacing.three,
    padding: Spacing.two,
    gap: Spacing.half,
  },
  menuOpcao: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(45,30,25,0.4)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    maxHeight: '74%',
    borderTopLeftRadius: Spacing.three,
    borderTopRightRadius: Spacing.three,
    paddingTop: Spacing.three,
  },
  pickerCabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.two,
  },
  pickerTitulo: {
    fontSize: 22,
  },
  pickerLista: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    minHeight: 54,
  },
  pickerItemNome: {
    fontSize: 17.5,
    lineHeight: 21,
  },
});
