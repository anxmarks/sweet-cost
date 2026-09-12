import { Unidade } from "@/models";

export const TODAS_UNIDADES: Unidade[] = ["g", "kg", "ml", "l", "un"];

const ROTULOS_SINGULARES: Record<Unidade, string> = {
  g: "grama",
  kg: "quilo",
  ml: "mililitro",
  l: "litro",
  un: "unidade",
};

export function rotuloUnidadeSingular(unidade: Unidade): string {
  return ROTULOS_SINGULARES[unidade];
}

type Grupo = "massa" | "volume" | "contagem";

const GRUPOS: Record<Unidade, Grupo> = {
  g: "massa",
  kg: "massa",
  ml: "volume",
  l: "volume",
  un: "contagem",
};

// fator de multiplicação para chegar na unidade base do grupo (g para massa, ml para volume, un para contagem)
const FATORES_PARA_BASE: Record<Unidade, number> = {
  g: 1,
  kg: 1000,
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

export function listarUnidadesCompativeis(unidade: Unidade): Unidade[] {
  const grupo = GRUPOS[unidade];
  return (Object.keys(GRUPOS) as Unidade[]).filter((candidata) => GRUPOS[candidata] === grupo);
}

export function validarCompatibilidade(unidadeA: Unidade, unidadeB: Unidade): void {
  // se unidadesSaoCompativeis retornar false, lance um Error explicando a incompatibilidade
  // (essa é a função que o calculoCusto.ts vai chamar antes de converter)
  if (!unidadesSaoCompativeis(unidadeA, unidadeB)) {
    throw new Error(`Unidades ${unidadeA} e ${unidadeB} não são compatíveis.`);
  }
}