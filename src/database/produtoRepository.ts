import { Produto } from "@/models";
import { db } from "./db";

export function inserirProduto(produto: Omit<Produto, "id" | "criado_em">): number {
    const resultado = db.runSync(
        `INSERT INTO produtos (nome, marca, valor_pago, quantidade, unidade, data_compra, data_validade)
     VALUES ($nome, $marca, $valor_pago, $quantidade, $unidade, $data_compra, $data_validade)`,
     {
        $nome: produto.nome,
        $marca: produto.marca,
        $valor_pago: produto.valor_pago,
        $quantidade: produto.quantidade,
        $unidade: produto.unidade,
        $data_compra: produto.data_compra,
        $data_validade: produto.data_validade,
     }
    );
    return resultado.lastInsertRowId;
}

export function listarProdutos(): Produto[] {
  return db.getAllSync<Produto>("SELECT * FROM produtos ORDER BY nome");
}

export function buscarProdutoPorId(id: number): Produto | null {
  return db.getFirstSync<Produto>(
    "SELECT * FROM produtos WHERE id = $id",
    { $id: id }
  );
}

export function atualizarProduto(id: number, produto: Omit<Produto, "id" | "criado_em">): void {
  db.runSync(
    `UPDATE produtos
     SET nome = $nome,
         marca = $marca,
         valor_pago = $valor_pago,
         quantidade = $quantidade,
         unidade = $unidade,
         data_compra = $data_compra,
         data_validade = $data_validade
     WHERE id = $id`,
    {
      $nome: produto.nome,
      $marca: produto.marca,
      $valor_pago: produto.valor_pago,
      $quantidade: produto.quantidade,
      $unidade: produto.unidade,
      $data_compra: produto.data_compra,
      $data_validade: produto.data_validade,
      $id: id,
    }
  );
}

export function excluirProduto(id: number): void {
  db.runSync("DELETE FROM produtos WHERE id = $id", { $id: id });
}