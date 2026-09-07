import { openDatabaseSync } from "expo-sqlite";

export const db = openDatabaseSync("sweetcost.db");

function colunaExiste(tabela: string, coluna: string): boolean {
  const colunas = db.getAllSync<{ name: string }>(`PRAGMA table_info(${tabela});`);
  return colunas.some((c) => c.name === coluna);
}

function colunaObrigatoria(tabela: string, coluna: string): boolean {
  const colunas = db.getAllSync<{ name: string; notnull: number }>(`PRAGMA table_info(${tabela});`);
  return colunas.some((c) => c.name === coluna && c.notnull === 1);
}

function migrarAdicionarMarcaEmProdutos() {
  if (!colunaExiste("produtos", "marca")) {
    db.execSync("ALTER TABLE produtos ADD COLUMN marca TEXT;");
  }
}

function migrarAdicionarValorHoraEmConfiguracoes() {
  if (!colunaExiste("configuracoes", "valor_hora_mao_de_obra")) {
    db.execSync("ALTER TABLE configuracoes ADD COLUMN valor_hora_mao_de_obra REAL NOT NULL DEFAULT 0;");
  }
}

function migrarAdicionarHorasEmbalagemEmReceitas() {
  if (!colunaExiste("receitas", "horas_producao")) {
    db.execSync("ALTER TABLE receitas ADD COLUMN horas_producao REAL NOT NULL DEFAULT 0.5;");
  }
  if (!colunaExiste("receitas", "custo_embalagem")) {
    db.execSync("ALTER TABLE receitas ADD COLUMN custo_embalagem REAL NOT NULL DEFAULT 0;");
  }
}

function migrarAdicionarAnotacoesEmReceitas() {
  if (!colunaExiste("receitas", "anotacoes")) {
    db.execSync("ALTER TABLE receitas ADD COLUMN anotacoes TEXT NOT NULL DEFAULT '';");
  }
}

function migrarAdicionarFixadaEmReceitas() {
  if (!colunaExiste("receitas", "fixada")) {
    db.execSync("ALTER TABLE receitas ADD COLUMN fixada INTEGER NOT NULL DEFAULT 0;");
  }
}

function migrarAdicionarTagsEmReceitas() {
  if (!colunaExiste("receitas", "tags")) {
    db.execSync("ALTER TABLE receitas ADD COLUMN tags TEXT NOT NULL DEFAULT '';");
  }
}

function migrarAdicionarPerfilEmConfiguracoes() {
  if (!colunaExiste("configuracoes", "nome_usuario")) {
    db.execSync("ALTER TABLE configuracoes ADD COLUMN nome_usuario TEXT NOT NULL DEFAULT '';");
  }
  if (!colunaExiste("configuracoes", "atelie")) {
    db.execSync("ALTER TABLE configuracoes ADD COLUMN atelie TEXT NOT NULL DEFAULT '';");
  }
}

function migrarAdicionarOnboardingVistoEmConfiguracoes() {
  if (!colunaExiste("configuracoes", "onboarding_visto")) {
    db.execSync("ALTER TABLE configuracoes ADD COLUMN onboarding_visto INTEGER NOT NULL DEFAULT 0;");
  }
}

// rótulos das antigas categorias fixas, usados só para migrar os nomes uma vez
const ROTULOS_CATEGORIA_LEGADO: Record<string, string> = {
  aluguel: "Aluguel",
  luz: "Luz",
  gas: "Gás",
  agua: "Água",
  impostos: "Impostos",
  diversos: "Diversos",
};

