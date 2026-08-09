import { IngredienteReceita, Produto } from "@/models";
import { converterParaUnidadeBase, validarCompatibilidade } from "@/utils/converterUnidade";
import { buscarProdutoPorId } from "@/database/produtoRepository";
import { listarIngredientesPorReceita } from "@/database/receitaRepository";

export function calcularCustoIngrediente(produto: Produto, ingrediente: IngredienteReceita): number {
  validarCompatibilidade(produto.unidade, ingrediente.unidade_usada);

  const quantidadeCompradaBase = converterParaUnidadeBase(produto.quantidade, produto.unidade);
  const custoPorUnidadeBase = produto.valor_pago / quantidadeCompradaBase;

  const quantidadeUsadaBase = converterParaUnidadeBase(
    ingrediente.quantidade_usada,
    ingrediente.unidade_usada
  );

  return custoPorUnidadeBase * quantidadeUsadaBase;
}

export function calcularCustoTotalReceita(receitaId: number): number {
  const ingredientes = listarIngredientesPorReceita(receitaId);

  return ingredientes.reduce((custoTotal, ingrediente) => {
    const produto = buscarProdutoPorId(ingrediente.produto_id);

    if (!produto) {
      throw new Error(
        `Produto ${ingrediente.produto_id} não encontrado para o ingrediente da receita ${receitaId}.`
      );
    }

    return custoTotal + calcularCustoIngrediente(produto, ingrediente);
  }, 0);
}