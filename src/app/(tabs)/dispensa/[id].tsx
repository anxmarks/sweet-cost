import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SeletorData } from '@/components/seletor-data';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { atualizarProduto, buscarProdutoPorId, excluirProduto } from '@/database/produtoRepository';
import { listarNomesReceitasUsandoProduto } from '@/database/receitaRepository';
import { Unidade } from '@/models';

const UNIDADES: Unidade[] = ['g', 'kg', 'ml', 'l', 'un'];

export default function EditarProdutoScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const produtoId = Number(id);

  const [carregando, setCarregando] = useState(true);
  const [naoEncontrado, setNaoEncontrado] = useState(false);

  const [nome, setNome] = useState('');
  const [marca, setMarca] = useState('');
  const [valorPago, setValorPago] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [unidade, setUnidade] = useState<Unidade>('g');
  const [dataCompra, setDataCompra] = useState('');
  const [dataValidade, setDataValidade] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const produto = buscarProdutoPorId(produtoId);

    if (!produto) {
      setNaoEncontrado(true);
      setCarregando(false);
      return;
    }

    setNome(produto.nome);
    setMarca(produto.marca ?? '');
    setValorPago(String(produto.valor_pago));
    setQuantidade(String(produto.quantidade));
    setUnidade(produto.unidade);
    setDataCompra(produto.data_compra);
    setDataValidade(produto.data_validade ?? '');
    setCarregando(false);
  }, [produtoId]);

  function handleSalvar() {
    const valorPagoNumero = Number(valorPago.replace(',', '.'));
    const quantidadeNumero = Number(quantidade.replace(',', '.'));

    if (!nome.trim()) {
      setErro('Informe o nome do produto.');
      return;
    }
    if (!valorPago || Number.isNaN(valorPagoNumero) || valorPagoNumero <= 0) {
      setErro('Informe um valor pago válido.');
      return;
    }
    if (!quantidade || Number.isNaN(quantidadeNumero) || quantidadeNumero <= 0) {
      setErro('Informe uma quantidade válida.');
      return;
    }
    if (!dataCompra) {
      setErro('Selecione a data de compra.');
      return;
    }

    atualizarProduto(produtoId, {
      nome: nome.trim(),
      marca: marca.trim() || null,
      valor_pago: valorPagoNumero,
      quantidade: quantidadeNumero,
      unidade,
      data_compra: dataCompra,
      data_validade: dataValidade || null,
    });

    router.back();
  }

  function handleExcluir() {
    const receitasUsando = listarNomesReceitasUsandoProduto(produtoId);

    if (receitasUsando.length > 0) {
      Alert.alert(
        'Não é possível excluir',
        `"${nome}" está sendo usado em: ${receitasUsando.join(', ')}. Remova o ingrediente dessas receitas antes de excluir o produto.`
      );
      return;
    }

    Alert.alert('Excluir produto', `Tem certeza que deseja excluir "${nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          excluirProduto(produtoId);
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
          <ThemedText type="subtitle">Produto não encontrado.</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.form}>
          <ThemedText type="subtitle">Editar produto</ThemedText>

          <View style={styles.field}>
            <ThemedText type="smallBold">Nome *</ThemedText>
            <TextInput
              value={nome}
              onChangeText={setNome}
              placeholder="Ex: Farinha de Trigo"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text, borderBottomColor: theme.border }]}
            />
          </View>

          <View style={styles.field}>
            <ThemedText type="smallBold">Marca</ThemedText>
            <TextInput
              value={marca}
              onChangeText={setMarca}
              placeholder="Ex: Dona Benta"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text, borderBottomColor: theme.border }]}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.field, styles.flex1]}>
              <ThemedText type="smallBold">Valor pago (R$) *</ThemedText>
              <TextInput
                value={valorPago}
                onChangeText={setValorPago}
                placeholder="0,00"
                placeholderTextColor={theme.textSecondary}
                keyboardType="decimal-pad"
                style={[styles.input, { color: theme.text, borderBottomColor: theme.border }]}
              />
            </View>
            <View style={[styles.field, styles.flex1]}>
              <ThemedText type="smallBold">Quantidade *</ThemedText>
              <TextInput
                value={quantidade}
                onChangeText={setQuantidade}
                placeholder="0"
                placeholderTextColor={theme.textSecondary}
                keyboardType="decimal-pad"
                style={[styles.input, { color: theme.text, borderBottomColor: theme.border }]}
              />
            </View>
          </View>

          <View style={styles.field}>
            <ThemedText type="smallBold">Unidade *</ThemedText>
            <View style={styles.chips}>
              {UNIDADES.map((opcao) => (
                <Pressable key={opcao} onPress={() => setUnidade(opcao)}>
                  <ThemedView
                    type={opcao === unidade ? 'backgroundSelected' : 'backgroundElement'}
                    style={styles.chip}>
                    <ThemedText type="small">{opcao}</ThemedText>
                  </ThemedView>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.field, styles.flex1]}>
              <ThemedText type="smallBold">Data de compra *</ThemedText>
              <SeletorData value={dataCompra} onSelecionar={setDataCompra} />
            </View>
            <View style={[styles.field, styles.flex1]}>
              <ThemedText type="smallBold">Data de validade</ThemedText>
              <SeletorData value={dataValidade} onSelecionar={setDataValidade} opcional />
            </View>
          </View>

          {erro && (
            <ThemedText themeColor="danger" style={styles.erro}>
              {erro}
            </ThemedText>
          )}

          <Pressable onPress={handleSalvar}>
            <ThemedView type="backgroundSelected" style={styles.salvarButton}>
              <ThemedText type="smallBold">Salvar alterações</ThemedText>
            </ThemedView>
          </Pressable>

          <Pressable onPress={handleExcluir}>
            <ThemedView style={[styles.excluirButton, { borderColor: theme.danger }]}>
              <ThemedText type="smallBold" themeColor="danger">
                Excluir produto
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
    gap: Spacing.three,
  },
  flex1: {
    flex: 1,
  },
  input: {
    borderBottomWidth: 1,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  erro: {
    fontSize: 14,
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
  },
});
