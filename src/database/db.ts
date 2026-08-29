import { openDatabaseSync } from "expo-sqlite";

export const db = openDatabaseSync("sweetcost.db");

function colunaExiste(tabela: string, coluna: string): boolean {
  const colunas = db.getAllSync<{ name: string }>(`PRAGMA table_info(${tabela});`);
  return colunas.some((c) => c.name === coluna);
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

const CATEGORIAS_CUSTO_FIXO = ["aluguel", "luz", "gas", "agua", "impostos", "diversos"];

function seedCustosFixos() {
  for (const categoria of CATEGORIAS_CUSTO_FIXO) {
    db.runSync(
      "INSERT OR IGNORE INTO custos_fixos (categoria, valor) VALUES ($categoria, 0);",
      { $categoria: categoria }
    );
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
      criado_em           TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

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
      categoria TEXT    NOT NULL UNIQUE,
      valor     REAL    NOT NULL DEFAULT 0
    );
  `);

  seedCustosFixos();

  db.execSync(`
    CREATE TABLE IF NOT EXISTS configuracoes (
      id                          INTEGER PRIMARY KEY CHECK (id = 1),
      receitas_estimadas_por_mes  REAL    NOT NULL DEFAULT 0,
      valor_hora_mao_de_obra      REAL    NOT NULL DEFAULT 0
    );
  `);

  migrarAdicionarValorHoraEmConfiguracoes();

  seedConfiguracoes();
}