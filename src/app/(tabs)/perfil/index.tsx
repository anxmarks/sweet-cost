import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { atualizarPerfil, atualizarValorHoraMaoDeObra, buscarConfiguracao } from '@/database/configuracaoRepository';
import { listarProdutos } from '@/database/produtoRepository';
import { listarReceitas } from '@/database/receitaRepository';
import { calcularTotalCustosFixos } from '@/services/calculoCustoFixo';
import { formatarMoeda } from '@/utils/formatarMoeda';

export default function PerfilScreen() {
  const theme = useTheme();

  const [nome, setNome] = useState('');
  const [atelie, setAtelie] = useState('');
  const [valorHoraTexto, setValorHoraTexto] = useState('0');
  const [totalCustosFixos, setTotalCustosFixos] = useState(0);
  const [insumosCount, setInsumosCount] = useState(0);
  const [fichasCount, setFichasCount] = useState(0);
  const [erro, setErro] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const configuracao = buscarConfiguracao();

      setNome(configuracao.nome_usuario);
      setAtelie(configuracao.atelie);
      setValorHoraTexto(String(configuracao.valor_hora_mao_de_obra));
      setTotalCustosFixos(calcularTotalCustosFixos());
      setInsumosCount(listarProdutos().length);
      setFichasCount(listarReceitas().length);
      setErro(null);
    }, [])
  );

  function handleSalvar() {
    const valorHoraNumero = Number(valorHoraTexto.replace(',', '.'));

    if (Number.isNaN(valorHoraNumero) || valorHoraNumero < 0) {
      setErro('Informe um valor por hora válido.');
      return;
    }

    atualizarPerfil(nome.trim(), atelie.trim());
    atualizarValorHoraMaoDeObra(valorHoraNumero);
    setErro(null);
  }

  const inicial = nome.trim().charAt(0).toUpperCase() || '?';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.form}>
          <ThemedText type="subtitle">Perfil</ThemedText>

          <View style={styles.cabecalho}>
            <View style={[styles.avatar, { backgroundColor: theme.avatar, borderColor: theme.border }]}>
              <ThemedText type="subtitle">{inicial}</ThemedText>
            </View>
            <View style={styles.flex1}>
              <ThemedText type="subtitle" style={styles.nomeTexto}>
                {nome || 'Seu nome'}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {atelie || 'Seu ateliê'}
              </ThemedText>
            </View>
          </View>

          <View style={styles.field}>
            <ThemedText type="smallBold">Seu nome</ThemedText>
            <TextInput
              value={nome}
              onChangeText={setNome}
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text, borderBottomColor: theme.border }]}
            />
          </View>

          <View style={styles.field}>
            <ThemedText type="smallBold">Ateliê</ThemedText>
            <TextInput
              value={atelie}
              onChangeText={setAtelie}
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text, borderBottomColor: theme.border }]}
            />
          </View>

          <View style={styles.field}>
            <ThemedText type="smallBold">Quanto vale sua hora (R$)</ThemedText>
            <TextInput
              value={valorHoraTexto}
              onChangeText={setValorHoraTexto}
              placeholder="0,00"
              placeholderTextColor={theme.textSecondary}
              keyboardType="decimal-pad"
              style={[styles.input, { color: theme.text, borderBottomColor: theme.border }]}
            />
          </View>

          {erro && (
            <ThemedText themeColor="danger" style={styles.erro}>
              {erro}
            </ThemedText>
          )}

          <Pressable onPress={handleSalvar}>
            <ThemedView type="backgroundSelected" style={styles.salvarButton}>
              <ThemedText type="smallBold">Salvar</ThemedText>
            </ThemedView>
          </Pressable>

          <View style={[styles.divisor, { backgroundColor: theme.border }]} />

          <Pressable onPress={() => router.push('/perfil/custos-fixos')}>
            <View style={[styles.linha, { borderBottomColor: theme.border }]}>
              <ThemedText type="small">Custos fixos do mês</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {formatarMoeda(totalCustosFixos)} →
              </ThemedText>
            </View>
          </Pressable>

          <View style={[styles.linha, { borderBottomColor: theme.border }]}>
            <ThemedText type="small">Insumos na dispensa</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {insumosCount}
            </ThemedText>
          </View>

          <View style={[styles.linha, { borderBottomColor: theme.border }]}>
            <ThemedText type="small">Fichas técnicas</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {fichasCount}
            </ThemedText>
          </View>

          <Pressable onPress={() => router.push('/perfil/backup')}>
            <View style={[styles.linha, { borderBottomColor: theme.border }]}>
              <ThemedText type="small">Backup e exportação</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                →
              </ThemedText>
            </View>
          </Pressable>

          <Pressable onPress={() => router.push('/onboarding')}>
            <View style={[styles.reverApresentacaoButton, { borderColor: theme.border }]}>
              <ThemedText type="smallBold">Rever a apresentação</ThemedText>
            </View>
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
    paddingBottom: Spacing.six + BottomTabInset,
    gap: Spacing.four,
  },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex1: {
    flex: 1,
  },
  nomeTexto: {
    fontSize: 22,
    lineHeight: 26,
  },
  field: {
    gap: Spacing.two,
  },
  input: {
    borderBottomWidth: 1,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  erro: {
    fontSize: 14,
  },
  salvarButton: {
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  divisor: {
    height: 1,
  },
  linha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    minHeight: 54,
  },
  reverApresentacaoButton: {
    minHeight: 48,
    marginTop: Spacing.four,
    borderWidth: 1,
    borderRadius: Spacing.one,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
