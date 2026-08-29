import { Configuracao } from "@/models";
import { db } from "./db";

export function buscarConfiguracao(): Configuracao {
  return db.getFirstSync<Configuracao>("SELECT * FROM configuracoes WHERE id = 1")!;
}

export function atualizarReceitasEstimadasPorMes(valor: number): void {
  db.runSync("UPDATE configuracoes SET receitas_estimadas_por_mes = $valor WHERE id = 1", {
    $valor: valor,
  });
}

export function atualizarValorHoraMaoDeObra(valor: number): void {
  db.runSync("UPDATE configuracoes SET valor_hora_mao_de_obra = $valor WHERE id = 1", {
    $valor: valor,
  });
}
