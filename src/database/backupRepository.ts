import { Configuracao, CustoFixo, IngredienteReceita, Produto, Receita } from "@/models";
import { db } from "./db";

export const VERSAO_BACKUP = 1;

export type BackupDados = {
  versao: number;
  exportado_em: string;
  produtos: Produto[];
  receitas: Receita[];
  ingredientes_receita: IngredienteReceita[];
  custos_fixos: CustoFixo[];
  configuracao: Configuracao;
};

export function exportarBackup(): BackupDados {
  return {
    versao: VERSAO_BACKUP,
    exportado_em: new Date().toISOString(),
    produtos: db.getAllSync<Produto>("SELECT * FROM produtos"),
    receitas: db.getAllSync<Receita>("SELECT * FROM receitas"),
    ingredientes_receita: db.getAllSync<IngredienteReceita>("SELECT * FROM ingredientes_receita"),
    custos_fixos: db.getAllSync<CustoFixo>("SELECT id, nome, valor FROM custos_fixos"),
    configuracao: db.getFirstSync<Configuracao>("SELECT * FROM configuracoes WHERE id = 1")!,
  };
}

export function restaurarBackup(dados: BackupDados): void {
  db.withTransactionSync(() => {
    db.execSync("DELETE FROM ingredientes_receita;");
    db.execSync("DELETE FROM produtos;");
    db.execSync("DELETE FROM receitas;");
    db.execSync("DELETE FROM custos_fixos;");

    for (const p of dados.produtos) {
      db.runSync(
        `INSERT INTO produtos (id, nome, marca, valor_pago, quantidade, unidade, data_compra, data_validade, criado_em)
         VALUES ($id, $nome, $marca, $valor_pago, $quantidade, $unidade, $data_compra, $data_validade, $criado_em)`,
        {
          $id: p.id,
          $nome: p.nome,
          $marca: p.marca,
          $valor_pago: p.valor_pago,
          $quantidade: p.quantidade,
          $unidade: p.unidade,
          $data_compra: p.data_compra,
          $data_validade: p.data_validade,
          $criado_em: p.criado_em,
        }
      );
    }

    for (const r of dados.receitas) {
      db.runSync(
        `INSERT INTO receitas (id, nome, rendimento, unidade_rendimento, margem_lucro, horas_producao, custo_embalagem, anotacoes, fixada, tags, criado_em)
         VALUES ($id, $nome, $rendimento, $unidade_rendimento, $margem_lucro, $horas_producao, $custo_embalagem, $anotacoes, $fixada, $tags, $criado_em)`,
        {
          $id: r.id,
          $nome: r.nome,
          $rendimento: r.rendimento,
          $unidade_rendimento: r.unidade_rendimento,
          $margem_lucro: r.margem_lucro,
          $horas_producao: r.horas_producao,
          $custo_embalagem: r.custo_embalagem,
          $anotacoes: r.anotacoes,
          $fixada: r.fixada,
          $tags: r.tags,
          $criado_em: r.criado_em,
        }
      );
    }

    for (const i of dados.ingredientes_receita) {
      db.runSync(
        `INSERT INTO ingredientes_receita (id, receita_id, produto_id, quantidade_usada, unidade_usada)
         VALUES ($id, $receita_id, $produto_id, $quantidade_usada, $unidade_usada)`,
        {
          $id: i.id,
          $receita_id: i.receita_id,
          $produto_id: i.produto_id,
          $quantidade_usada: i.quantidade_usada,
          $unidade_usada: i.unidade_usada,
        }
      );
    }

    for (const c of dados.custos_fixos) {
      db.runSync("INSERT INTO custos_fixos (id, nome, valor) VALUES ($id, $nome, $valor)", {
        $id: c.id,
        $nome: c.nome,
        $valor: c.valor,
      });
    }

    const config = dados.configuracao;
    db.runSync(
      `UPDATE configuracoes
       SET receitas_estimadas_por_mes = $rem, valor_hora_mao_de_obra = $vhm,
           nome_usuario = $nome, atelie = $atelie, onboarding_visto = $onboarding
       WHERE id = 1`,
      {
        $rem: config.receitas_estimadas_por_mes,
        $vhm: config.valor_hora_mao_de_obra,
        $nome: config.nome_usuario,
        $atelie: config.atelie,
        $onboarding: config.onboarding_visto,
      }
    );
  });
}
