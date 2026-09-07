import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { atualizarOnboardingVisto } from '@/database/configuracaoRepository';

const PASSOS = [
  { numero: '1', titulo: 'Dispensa', descricao: 'Marca, valor pago, quantidade e validade' },
  { numero: '2', titulo: 'Receita', descricao: 'Escolha os insumos e ajuste as quantidades' },
  { numero: '3', titulo: 'Preço', descricao: 'Custo, seu trabalho e sua margem' },
];

export default function OnboardingScreen() {
  const theme = useTheme();

  function handleComecar() {
    atualizarOnboardingVisto(true);
    router.replace('/');
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="small" themeColor="accent" style={styles.rotuloUppercase}>
          Doce Cálculo
        </ThemedText>

        <ThemedText type="title" style={styles.titulo}>
          Sua conta certa,{'\n'}
          <ThemedText type="title" themeColor="accent" style={styles.tituloItalico}>
            doce por doce
          </ThemedText>
        </ThemedText>

        <ThemedText type="default" themeColor="textSecondary" style={styles.descricao}>
          Troque a planilha por três passos. Você cadastra o que compra, monta a receita e o app diz por quanto
          vender.
        </ThemedText>

        <View style={[styles.divisor, { backgroundColor: theme.border }]} />

        {PASSOS.map((passo, index) => (
          <View
            key={passo.numero}
            style={[
              styles.passoRow,
              index < PASSOS.length - 1 && styles.passoComBorda,
              { borderBottomColor: theme.border },
            ]}>
            <ThemedText type="title" themeColor="amber" style={styles.passoNumero}>
              {passo.numero}
            </ThemedText>
            <View style={styles.flex1}>
              <ThemedText type="subtitle" style={styles.passoTitulo}>
                {passo.titulo}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {passo.descricao}
              </ThemedText>
            </View>
          </View>
        ))}

        <View style={styles.flex1} />

        <Pressable onPress={handleComecar}>
          <View style={[styles.botaoComecar, { borderColor: theme.accent }]}>
            <ThemedText type="smallBold">Começar</ThemedText>
          </View>
        </Pressable>
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
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.four,
  },
  rotuloUppercase: {
    letterSpacing: 1.5,
  },
  titulo: {
    fontSize: 40,
    lineHeight: 44,
    marginTop: Spacing.three,
  },
  tituloItalico: {
    fontSize: 40,
    lineHeight: 44,
    fontStyle: 'italic',
  },
  descricao: {
    marginTop: Spacing.three,
    lineHeight: 24,
  },
  divisor: {
    height: 1,
    marginTop: Spacing.five,
    marginBottom: Spacing.one,
  },
  passoRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  passoComBorda: {
    borderBottomWidth: 1,
  },
  passoNumero: {
    fontSize: 30,
    lineHeight: 34,
  },
  flex1: {
    flex: 1,
  },
  passoTitulo: {
    fontSize: 20,
    lineHeight: 24,
  },
  botaoComecar: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: Spacing.one,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
