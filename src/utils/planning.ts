export type CapacityStatus = 'viable' | 'tight' | 'overloaded' | 'unknown';

export interface SingleServiceGoalProjection {
  unidadesExatas: number;
  unidadesNecessarias: number;
  horasNecessarias: number;
  ocupacaoCapacidadePercent: number | null;
  horasExcedentes: number;
  faturamentoComUnidades: number;
  faturamentoMaximoCapacidade: number | null;
  unidadesMaximasCapacidade: number | null;
  receitaPorHoraServico: number;
  status: CapacityStatus;
}

export interface ServiceMixItemInput {
  id: string;
  nome: string;
  precoRecomendado: number;
  tempoEstimado: number;
  quantidade: number;
}

export interface ServiceMixSummary {
  totalUnidades: number;
  faturamentoProjetado: number;
  diferencaParaMeta: number;
  percentualMetaAtingida: number;
  horasAlocadas: number;
  ocupacaoCapacidadePercent: number | null;
  horasDisponiveisRestantes: number | null;
  statusCapacidade: CapacityStatus;
}

export function calculateServiceGoalProjection(params: {
  metaFaturamentoMensal: number;
  precoUnitario: number;
  horasPorServico: number;
  horasFaturaveisMensais: number | null;
}): { ok: true; data: SingleServiceGoalProjection } | { ok: false; error: string } {
  const { metaFaturamentoMensal, precoUnitario, horasPorServico, horasFaturaveisMensais } = params;

  if (!Number.isFinite(metaFaturamentoMensal) || metaFaturamentoMensal <= 0) {
    return { ok: false, error: 'Informe uma meta de faturamento mensal maior que zero.' };
  }
  if (!Number.isFinite(precoUnitario) || precoUnitario <= 0) {
    return { ok: false, error: 'O preço do serviço deve ser maior que zero.' };
  }
  if (!Number.isFinite(horasPorServico) || horasPorServico <= 0) {
    return { ok: false, error: 'O tempo estimado do serviço deve ser maior que zero.' };
  }

  const unidadesExatas = metaFaturamentoMensal / precoUnitario;
  const unidadesNecessarias = Math.ceil(unidadesExatas);
  const horasNecessarias = unidadesNecessarias * horasPorServico;
  const faturamentoComUnidades = unidadesNecessarias * precoUnitario;
  const receitaPorHoraServico = precoUnitario / horasPorServico;

  let ocupacaoCapacidadePercent: number | null = null;
  let horasExcedentes = 0;
  let faturamentoMaximoCapacidade: number | null = null;
  let unidadesMaximasCapacidade: number | null = null;
  let status: CapacityStatus = 'unknown';

  if (horasFaturaveisMensais !== null && Number.isFinite(horasFaturaveisMensais) && horasFaturaveisMensais > 0) {
    ocupacaoCapacidadePercent = (horasNecessarias / horasFaturaveisMensais) * 100;
    horasExcedentes = Math.max(0, horasNecessarias - horasFaturaveisMensais);
    unidadesMaximasCapacidade = Math.floor(horasFaturaveisMensais / horasPorServico);
    faturamentoMaximoCapacidade = unidadesMaximasCapacidade * precoUnitario;

    if (ocupacaoCapacidadePercent <= 85) {
      status = 'viable';
    } else if (ocupacaoCapacidadePercent <= 100) {
      status = 'tight';
    } else {
      status = 'overloaded';
    }
  }

  return {
    ok: true,
    data: {
      unidadesExatas,
      unidadesNecessarias,
      horasNecessarias,
      ocupacaoCapacidadePercent,
      horasExcedentes,
      faturamentoComUnidades,
      faturamentoMaximoCapacidade,
      unidadesMaximasCapacidade,
      receitaPorHoraServico,
      status,
    },
  };
}

export function calculateServiceMixSummary(params: {
  metaFaturamentoMensal: number;
  items: ServiceMixItemInput[];
  horasFaturaveisMensais: number | null;
}): ServiceMixSummary {
  const { metaFaturamentoMensal, items, horasFaturaveisMensais } = params;

  let totalUnidades = 0;
  let faturamentoProjetado = 0;
  let horasAlocadas = 0;

  for (const item of items) {
    const qty = Number.isFinite(item.quantidade) && item.quantidade > 0 ? Math.floor(item.quantidade) : 0;
    if (qty <= 0) continue;
    if (!Number.isFinite(item.precoRecomendado) || item.precoRecomendado < 0) continue;
    if (!Number.isFinite(item.tempoEstimado) || item.tempoEstimado < 0) continue;

    totalUnidades += qty;
    faturamentoProjetado += qty * item.precoRecomendado;
    horasAlocadas += qty * item.tempoEstimado;
  }

  const safeMeta = Number.isFinite(metaFaturamentoMensal) && metaFaturamentoMensal > 0 ? metaFaturamentoMensal : 0;
  const diferencaParaMeta = faturamentoProjetado - safeMeta;
  const percentualMetaAtingida = safeMeta > 0 ? (faturamentoProjetado / safeMeta) * 100 : 0;

  let ocupacaoCapacidadePercent: number | null = null;
  let horasDisponiveisRestantes: number | null = null;
  let statusCapacidade: CapacityStatus = 'unknown';

  if (horasFaturaveisMensais !== null && Number.isFinite(horasFaturaveisMensais) && horasFaturaveisMensais > 0) {
    ocupacaoCapacidadePercent = (horasAlocadas / horasFaturaveisMensais) * 100;
    horasDisponiveisRestantes = horasFaturaveisMensais - horasAlocadas;
    if (ocupacaoCapacidadePercent <= 85) {
      statusCapacidade = 'viable';
    } else if (ocupacaoCapacidadePercent <= 100) {
      statusCapacidade = 'tight';
    } else {
      statusCapacidade = 'overloaded';
    }
  }

  return {
    totalUnidades,
    faturamentoProjetado,
    diferencaParaMeta,
    percentualMetaAtingida,
    horasAlocadas,
    ocupacaoCapacidadePercent,
    horasDisponiveisRestantes,
    statusCapacidade,
  };
}
