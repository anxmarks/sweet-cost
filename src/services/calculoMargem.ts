import { buscarConfiguracao } from "@/database/configuracaoRepository";
import { buscarReceitaPorId } from "@/database/receitaRepository";
import { calcularCustoTotalReceita } from "./calculoCusto";
import { calcularCustoFixoRateado } from "./calculoCustoFixo";
import { calcularCustoMaoDeObra } from "./calculoMaoDeObra";

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

  const custoIngredientes = calcularCustoTotalReceita(receitaId);
  const { valor_hora_mao_de_obra } = buscarConfiguracao();
  const custoMaoDeObra = calcularCustoMaoDeObra(receita.horas_producao, valor_hora_mao_de_obra);
  const custoTotal = custoIngredientes + custoMaoDeObra + receita.custo_embalagem;
  const custoFixoRateado = calcularCustoFixoRateado();

  return calcularPrecoVenda(custoTotal, receita.rendimento, receita.margem_lucro, custoFixoRateado);
}