function migrarNomeEmCustosFixos() {
  if (!colunaExiste("custos_fixos", "nome")) {
    db.execSync("ALTER TABLE custos_fixos ADD COLUMN nome TEXT;");
  }

  const semNome = db.getAllSync<{ id: number; categoria: string }>(
    "SELECT id, categoria FROM custos_fixos WHERE nome IS NULL OR nome = '';"
  );

  for (const custo of semNome) {
    const nome = ROTULOS_CATEGORIA_LEGADO[custo.categoria] ?? custo.categoria;
    db.runSync("UPDATE custos_fixos SET nome = $nome WHERE id = $id;", { $nome: nome, $id: custo.id });
  }

  // bancos criados antes da lista livre têm `categoria TEXT NOT NULL UNIQUE` — recria a
  // tabela sem essa restrição pra permitir contas novas sem categoria.
  if (colunaObrigatoria("custos_fixos", "categoria")) {
    db.execSync(`
      CREATE TABLE custos_fixos_novo (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        categoria TEXT,
        nome      TEXT,
        valor     REAL NOT NULL DEFAULT 0
      );
    `);
    db.execSync(
      "INSERT INTO custos_fixos_novo (id, categoria, nome, valor) SELECT id, categoria, nome, valor FROM custos_fixos;"
    );
    db.execSync("DROP TABLE custos_fixos;");
    db.execSync("ALTER TABLE custos_fixos_novo RENAME TO custos_fixos;");
  }
}

function seedConfiguracoes() {
  db.runSync(
    "INSERT OR IGNORE INTO configuracoes (id, receitas_estimadas_por_mes) VALUES (1, 0);"
  );
}

export function initDatabase() {
  db.execSync("PRAGMA foreign_keys = ON;");

  db.execSync(`
    CREATE TABLE IF NOT EXISTS produtos (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      nome            TEXT    NOT NULL,
      marca           TEXT,
      valor_pago      REAL    NOT NULL,
      quantidade      REAL    NOT NULL,
      unidade         TEXT    NOT NULL,
      data_compra     TEXT    NOT NULL,
      data_validade   TEXT,
      criado_em       TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  migrarAdicionarMarcaEmProdutos();

  db.execSync(`
    CREATE TABLE IF NOT EXISTS receitas (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      nome                TEXT    NOT NULL,
      rendimento          REAL    NOT NULL DEFAULT 1,
      unidade_rendimento  TEXT    NOT NULL DEFAULT 'un',
      margem_lucro        REAL    NOT NULL DEFAULT 0,
      horas_producao      REAL    NOT NULL DEFAULT 0.5,
      custo_embalagem     REAL    NOT NULL DEFAULT 0,
      anotacoes           TEXT    NOT NULL DEFAULT '',
      fixada              INTEGER NOT NULL DEFAULT 0,
      tags                TEXT    NOT NULL DEFAULT '',
      criado_em           TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  migrarAdicionarHorasEmbalagemEmReceitas();
  migrarAdicionarAnotacoesEmReceitas();
  migrarAdicionarFixadaEmReceitas();
  migrarAdicionarTagsEmReceitas();

  db.execSync(`
    CREATE TABLE IF NOT EXISTS ingredientes_receita (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      receita_id        INTEGER NOT NULL REFERENCES receitas(id) ON DELETE CASCADE,
      produto_id        INTEGER NOT NULL REFERENCES produtos(id) ON DELETE RESTRICT,
      quantidade_usada  REAL    NOT NULL,
      unidade_usada     TEXT    NOT NULL
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS custos_fixos (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      categoria TEXT    UNIQUE,
      nome      TEXT,
      valor     REAL    NOT NULL DEFAULT 0
    );
  `);

  migrarNomeEmCustosFixos();

  db.execSync(`
    CREATE TABLE IF NOT EXISTS configuracoes (
      id                          INTEGER PRIMARY KEY CHECK (id = 1),
      receitas_estimadas_por_mes  REAL    NOT NULL DEFAULT 0,
      valor_hora_mao_de_obra      REAL    NOT NULL DEFAULT 0,
      nome_usuario                TEXT    NOT NULL DEFAULT '',
      atelie                      TEXT    NOT NULL DEFAULT '',
      onboarding_visto            INTEGER NOT NULL DEFAULT 0
    );
  `);

  migrarAdicionarValorHoraEmConfiguracoes();
  migrarAdicionarPerfilEmConfiguracoes();
  migrarAdicionarOnboardingVistoEmConfiguracoes();

  seedConfiguracoes();
}