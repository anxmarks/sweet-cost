import { CustoFixo } from "@/models";
import { db } from "./db";

export function listarCustosFixos(): CustoFixo[] {
  return db.getAllSync<CustoFixo>("SELECT * FROM custos_fixos ORDER BY id");
}

export function atualizarValorCustoFixo(id: number, valor: number): void {
  db.runSync("UPDATE custos_fixos SET valor = $valor WHERE id = $id", {
    $valor: valor,
    $id: id,
  });
}
