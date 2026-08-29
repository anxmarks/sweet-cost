import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { atualizarReceitasEstimadasPorMes, buscarConfiguracao } from '@/database/configuracaoRepository';
import {
  atualizarCustoFixo,
  inserirCustoFixo,
  listarCustosFixos,
  removerCustoFixo,
} from '@/database/custoFixoRepository';
import { calcularCustoFixoRateado, calcularTotalCustosFixos } from '@/services/calculoCustoFixo';
import { formatarMoeda } from '@/utils/formatarMoeda';

type CustoFixoForm = {
  id: number;
  nome: string;
  valorTexto: string;
};

export default function CustosFixosScreen() {
  const theme = useTheme();

  const [custos, setCustos] = useState<CustoFixoForm[]>([]);
  const [receitasEstimadasTexto, setReceitasEstimadasTexto] = useState('0');
  const [totalCustosFixos, setTotalCustosFixos] = useState(0);
  const [custoFixoRateado, setCustoFixoRateado] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const listaCustos = listarCustosFixos();
      const configuracao = buscarConfiguracao();

      setCustos(listaCustos.map((custo) => ({ id: custo.id, nome: custo.nome, valorTexto: String(custo.valor) })));
      setReceitasEstimadasTexto(String(configuracao.receitas_estimadas_por_mes));
      atualizarTotais();
    }, [])
  );

  function atualizarTotais() {
    setTotalCustosFixos(calcularTotalCustosFixos());
    setCustoFixoRateado(calcularCustoFixoRateado());
  }

  function handleNomeChange(id: number, nome: string) {
    setCustos((atual) => atual.map((custo) => (custo.id === id ? { ...custo, nome } : custo)));
  }

  function handleValorChange(id: number, valorTexto: string) {
    setCustos((atual) => atual.map((custo) => (custo.id === id ? { ...custo, valorTexto } : custo)));
  }

  function persistirCusto(custo: CustoFixoForm) {
    const valorNumero = Number(custo.valorTexto.replace(',', '.'));
    if (Number.isNaN(valorNumero) || valorNumero < 0) return;

    atualizarCustoFixo(custo.id, custo.nome.trim() || 'Sem nome', valorNumero);
    atualizarTotais();
  }

  function handleAdicionar() {
    const novoId = inserirCustoFixo('Nova conta', 0);
    setCustos((atual) => [...atual, { id: novoId, nome: 'Nova conta', valorTexto: '0' }]);
  }

  function handleRemover(id: number) {
    removerCustoFixo(id);
    setCustos((atual) => atual.filter((custo) => custo.id !== id));
    atualizarTotais();
  }

  function handleReceitasEstimadasBlur() {
    const valorNumero = Number(receitasEstimadasTexto.replace(',', '.'));
    if (Number.isNaN(valorNumero) || valorNumero < 0) return;

    atualizarReceitasEstimadasPorMes(valorNumero);
    atualizarTotais();
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.form}>
          <ThemedText type="subtitle">Custos fixos</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Contas do mês que não dependem da receita
          </ThemedText>

          <View style={styles.listaCustos}>
            {custos.map((custo) => (
              <View key={custo.id} style={[styles.custoRow, { borderBottomColor: theme.border }]}>
                <TextInput
                  value={custo.nome}
                  onChangeText={(texto) => handleNomeChange(custo.id, texto)}
                  onBlur={() => persistirCusto(custo)}
                  style={[styles.inputNome, { color: theme.text }]}
                />
                <TextInput
                  value={custo.valorTexto}
                  onChangeText={(texto) => handleValorChange(custo.id, texto)}
                  onBlur={() => persistirCusto(custo)}
                  keyboardType="decimal-pad"
                  style={[styles.inputValor, { color: theme.text, borderBottomColor: theme.border }]}
                />
                <Pressable onPress={() => handleRemover(custo.id)} hitSlop={8}>
                  <ThemedText themeColor="danger" style={styles.removerTexto}>
                    ×
                  </ThemedText>
                </Pressable>
              </View>
            ))}
          </View>

          <Pressable onPress={handleAdicionar}>
            <ThemedView style={[styles.adicionarButton, { borderColor: theme.border }]}>
              <ThemedText type="smallBold" themeColor="accent">
                Adicionar conta
              </ThemedText>
            </ThemedView>
          </Pressable>

          <View style={[styles.totalRow, { borderTopColor: theme.border }]}>
            <ThemedText type="small">Total no mês</ThemedText>
            <ThemedText type="subtitle" style={styles.totalValor}>
              {formatarMoeda(totalCustosFixos)}
            </ThemedText>
          </View>

          <View style={styles.field}>
            <ThemedText type="smallBold">Produções por mês</ThemedText>
            <TextInput
              value={receitasEstimadasTexto}
              onChangeText={setReceitasEstimadasTexto}
              onBlur={handleReceitasEstimadasBlur}
              keyboardType="decimal-pad"
              style={[styles.input, { color: theme.text, borderBottomColor: theme.border }]}
            />
          </View>

          <ThemedView type="backgroundElement" style={styles.rateioBox}>
            <ThemedText type="smallBold">Rateio por produção</ThemedText>
            <ThemedText type="subtitle" style={styles.rateioValor}>
              {formatarMoeda(custoFixoRateado)}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Este valor entra em todas as fichas técnicas.
            </ThemedText>
          </ThemedView>
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
    paddingBottom: Spacing.six + BottomTabInset,
    gap: Spacing.four,
  },
  listaCustos: {
    gap: 0,
  },
  custoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
  },
  inputNome: {
    flex: 1,
    fontSize: 15,
    paddingVertical: Spacing.one,
  },
  inputValor: {
    width: 78,
    textAlign: 'right',
    borderBottomWidth: 1,
    fontSize: 15,
    paddingVertical: Spacing.one,
  },
  removerTexto: {
    fontSize: 18,
    paddingHorizontal: Spacing.one,
  },
  adicionarButton: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingTop: Spacing.three,
    borderTopWidth: 1,
  },
  totalValor: {
    fontSize: 24,
    lineHeight: 28,
  },
  field: {
    gap: Spacing.two,
  },
  input: {
    borderBottomWidth: 1,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  rateioBox: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  rateioValor: {
    fontSize: 30,
    lineHeight: 34,
  },
});
