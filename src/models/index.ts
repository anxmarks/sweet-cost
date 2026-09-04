export type Unidade =
  | "g"
  | "kg"
  | "ml"
  | "l"
  | "un";

export interface Produto {
  id: number;
  nome: string;
  marca: string | null;
  valor_pago: number;
  quantidade: number;
  unidade: Unidade;
  data_compra: string;
  data_validade: string | null;
  criado_em: string;
}

export interface Receita {
    id: number;
    nome: string;
    rendimento: number;
    unidade_rendimento: string;
    margem_lucro: number;
    horas_producao: number;
    custo_embalagem: number;
    anotacoes: string;
    criado_em: string;
}

export interface IngredienteReceita {
    id: number;
    receita_id: number;
    produto_id: number;
    quantidade_usada: number;
    unidade_usada: Unidade;
}

export interface CustoFixo {
  id: number;
  nome: string;
  valor: number;
}

export interface Configuracao {
  id: number;
  receitas_estimadas_por_mes: number;
  valor_hora_mao_de_obra: number;
  nome_usuario: string;
  atelie: string;
}