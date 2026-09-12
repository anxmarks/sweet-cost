# Sweet Cost
![header](assets/images/headermd.png)

Aplicativo mobile para confeitarias calcularem o custo e o preço de venda de seus produtos — do ingrediente comprado até o preço final da receita, considerando insumos, mão de obra, embalagem e custos fixos do ateliê.

## Funcionalidades

- **Dispensa**: cadastro de insumos com valor pago, quantidade, unidade (g, kg, ml, l, un), data de compra e validade. Conversão automática entre unidades compatíveis (ex: comprar em kg, usar em xícara) e alerta visual de produtos vencendo (vermelho ≤ 7 dias, amarelo ≤ 30 dias).
- **Receitas (ficha técnica)**: escolha de insumos direto da dispensa, ajuste de quantidades e rendimento (com atalhos para metade/dobro da receita), horas de produção e valor da hora de trabalho, custo de embalagem, rateio de custos fixos, margem de lucro ajustável, anotações e tags livres para organizar.
- **Tela de Preço**: três formatos prontos para consulta ou compartilhamento (ficha detalhada, etiqueta, recibo), com alternância entre o preço da receita inteira ou por unidade.
- **Ranking de produtividade**: mostra quais receitas rendem mais lucro por hora de trabalho, para ajudar a decidir o que vale mais a pena produzir.
- **Duplicar receita**: cria uma cópia de uma receita existente como ponto de partida para variações.
- **Perfil**: nome do ateliê, custos fixos mensais (lista livre — aluguel, luz, etc.), valor da hora de trabalho e estimativa de produções por mês, usados para ratear os custos fixos entre as receitas.
- **Início**: resumo do dia com o último cálculo feito, receitas favoritas, contagem de insumos cadastrados e aviso de produtos vencendo.

## Stack

- [React Native](https://reactnative.dev/) + [Expo](https://expo.dev/) (SDK 56)
- [Expo Router](https://docs.expo.dev/router/introduction/) (navegação baseada em arquivos)
- TypeScript
- SQLite (`expo-sqlite`) para persistência local
- `react-native-gesture-handler` + `react-native-reanimated` para as interações de slider

## Estrutura do projeto

Veja [docs/ESTRUTURA.md](./docs/ESTRUTURA.md) para o detalhamento das pastas.

## Como rodar o projeto

Veja o passo a passo completo em [docs/ENVIRONMENT_SETUP.md](./docs/ENVIRONMENT_SETUP.md).

Resumo rápido:

```bash
git clone https://github.com/anxmarks/sweet-cost.git
cd sweet-cost
npm install
npx expo start
```

Escaneie o QR Code com o app **Expo Go** (Android/iOS) para testar no celular, ou pressione `a` no terminal para abrir num emulador Android configurado. O app usa SQLite local (`expo-sqlite`), que não funciona no modo web — teste sempre num dispositivo ou emulador.

## Status do projeto

Em desenvolvimento ativo. Os fluxos principais (Dispensa, Receitas com ficha técnica completa, custos fixos, mão de obra e cálculo de preço) já estão funcionando; novas funcionalidades continuam sendo adicionadas — veja as [issues abertas](https://github.com/anxmarks/sweet-cost/issues) para o que está planejado.
