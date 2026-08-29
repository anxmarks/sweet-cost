import { CustoFixo } from "@/models";
import { db } from "./db";

export function listarCustosFixos(): CustoFixo[] {
  return db.getAllSync<CustoFixo>("SELECT id, nome, valor FROM custos_fixos ORDER BY id");
}

export function inserirCustoFixo(nome: string, valor: number): number {
  const resultado = db.runSync(
    "INSERT INTO custos_fixos (nome, valor) VALUES ($nome, $valor)",
    { $nome: nome, $valor: valor }
  );
  return resultado.lastInsertRowId;
}

export function atualizarCustoFixo(id: number, nome: string, valor: number): void {
  db.runSync("UPDATE custos_fixos SET nome = $nome, valor = $valor WHERE id = $id", {
    $nome: nome,
    $valor: valor,
    $id: id,
  });
}

export function removerCustoFixo(id: number): void {
  db.runSync("DELETE FROM custos_fixos WHERE id = $id", { $id: id });
}
