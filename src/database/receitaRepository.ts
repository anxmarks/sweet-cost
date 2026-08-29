import { IngredienteReceita, Receita } from "@/models";
import { db } from "./db";

export function inserirReceita(receita: Omit<Receita, "id" | "criado_em">): number {
  const resultado = db.runSync(
    `INSERT INTO receitas (nome, rendimento, unidade_rendimento, margem_lucro)
     VALUES ($nome, $rendimento, $unidade_rendimento, $margem_lucro)`,
    {
      $nome: receita.nome,
      $rendimento: receita.rendimento,
      $unidade_rendimento: receita.unidade_rendimento,
      $margem_lucro: receita.margem_lucro,
    }
  );
  return resultado.lastInsertRowId;
}

export function listarReceitas(): Receita[] {
  return db.getAllSync<Receita>("SELECT * FROM receitas ORDER BY nome");
}

export function buscarReceitaPorId(id: number): Receita | null {
  return db.getFirstSync<Receita>("SELECT * FROM receitas WHERE id = $id", { $id: id });
}

export function atualizarReceita(id: number, receita: Omit<Receita, "id" | "criado_em">): void {
  db.runSync(
    'UPDATE receitas SET nome = $nome, rendimento = $rendimento, unidade_rendimento = $unidade_rendimento, margem_lucro = $margem_lucro WHERE id = $id',
    {
      $nome: receita.nome,
      $rendimento: receita.rendimento,
      $unidade_rendimento: receita.unidade_rendimento,
      $margem_lucro: receita.margem_lucro,
      $id: id,
    }
  );
}

export function excluirReceita(id: number): void {
  db.runSync("DELETE FROM receitas WHERE id = $id", { $id: id });
}

export function inserirIngredienteReceita(ingrediente: Omit<IngredienteReceita, "id">): number {
  const resultado = db.runSync(
    `INSERT INTO ingredientes_receita (receita_id, produto_id, quantidade_usada, unidade_usada)
     VALUES ($receita_id, $produto_id, $quantidade_usada, $unidade_usada)`,
    {
      $receita_id: ingrediente.receita_id,
      $produto_id: ingrediente.produto_id,
      $quantidade_usada: ingrediente.quantidade_usada,
      $unidade_usada: ingrediente.unidade_usada,
    }
  );
  return resultado.lastInsertRowId;
}

export function listarIngredientesPorReceita(receitaId: number): IngredienteReceita[] {
  return db.getAllSync<IngredienteReceita>(
    "SELECT * FROM ingredientes_receita WHERE receita_id = $receita_id",
    { $receita_id: receitaId }
  );
}

export function excluirIngredienteReceita(id: number): void {
  db.runSync("DELETE FROM ingredientes_receita WHERE id = $id", { $id: id });
}

export function listarNomesReceitasUsandoProduto(produtoId: number): string[] {
  return db
    .getAllSync<{ nome: string }>(
      `SELECT DISTINCT r.nome
       FROM receitas r
       JOIN ingredientes_receita ir ON ir.receita_id = r.id
       WHERE ir.produto_id = $produto_id
       ORDER BY r.nome`,
      { $produto_id: produtoId }
    )
    .map((linha) => linha.nome);
}