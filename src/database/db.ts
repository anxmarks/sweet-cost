import { openDatabaseSync } from "expo-sqlite";

export const db = openDatabaseSync("sweetcost.db");

export function initDatabase() {
  db.execSync("PRAGMA foreign_keys = ON;");

  db.execSync(`
    CREATE TABLE IF NOT EXISTS produtos (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      nome            TEXT    NOT NULL,
      valor_pago      REAL    NOT NULL,
      quantidade      REAL    NOT NULL,
      unidade         TEXT    NOT NULL,
      data_compra     TEXT    NOT NULL,
      data_validade   TEXT,
      criado_em       TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

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
}