# CLAUDE.md — Contexto do Projeto

Este arquivo é lido automaticamente pelo Claude Code para manter contexto entre sessões.

---

## Sobre o projeto

**Nome:** Sweet Cost (Confeitaria App)  
**Objetivo:** Aplicativo mobile para confeitarias calcularem o custo e preço de venda de produtos.  
**Status:** Setup inicial concluído, estrutura de pastas organizada, banco de dados modelado.

## Stack

- React Native + Expo
- Expo Router (navegação baseada em arquivos, similar ao Next.js)
- TypeScript
- SQLite via `expo-sqlite` para persistência local
- Conventional Commits + GitHub Issues para gestão do projeto

## Estrutura de pastas

```
src/
├── app/
│   ├── _layout.tsx
│   └── (tabs)/
│       ├── _layout.tsx
│       ├── index.tsx
│       ├── dispensa/
│       │   ├── index.tsx
│       │   ├── [id].tsx
│       │   └── novo.tsx
│       └── receitas/
│           ├── index.tsx
│           ├── [id].tsx
│           └── nova.tsx
├── components/
├── constants/
├── hooks/
├── models/         → index.ts (Produto, Receita, IngredienteReceita)
├── services/       → calculoCusto.ts, calculoMargem.ts, alertaValidade.ts
├── database/       → db.ts, produtoRepository.ts, receitaRepository.ts
└── utils/          → formatarMoeda.ts, calcularDiasParaVencer.ts, converterUnidade.ts
```

## Banco de dados (SQLite)

Três tabelas: `produtos`, `receitas`, `ingredientes_receita`.  
Schema completo em `docs/SCHEMA.md`.

### Regras de negócio importantes

- Produtos são cadastrados com valor pago, quantidade e unidade (g, kg, ml, l, un)
- Receitas têm rendimento (ex: 30 unidades) e margem de lucro (%)
- A conversão de unidades acontece na camada de serviço, não no banco
- Unidades compatíveis: g↔kg (massa), ml↔l (volume). Grupos diferentes são inválidos
- Fórmula de custo: `(valor_pago / quantidade_em_unidade_base) × quantidade_usada_em_unidade_base`
- Preço de venda: `(custo_total / rendimento) × (1 + margem_lucro / 100)`
- Alerta de validade: vermelho ≤ 7 dias, amarelo ≤ 30 dias

## Convenções de código

### Branches
```
<tipo>/<descricao-em-kebab-case>
feature/cadastro-produto
fix/calculo-margem-negativa
chore/setup-eslint
docs/atualizar-readme
```

### Commits (Conventional Commits)
```
feat: adiciona tela de cadastro de produto
fix: corrige cálculo de margem quando custo é zero
chore: configura eslint e prettier
docs: documenta schema do banco
```

## Documentação disponível

- `README.md` — visão geral do projeto
- `CONTRIBUTING.md` — fluxo de branches, commits e PRs
- `docs/ENVIRONMENT_SETUP.md` — setup do ambiente do zero
- `docs/ESTRUTURA.md` — detalhamento das pastas
- `docs/SCHEMA.md` — schema do banco com exemplos de cálculo
- `docs/BACKLOG_INICIAL.md` — 17 issues organizadas por épico
- `docs/ORGANIZANDO_ESTRUTURA.md` — como reorganizar a estrutura gerada pelo Expo

## Próximos passos

1. Criar as issues no GitHub a partir do `docs/BACKLOG_INICIAL.md`
2. Preencher `src/database/db.ts` com a inicialização do SQLite
3. Preencher `src/models/index.ts` com as tipagens
4. Implementar `src/services/calculoCusto.ts`
5. Começar o épico Dispensa (telas de listagem e cadastro de produtos)
