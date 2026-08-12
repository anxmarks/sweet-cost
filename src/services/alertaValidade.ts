import { calcularDiasParaVencer } from "@/utils/calcularDiasParaVencer";

export type NivelAlerta = "vermelho" | "amarelo" | null;

export function calcularAlertaValidade(dataValidade: string | null): NivelAlerta {
  if (!dataValidade) {
    return null;
  }

  const dias = calcularDiasParaVencer(dataValidade);

  if (dias <= 7) {
    return "vermelho";
  }

  if (dias <= 30) {
    return "amarelo";
  }

  return null;
}
