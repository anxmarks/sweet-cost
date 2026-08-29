import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  buscarConfiguracao,
  atualizarReceitasEstimadasPorMes,
  atualizarValorHoraMaoDeObra,
} from '@/database/configuracaoRepository';
import { listarCustosFixos, atualizarValorCustoFixo } from '@/database/custoFixoRepository';
import { calcularCustoFixoRateado, calcularTotalCustosFixos } from '@/services/calculoCustoFixo';
import { formatarMoeda } from '@/utils/formatarMoeda';
import { CategoriaCustoFixo, CustoFixo } from '@/models';

const ROTULOS_CATEGORIA: Record<CategoriaCustoFixo, string> = {
  aluguel: 'Aluguel',
  luz: 'Luz',
  gas: 'Gás',
  agua: 'Água',
  impostos: 'Impostos',
  diversos: 'Diversos',
};

export default function PerfilScreen() {
  const theme = useTheme();

  const [custos, setCustos] = useState<CustoFixo[]>([]);
  const [valoresTexto, setValoresTexto] = useState<Record<number, string>>({});
  const [receitasEstimadasTexto, setReceitasEstimadasTexto] = useState('0');
  const [valorHoraTexto, setValorHoraTexto] = useState('0');
  const [totalCustosFixos, setTotalCustosFixos] = useState(0);
  const [custoFixoRateado, setCustoFixoRateado] = useState(0);
  const [erro, setErro] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const listaCustos = listarCustosFixos();
      const configuracao = buscarConfiguracao();

      setCustos(listaCustos);
      setValoresTexto(Object.fromEntries(listaCustos.map((custo) => [custo.id, String(custo.valor)])));
      setReceitasEstimadasTexto(String(configuracao.receitas_estimadas_por_mes));
      setValorHoraTexto(String(configuracao.valor_hora_mao_de_obra));
      setTotalCustosFixos(calcularTotalCustosFixos());
      setCustoFixoRateado(calcularCustoFixoRateado());
      setErro(null);
    }, [])
  );

  function handleSalvar() {
    const receitasEstimadasNumero = Number(receitasEstimadasTexto.replace(',', '.'));

    if (Number.isNaN(receitasEstimadasNumero) || receitasEstimadasNumero < 0) {
      setErro('Informe um número válido de receitas estimadas por mês.');
      return;
    }

    const valorHoraNumero = Number(valorHoraTexto.replace(',', '.'));

    if (Number.isNaN(valorHoraNumero) || valorHoraNumero < 0) {
      setErro('Informe um valor por hora válido.');
      return;
    }

    for (const custo of custos) {
      const valorNumero = Number((valoresTexto[custo.id] ?? '0').replace(',', '.'));

      if (Number.isNaN(valorNumero) || valorNumero < 0) {
        setErro(`Informe um valor válido para ${ROTULOS_CATEGORIA[custo.categoria]}.`);
        return;
      }

      atualizarValorCustoFixo(custo.id, valorNumero);
    }

    atualizarReceitasEstimadasPorMes(receitasEstimadasNumero);
    atualizarValorHoraMaoDeObra(valorHoraNumero);

    setErro(null);
    setTotalCustosFixos(calcularTotalCustosFixos());
    setCustoFixoRateado(calcularCustoFixoRateado());
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.form}>
          <ThemedText type="subtitle">Perfil</ThemedText>

          <View style={styles.secao}>
            <ThemedText type="smallBold">Custos fixos mensais</ThemedText>

            {custos.map((custo) => (
              <View key={custo.id} style={styles.field}>
                <ThemedText type="small">{ROTULOS_CATEGORIA[custo.categoria]}</ThemedText>
                <TextInput
                  value={valoresTexto[custo.id] ?? ''}
                  onChangeText={(texto) => setValoresTexto((atual) => ({ ...atual, [custo.id]: texto }))}
                  placeholder="0,00"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="decimal-pad"
                  style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                />
              </View>
            ))}
          </View>

          <View style={styles.field}>
            <ThemedText type="smallBold">Receitas estimadas por mês</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Usado para ratear os custos fixos entre as receitas no cálculo de preço de venda.
            </ThemedText>
            <TextInput
              value={receitasEstimadasTexto}
              onChangeText={setReceitasEstimadasTexto}
              placeholder="0"
              placeholderTextColor={theme.textSecondary}
              keyboardType="decimal-pad"
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            />
          </View>

          <View style={styles.field}>
            <ThemedText type="smallBold">Mão de obra</ThemedText>
            <ThemedText type="small">Valor da hora de trabalho (R$)</ThemedText>
            <TextInput
              value={valorHoraTexto}
              onChangeText={setValorHoraTexto}
              placeholder="0,00"
              placeholderTextColor={theme.textSecondary}
              keyboardType="decimal-pad"
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            />
          </View>

          {erro && <ThemedText style={styles.erro}>{erro}</ThemedText>}

          <Pressable onPress={handleSalvar}>
            <ThemedView type="backgroundSelected" style={styles.salvarButton}>
              <ThemedText type="smallBold">Salvar</ThemedText>
            </ThemedView>
          </Pressable>

          <View style={styles.secao}>
            <ThemedText type="smallBold">Total de custos fixos por mês</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {formatarMoeda(totalCustosFixos)}
            </ThemedText>
          </View>

          <View style={styles.secao}>
            <ThemedText type="smallBold">Custo fixo rateado por receita</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {formatarMoeda(custoFixoRateado)}
            </ThemedText>
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
  form: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six + BottomTabInset,
    gap: Spacing.four,
  },
  secao: {
    gap: Spacing.two,
  },
  field: {
    gap: Spacing.two,
  },
  input: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  erro: {
    color: '#E5484D',
  },
  salvarButton: {
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
});
