import { buscarConfiguracao } from "@/database/configuracaoRepository";
import { listarReceitas } from "@/database/receitaRepository";
import { Receita } from "@/models";
import { calcularCustoTotalReceita } from "./calculoCusto";
import { calcularCustoFixoRateado } from "./calculoCustoFixo";
import { calcularCustoMaoDeObra } from "./calculoMaoDeObra";

export type ReceitaComProdutividade = Receita & {
  custoTotal: number;
  lucroTotal: number;
  lucroPorHora: number;
};

export function listarReceitasPorProdutividade(): ReceitaComProdutividade[] {
  const { valor_hora_mao_de_obra } = buscarConfiguracao();
  const custoFixoRateado = calcularCustoFixoRateado();

  return listarReceitas()
    .map((receita) => {
      const custoIngredientes = calcularCustoTotalReceita(receita.id);
      const custoMaoDeObra = calcularCustoMaoDeObra(receita.horas_producao, valor_hora_mao_de_obra);
      const custoTotal = custoIngredientes + custoMaoDeObra + custoFixoRateado + receita.custo_embalagem;
      const lucroTotal = custoTotal * (receita.margem_lucro / 100);
      const lucroPorHora = receita.horas_producao > 0 ? lucroTotal / receita.horas_producao : 0;

      return { ...receita, custoTotal, lucroTotal, lucroPorHora };
    })
    .sort((a, b) => b.lucroPorHora - a.lucroPorHora);
}
