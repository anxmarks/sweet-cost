import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { listarProdutos } from '@/database/produtoRepository';
import {
  atualizarReceita,
  buscarReceitaPorId,
  excluirIngredienteReceita,
  excluirReceita,
  inserirIngredienteReceita,
  listarIngredientesPorReceita,
} from '@/database/receitaRepository';
import { Produto, Unidade } from '@/models';

type IngredienteForm = {
  produtoId: number;
  quantidadeUsada: string;
  unidadeUsada: Unidade;
};

export default function EditarReceitaScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const receitaId = Number(id);

  const [carregando, setCarregando] = useState(true);
  const [naoEncontrado, setNaoEncontrado] = useState(false);

  const [produtos, setProdutos] = useState<Produto[]>([]);

  const [nome, setNome] = useState('');
  const [rendimento, setRendimento] = useState('');
  const [unidadeRendimento, setUnidadeRendimento] = useState('un');
  const [margemLucro, setMargemLucro] = useState('');

  const [ingredientes, setIngredientes] = useState<IngredienteForm[]>([]);
  const [mostrarSeletorProdutos, setMostrarSeletorProdutos] = useState(false);
  const [produtosSelecionados, setProdutosSelecionados] = useState<Set<number>>(new Set());
  const [editandoQuantidades, setEditandoQuantidades] = useState(false);

  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    setProdutos(listarProdutos());

    const receita = buscarReceitaPorId(receitaId);

    if (!receita) {
      setNaoEncontrado(true);
      setCarregando(false);
      return;
    }

    setNome(receita.nome);
    setRendimento(String(receita.rendimento));
    setUnidadeRendimento(receita.unidade_rendimento);
    setMargemLucro(String(receita.margem_lucro));

    const ingredientesExistentes = listarIngredientesPorReceita(receitaId);
    setIngredientes(
      ingredientesExistentes.map((ingrediente) => ({
        produtoId: ingrediente.produto_id,
        quantidadeUsada: String(ingrediente.quantidade_usada),
        unidadeUsada: ingrediente.unidade_usada,
      }))
    );

    setCarregando(false);
  }, [receitaId]);

  const produtosDisponiveis = produtos.filter(
    (produto) => !ingredientes.some((ingrediente) => ingrediente.produtoId === produto.id)
  );

  function toggleProdutoSelecionado(produtoId: number) {
    setProdutosSelecionados((atual) => {
      const novo = new Set(atual);
      if (novo.has(produtoId)) {
        novo.delete(produtoId);
      } else {
        novo.add(produtoId);
      }
      return novo;
    });
  }

  function adicionarProdutosSelecionados() {
    const novosIngredientes = produtos
      .filter((produto) => produtosSelecionados.has(produto.id))
      .map((produto) => ({
        produtoId: produto.id,
        quantidadeUsada: '0',
        unidadeUsada: produto.unidade,
      }));

    setIngredientes((atual) => [...atual, ...novosIngredientes]);
    setProdutosSelecionados(new Set());
    setMostrarSeletorProdutos(false);
  }

  function removerIngrediente(produtoId: number) {
    setIngredientes((atual) => atual.filter((ingrediente) => ingrediente.produtoId !== produtoId));
  }

  function atualizarQuantidade(produtoId: number, valor: string) {
    setIngredientes((atual) =>
      atual.map((ingrediente) =>
        ingrediente.produtoId === produtoId ? { ...ingrediente, quantidadeUsada: valor } : ingrediente
      )
    );
  }

  function handleSalvar() {
    const rendimentoNumero = Number(rendimento.replace(',', '.'));
    const margemNumero = Number(margemLucro.replace(',', '.'));

    if (!nome.trim()) {
      setErro('Informe o nome da receita.');
      return;
    }
    if (!rendimento || Number.isNaN(rendimentoNumero) || rendimentoNumero <= 0) {
      setErro('Informe um rendimento válido.');
      return;
    }
    if (!unidadeRendimento.trim()) {
      setErro('Informe a unidade do rendimento.');
      return;
    }
    if (!margemLucro || Number.isNaN(margemNumero) || margemNumero < 0) {
      setErro('Informe uma margem de lucro válida.');
      return;
    }

    atualizarReceita(receitaId, {
      nome: nome.trim(),
      rendimento: rendimentoNumero,
      unidade_rendimento: unidadeRendimento.trim(),
      margem_lucro: margemNumero,
    });

    for (const ingredienteExistente of listarIngredientesPorReceita(receitaId)) {
      excluirIngredienteReceita(ingredienteExistente.id);
    }

    for (const ingrediente of ingredientes) {
      const quantidadeNumero = Number(ingrediente.quantidadeUsada.replace(',', '.'));
      if (!quantidadeNumero || quantidadeNumero <= 0) continue;

      inserirIngredienteReceita({
        receita_id: receitaId,
        produto_id: ingrediente.produtoId,
        quantidade_usada: quantidadeNumero,
        unidade_usada: ingrediente.unidadeUsada,
      });
    }

    router.back();
  }

  function handleExcluir() {
    Alert.alert('Excluir receita', `Tem certeza que deseja excluir "${nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          excluirReceita(receitaId);
          router.back();
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

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.form}>
          <ThemedText type="subtitle">Editar receita</ThemedText>

          <View style={styles.field}>
            <ThemedText type="smallBold">Nome *</ThemedText>
            <TextInput
              value={nome}
              onChangeText={setNome}
              placeholder="Ex: Biscoito Amanteigado"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.field, styles.flex1]}>
              <ThemedText type="smallBold">Rendimento *</ThemedText>
              <TextInput
                value={rendimento}
                onChangeText={setRendimento}
                placeholder="30"
                placeholderTextColor={theme.textSecondary}
                keyboardType="decimal-pad"
                style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
              />
            </View>
            <View style={[styles.field, styles.flex1]}>
              <ThemedText type="smallBold">Unidade do rendimento *</ThemedText>
              <TextInput
                value={unidadeRendimento}
                onChangeText={setUnidadeRendimento}
                placeholder="un"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
              />
            </View>
          </View>

          <View style={styles.field}>
            <ThemedText type="smallBold">Margem de lucro (%) *</ThemedText>
            <TextInput
              value={margemLucro}
              onChangeText={setMargemLucro}
              placeholder="50"
              placeholderTextColor={theme.textSecondary}
              keyboardType="decimal-pad"
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            />
          </View>

          <View style={styles.field}>
            <View style={styles.row}>
              <ThemedText type="smallBold">Ingredientes</ThemedText>
              <Pressable onPress={() => setMostrarSeletorProdutos((atual) => !atual)}>
                <ThemedText type="linkPrimary">+ Adicionar</ThemedText>
              </Pressable>
            </View>

            {ingredientes.length > 0 && (
              <View style={styles.acoesIngredientes}>
                <Pressable onPress={() => setEditandoQuantidades((atual) => !atual)}>
                  <ThemedText type="link">
                    {editandoQuantidades ? 'Concluir edição' : 'Editar quantidades'}
                  </ThemedText>
                </Pressable>
              </View>
            )}

            {mostrarSeletorProdutos && (
              <View style={styles.seletorProdutos}>
                {produtosDisponiveis.length === 0 ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    Todos os produtos da dispensa já foram adicionados.
                  </ThemedText>
                ) : (
                  produtosDisponiveis.map((produto) => {
                    const selecionado = produtosSelecionados.has(produto.id);
                    return (
                      <Pressable key={produto.id} onPress={() => toggleProdutoSelecionado(produto.id)}>
                        <ThemedView
                          type={selecionado ? 'backgroundSelected' : 'backgroundElement'}
                          style={styles.produtoRow}>
                          <ThemedText type="small">
                            {selecionado ? '✓ ' : ''}
                            {produto.nome}
                            {produto.marca ? ` (${produto.marca})` : ''}
                          </ThemedText>
                        </ThemedView>
                      </Pressable>
                    );
                  })
                )}

                <Pressable onPress={adicionarProdutosSelecionados} disabled={produtosSelecionados.size === 0}>
                  <ThemedView
                    type="backgroundSelected"
                    style={[styles.opcaoButton, produtosSelecionados.size === 0 && styles.desabilitado]}>
                    <ThemedText type="smallBold">
                      Adicionar selecionados ({produtosSelecionados.size})
                    </ThemedText>
                  </ThemedView>
                </Pressable>
              </View>
            )}

            {ingredientes.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                Nenhum ingrediente adicionado ainda.
              </ThemedText>
            ) : (
              <View style={styles.listaIngredientes}>
                {ingredientes.map((ingrediente) => {
                  const produto = produtos.find((p) => p.id === ingrediente.produtoId);
                  if (!produto) return null;

                  return (
                    <View key={ingrediente.produtoId} style={styles.ingredienteRow}>
                      <ThemedText type="small" style={styles.flex1}>
                        {produto.nome}
                      </ThemedText>

                      {editandoQuantidades ? (
                        <TextInput
                          value={ingrediente.quantidadeUsada}
                          onChangeText={(valor) => atualizarQuantidade(ingrediente.produtoId, valor)}
                          keyboardType="decimal-pad"
                          style={[
                            styles.inputQuantidade,
                            { color: theme.text, backgroundColor: theme.backgroundElement },
                          ]}
                        />
                      ) : (
                        <ThemedText type="small" themeColor="textSecondary">
                          {ingrediente.quantidadeUsada} {ingrediente.unidadeUsada}
                        </ThemedText>
                      )}

                      <Pressable onPress={() => removerIngrediente(ingrediente.produtoId)}>
                        <ThemedText type="small" style={styles.removerTexto}>
                          Remover
                        </ThemedText>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {erro && <ThemedText style={styles.erro}>{erro}</ThemedText>}

          <Pressable onPress={handleSalvar}>
            <ThemedView type="backgroundSelected" style={styles.salvarButton}>
              <ThemedText type="smallBold">Salvar alterações</ThemedText>
            </ThemedView>
          </Pressable>

          <Pressable onPress={handleExcluir}>
            <ThemedView style={styles.excluirButton}>
              <ThemedText type="smallBold" style={styles.excluirText}>
                Excluir receita
              </ThemedText>
            </ThemedView>
          </Pressable>
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
  form: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.four,
  },
  field: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.three,
  },
  flex1: {
    flex: 1,
  },
  input: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  acoesIngredientes: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  opcaoButton: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  desabilitado: {
    opacity: 0.5,
  },
  seletorProdutos: {
    gap: Spacing.two,
  },
  produtoRow: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  listaIngredientes: {
    gap: Spacing.two,
  },
  ingredienteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  inputQuantidade: {
    width: 72,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    fontSize: 14,
    textAlign: 'right',
  },
  removerTexto: {
    color: '#E5484D',
  },
  erro: {
    color: '#E5484D',
  },
  salvarButton: {
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  excluirButton: {
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5484D',
  },
  excluirText: {
    color: '#E5484D',
  },
});
