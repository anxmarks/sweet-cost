import { buscarConfiguracao } from "@/database/configuracaoRepository";
import { listarCustosFixos } from "@/database/custoFixoRepository";

export function calcularTotalCustosFixos(): number {
  return listarCustosFixos().reduce((total, custo) => total + custo.valor, 0);
}

export function calcularCustoFixoRateado(): number {
  const { receitas_estimadas_por_mes } = buscarConfiguracao();

  if (receitas_estimadas_por_mes <= 0) {
    return 0;
  }

  return calcularTotalCustosFixos() / receitas_estimadas_por_mes;
}
