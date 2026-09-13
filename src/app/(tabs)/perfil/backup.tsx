import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
// API legada (cacheDirectory/writeAsStringAsync) pra gerar o arquivo de export;
// API nova (File) pra ler de volta, pois é a única que lê URIs content:// do
// seletor de arquivos do Android sem falhar no Expo Go.
import * as FileSystem from 'expo-file-system/legacy';
import { File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { BackupDados, exportarBackup, restaurarBackup } from '@/database/backupRepository';

function nomeArquivoBackup(): string {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  return `sweet-cost-backup-${ano}-${mes}-${dia}.json`;
}

function ehBackupValido(dados: any): dados is BackupDados {
  return (
    dados &&
    Array.isArray(dados.produtos) &&
    Array.isArray(dados.receitas) &&
    Array.isArray(dados.ingredientes_receita) &&
    Array.isArray(dados.custos_fixos) &&
    dados.configuracao
  );
}

export default function BackupScreen() {
  const theme = useTheme();
  const [exportando, setExportando] = useState(false);
  const [importando, setImportando] = useState(false);

  async function handleExportar() {
    setExportando(true);
    try {
      const dados = exportarBackup();
      const uri = FileSystem.cacheDirectory + nomeArquivoBackup();
      await FileSystem.writeAsStringAsync(uri, JSON.stringify(dados, null, 2));

      const disponivel = await Sharing.isAvailableAsync();
      if (!disponivel) {
        Alert.alert('Não disponível', 'Compartilhamento não está disponível neste dispositivo.');
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: 'application/json',
        dialogTitle: 'Salvar backup do Sweet Cost',
      });
    } catch {
      Alert.alert('Erro ao exportar', 'Não foi possível gerar o arquivo de backup.');
    } finally {
      setExportando(false);
    }
  }

  async function handleImportar() {
    let resultado: DocumentPicker.DocumentPickerResult;
    try {
      resultado = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: false,
      });
    } catch {
      Alert.alert('Erro ao importar', 'Não foi possível abrir o seletor de arquivos.');
      return;
    }

    if (resultado.canceled || resultado.assets.length === 0) return;

    let dados: unknown;
    try {
      const conteudo = await new File(resultado.assets[0].uri).text();
      dados = JSON.parse(conteudo);
    } catch {
      Alert.alert('Erro ao importar', 'Não foi possível ler o arquivo selecionado.');
      return;
    }

    if (!ehBackupValido(dados)) {
      Alert.alert('Arquivo inválido', 'Esse arquivo não parece ser um backup do Sweet Cost.');
      return;
    }

    const dataExportacao = new Date(dados.exportado_em).toLocaleDateString('pt-BR');

    Alert.alert(
      'Restaurar backup',
      `Isso vai substituir TODOS os dados atuais do app (dispensa, receitas, custos fixos, perfil) pelos dados desse backup, de ${dataExportacao}. Essa ação não pode ser desfeita. Continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restaurar',
          style: 'destructive',
          onPress: () => {
            setImportando(true);
            try {
              restaurarBackup(dados);
              Alert.alert('Pronto', 'Backup restaurado com sucesso.');
            } catch {
              Alert.alert('Erro ao restaurar', 'Não foi possível restaurar esse backup.');
            } finally {
              setImportando(false);
            }
          },
        },
      ]
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.form}>
          <ThemedText type="subtitle">Backup e exportação</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Seus dados ficam só neste aparelho. Exporte um arquivo de backup de vez em quando e
            guarde num lugar seguro (Google Drive, e-mail, etc.) — se o celular for perdido,
            trocado ou resetado, é a única forma de recuperar tudo.
          </ThemedText>

          <Pressable onPress={handleExportar} disabled={exportando}>
            <ThemedView type="backgroundSelected" style={styles.botaoPrimario}>
              <ThemedText type="smallBold">{exportando ? 'Gerando...' : 'Exportar backup'}</ThemedText>
            </ThemedView>
          </Pressable>

          <View style={[styles.divisor, { backgroundColor: theme.border }]} />

          <ThemedText type="smallBold">Restaurar de um backup</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Escolha um arquivo de backup exportado anteriormente. Isso substitui todos os dados
            atuais do app — use com cuidado.
          </ThemedText>

          <Pressable onPress={handleImportar} disabled={importando}>
            <View style={[styles.botaoContorno, { borderColor: theme.danger }]}>
              <ThemedText type="smallBold" themeColor="danger">
                {importando ? 'Restaurando...' : 'Importar backup'}
              </ThemedText>
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
    gap: Spacing.three,
  },
  botaoPrimario: {
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  botaoContorno: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divisor: {
    height: 1,
    marginVertical: Spacing.two,
  },
});
