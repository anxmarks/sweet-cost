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

export function atualizarPerfil(nome: string, atelie: string): void {
  db.runSync("UPDATE configuracoes SET nome_usuario = $nome, atelie = $atelie WHERE id = 1", {
    $nome: nome,
    $atelie: atelie,
  });
}

export function atualizarOnboardingVisto(visto: boolean): void {
  db.runSync("UPDATE configuracoes SET onboarding_visto = $visto WHERE id = 1", {
    $visto: visto ? 1 : 0,
  });
}
