# Contribuindo

## Rodando o projeto

Veja o [README](./README.md) para o passo a passo de setup.

O app usa SQLite local (`expo-sqlite`), que **não funciona no modo web** — sempre teste num dispositivo físico ou emulador Android/iOS via Expo Go.

## Branches

Uma branch por funcionalidade, a partir de `master`:

```
<tipo>/<descricao-em-kebab-case>
feature/cadastro-produto
fix/calculo-margem-negativa
chore/setup-eslint
docs/atualizar-readme
```

## Commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: adiciona tela de cadastro de produto
fix: corrige cálculo de margem quando custo é zero
chore: configura eslint e prettier
docs: documenta schema do banco
```

Prefira commits atômicos: se uma mudança mistura assuntos diferentes (ex: uma correção de arquitetura no meio de uma feature nova), separe em commits distintos por tipo, mesmo saindo da mesma branch.

Se o commit resolve uma issue existente, referencie no rodapé da mensagem (`closes #24`) para que ela feche automaticamente ao mesclar.

## Pull Requests

1. Abra a branch a partir de `master` atualizada.
2. Rode o type-check antes de abrir o PR:
   ```bash
   npx tsc --noEmit
   ```
3. Teste a mudança num dispositivo/emulador — o app não tem suíte de testes automatizados ainda, então a verificação manual é o que garante que a feature funciona de ponta a ponta.
4. Abra o PR contra `master` descrevendo o que mudou e por quê.
5. Depois de mesclado, apague a branch.

## Estrutura do projeto

Veja [docs/ESTRUTURA.md](./docs/ESTRUTURA.md) para o detalhamento das pastas, e [docs/SCHEMA.md](./docs/SCHEMA.md) para o schema do banco de dados.
