# Sweet-Cost 🧁

Aplicativo mobile para confeitarias calcularem o custo e o preço de venda de seus produtos, com controle de estoque e cadastro de receitas.

## Funcionalidades

- **Dispensa**: cadastro de ingredientes/produtos com valor, data de compra e data de validade. Alertas de produtos próximos do vencimento.
- **Receitas**: cadastro de receitas com medidas, vinculadas aos produtos da dispensa.
- **Calculadora de custo**: cálculo automático do custo de uma receita com base nos produtos usados, com aplicação de margem de lucro definida pelo usuário.

## Stack

- [React Native](https://reactnative.dev/) + [Expo](https://expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/) (navegação baseada em arquivos)
- TypeScript
- SQLite (`expo-sqlite`) para persistência local
- `expo-notifications` para alertas de validade (fase futura)

## Estrutura do projeto

Veja [docs/ESTRUTURA.md](./docs/ESTRUTURA.md) para o detalhamento das pastas.

## Como rodar o projeto

Veja o passo a passo completo em [docs/ENVIRONMENT_SETUP.md](./docs/ENVIRONMENT_SETUP.md).

Resumo rápido:

```bash
git clone <url-do-repo>
cd confeitaria-app
npm install
npx expo start
```

## Status do projeto

🚧 Em desenvolvimento inicial.
