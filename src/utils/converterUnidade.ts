import { Unidade } from "@/models";

type Grupo = "massa" | "volume" | "contagem";

const GRUPOS: Record<Unidade, Grupo> = {
  g: "massa",
  kg: "massa",
  xicara: "massa",
  copo: "massa",
  colher_sopa: "massa",
  colher_cha: "massa",
  ml: "volume",
  l: "volume",
  un: "contagem",
};

// fator de multiplicação para chegar na unidade base do grupo (g para massa, ml para volume, un para contagem)
const FATORES_PARA_BASE: Record<Unidade, number> = {
  g: 1,
  kg: 1000,
  xicara: 120,
  copo: 200,
  colher_sopa: 15,
  colher_cha: 5,
  ml: 1,
  l: 1000,
  un: 1,
};

export function converterParaUnidadeBase(quantidade: number, unidade: Unidade): number {
  // multiplique quantidade pelo fator correspondente em FATORES_PARA_BASE
  return quantidade * FATORES_PARA_BASE[unidade];
}

export function unidadesSaoCompativeis(unidadeA: Unidade, unidadeB: Unidade): boolean {
  // compare o grupo de unidadeA com o grupo de unidadeB usando GRUPOS
  return GRUPOS[unidadeA] === GRUPOS[unidadeB];
}

export function validarCompatibilidade(unidadeA: Unidade, unidadeB: Unidade): void {
  // se unidadesSaoCompativeis retornar false, lance um Error explicando a incompatibilidade
  // (essa é a função que o calculoCusto.ts vai chamar antes de converter)
  if (!unidadesSaoCompativeis(unidadeA, unidadeB)) {
    throw new Error(`Unidades ${unidadeA} e ${unidadeB} não são compatíveis.`);
  }
}