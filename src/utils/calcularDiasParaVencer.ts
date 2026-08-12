export function calcularDiasParaVencer(dataValidade: string): number {
  const [ano, mes, dia] = dataValidade.split("-").map(Number);
  const vencimento = new Date(ano, mes - 1, dia);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const umDiaEmMs = 1000 * 60 * 60 * 24;
  return Math.round((vencimento.getTime() - hoje.getTime()) / umDiaEmMs);
}
