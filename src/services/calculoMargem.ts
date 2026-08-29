import { buscarReceitaPorId } from "@/database/receitaRepository";
import { calcularCustoTotalReceita } from "./calculoCusto";
import { calcularCustoFixoRateado } from "./calculoCustoFixo";

export function calcularPrecoVenda(
  custoTotal: number,
  rendimento: number,
  margemLucro: number,
  custoFixoRateado: number
): number {
  const custoPorUnidade = (custoTotal + custoFixoRateado) / rendimento;
  return custoPorUnidade * (1 + margemLucro / 100);
}

export function calcularPrecoVendaReceita(receitaId: number): number {
  const receita = buscarReceitaPorId(receitaId);

  if (!receita) {
    throw new Error(`Receita ${receitaId} não encontrada.`);
  }

  const custoTotal = calcularCustoTotalReceita(receitaId);
  const custoFixoRateado = calcularCustoFixoRateado();

  return calcularPrecoVenda(custoTotal, receita.rendimento, receita.margem_lucro, custoFixoRateado);
}