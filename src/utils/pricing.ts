import {
  FinancialProfile,
  NegotiationSimulationResult,
  PriceDiagnosisResult,
  PriceDiagnosisStatus,
  PricingCalculationInput,
  PricingCalculationResult,
  ServiceFormInput,
} from '../types';

export type ValidationErrors = Record<string, string>;

export interface ProfileCalculationSummary {
  horasFaturaveisMensais: number;
  custoHora: number;
  custosFixosEfetivos: number;
  faturamentoMensalAlvo: number;
}

const EPSILON = 0.01;

export function getEffectiveMonthlyCosts(profile: FinancialProfile, totalRegisteredCosts: number): number {
  if (profile.usarCustosMensaisAutomaticos) {
    return Math.max(0, Number.isFinite(totalRegisteredCosts) ? totalRegisteredCosts : 0);
  }
  return Math.max(0, Number.isFinite(profile.custosFixosManuais) ? profile.custosFixosManuais : 0);
}

export function validateFinancialProfileValues(values: {
  remuneracaoMensal: number;
  custosFixosMensais: number;
  diasTrabalhadosMes: number;
  horasProdutivasDia: number;
  percentualFaturavel: number;
}): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!Number.isFinite(values.remuneracaoMensal) || values.remuneracaoMensal < 0) {
    errors.remuneracaoMensal = 'Informe uma remuneração mensal válida (valor não negativo).';
  }

  if (!Number.isFinite(values.custosFixosMensais) || values.custosFixosMensais < 0) {
    errors.custosFixosMensais = 'Os custos fixos mensais não podem ser negativos.';
  }

  if (!Number.isFinite(values.diasTrabalhadosMes) || values.diasTrabalhadosMes <= 0) {
    errors.diasTrabalhadosMes = 'Informe mais de 0 dias trabalhados por mês.';
  } else if (values.diasTrabalhadosMes > 31) {
    errors.diasTrabalhadosMes = 'O mês possui no máximo 31 dias.';
  }

  if (!Number.isFinite(values.horasProdutivasDia) || values.horasProdutivasDia <= 0) {
    errors.horasProdutivasDia = 'Informe mais de 0 horas produtivas por dia.';
  } else if (values.horasProdutivasDia > 24) {
    errors.horasProdutivasDia = 'O dia possui no máximo 24 horas.';
  }

  if (!Number.isFinite(values.percentualFaturavel) || values.percentualFaturavel <= 0) {
    errors.percentualFaturavel = 'O percentual faturável deve ser maior que 0%.';
  } else if (values.percentualFaturavel > 100) {
    errors.percentualFaturavel = 'O percentual faturável não pode ultrapassar 100%.';
  }

  if (
    values.remuneracaoMensal === 0 &&
    values.custosFixosMensais === 0 &&
    !errors.remuneracaoMensal &&
    !errors.custosFixosMensais
  ) {
    errors.remuneracaoMensal = 'Informe a remuneração mensal desejada ou cadastre custos fixos maiores que zero.';
  }

  return errors;
}

export function validateServiceFormValues(values: ServiceFormInput): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!values.nome.trim()) {
    errors.nome = 'Informe o nome do serviço.';
  }

  if (!Number.isFinite(values.horasNecessarias) || values.horasNecessarias <= 0) {
    errors.horasNecessarias = 'Informe uma quantidade de horas maior que zero.';
  }

  if (!Number.isFinite(values.custosAdicionais) || values.custosAdicionais < 0) {
    errors.custosAdicionais = 'Os custos adicionais não podem ser negativos.';
  }

  if (!Number.isFinite(values.margemLucro) || values.margemLucro < 0) {
    errors.margemLucro = 'A margem de lucro não pode ser negativa.';
  } else if (values.margemLucro >= 100) {
    errors.margemLucro = 'A margem de lucro deve ser inferior a 100%.';
  }

  if (!Number.isFinite(values.impostosTaxas) || values.impostosTaxas < 0) {
    errors.impostosTaxas = 'Os impostos e taxas não podem ser negativos.';
  } else if (values.impostosTaxas >= 100) {
    errors.impostosTaxas = 'Os impostos e taxas devem ser inferiores a 100%.';
  }

  if (
    Number.isFinite(values.margemLucro) &&
    Number.isFinite(values.impostosTaxas) &&
    values.margemLucro >= 0 &&
    values.impostosTaxas >= 0 &&
    values.margemLucro + values.impostosTaxas >= 100
  ) {
    errors.margemLucro =
      'A soma da margem de lucro com impostos e taxas deve ser menor que 100% do preço de venda.';
    errors.impostosTaxas =
      'Reduza a margem de lucro ou o percentual de impostos para que a soma seja inferior a 100%.';
  }

  return errors;
}

export function calculateProfileSummary(
  profile: FinancialProfile,
  totalRegisteredCosts: number
): ProfileCalculationSummary | null {
  const custosFixosEfetivos = getEffectiveMonthlyCosts(profile, totalRegisteredCosts);

  if (
    !Number.isFinite(profile.remuneracaoMensal) ||
    profile.remuneracaoMensal < 0 ||
    !Number.isFinite(custosFixosEfetivos) ||
    custosFixosEfetivos < 0 ||
    !Number.isFinite(profile.diasTrabalhadosMes) ||
    profile.diasTrabalhadosMes <= 0 ||
    profile.diasTrabalhadosMes > 31 ||
    !Number.isFinite(profile.horasProdutivasDia) ||
    profile.horasProdutivasDia <= 0 ||
    profile.horasProdutivasDia > 24 ||
    !Number.isFinite(profile.percentualFaturavel) ||
    profile.percentualFaturavel <= 0 ||
    profile.percentualFaturavel > 100
  ) {
    return null;
  }

  const faturavelDecimal = profile.percentualFaturavel / 100;
  const horasFaturaveisMensais =
    profile.diasTrabalhadosMes * profile.horasProdutivasDia * faturavelDecimal;

  if (horasFaturaveisMensais <= 0) {
    return null;
  }

  const faturamentoMensalAlvo = profile.remuneracaoMensal + custosFixosEfetivos;
  const custoHora = faturamentoMensalAlvo / horasFaturaveisMensais;

  return {
    horasFaturaveisMensais,
    custoHora,
    custosFixosEfetivos,
    faturamentoMensalAlvo,
  };
}

export function calculatePricing(
  input: PricingCalculationInput
): { ok: true; data: PricingCalculationResult } | { ok: false; errors: ValidationErrors } {
  const profileErrors = validateFinancialProfileValues({
    remuneracaoMensal: input.remuneracaoMensal,
    custosFixosMensais: input.custosFixosMensais,
    diasTrabalhadosMes: input.diasTrabalhadosMes,
    horasProdutivasDia: input.horasProdutivasDia,
    percentualFaturavel: input.percentualFaturavel,
  });

  const errors: ValidationErrors = { ...profileErrors };

  if (!Number.isFinite(input.horasNecessarias) || input.horasNecessarias <= 0) {
    errors.horasNecessarias = 'Informe uma quantidade de horas maior que zero.';
  }

  if (!Number.isFinite(input.custosAdicionais) || input.custosAdicionais < 0) {
    errors.custosAdicionais = 'Os custos adicionais não podem ser negativos.';
  }

  if (!Number.isFinite(input.margemLucro) || input.margemLucro < 0 || input.margemLucro >= 100) {
    errors.margemLucro = 'A margem de lucro deve estar entre 0% e 99,9%.';
  }

  if (!Number.isFinite(input.impostosTaxas) || input.impostosTaxas < 0 || input.impostosTaxas >= 100) {
    errors.impostosTaxas = 'Os impostos e taxas devem estar entre 0% e 99,9%.';
  }

  if (
    Number.isFinite(input.margemLucro) &&
    Number.isFinite(input.impostosTaxas) &&
    input.margemLucro + input.impostosTaxas >= 100
  ) {
    errors.margemLucro =
      'A soma da margem de lucro com os impostos e taxas deve ser menor que 100%.';
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  const faturavelDecimal = input.percentualFaturavel / 100;
  const margemDecimal = input.margemLucro / 100;
  const impostosDecimal = input.impostosTaxas / 100;

  const horasFaturaveisMensais =
    input.diasTrabalhadosMes * input.horasProdutivasDia * faturavelDecimal;

  const denominadorMinimo = 1 - impostosDecimal;
  const denominadorRecomendado = 1 - margemDecimal - impostosDecimal;

  if (horasFaturaveisMensais <= 0 || denominadorMinimo <= 0 || denominadorRecomendado <= 0) {
    return {
      ok: false,
      errors: {
        geral: 'Parâmetros inválidos resultariam em divisão por zero ou denominador negativo.',
      },
    };
  }

  const faturamentoMensalAlvo = input.remuneracaoMensal + input.custosFixosMensais;
  const custoHora = faturamentoMensalAlvo / horasFaturaveisMensais;
  const custoMaoDeObra = custoHora * input.horasNecessarias;
  const custoServico = custoMaoDeObra + input.custosAdicionais;

  const precoMinimo = custoServico / denominadorMinimo;
  const precoRecomendado = custoServico / denominadorRecomendado;

  const valorImpostosTaxas = precoRecomendado * impostosDecimal;
  const lucroLiquidoEstimado = precoRecomendado - custoServico - valorImpostosTaxas;
  const margemEfetiva =
    precoRecomendado > 0 ? (lucroLiquidoEstimado / precoRecomendado) * 100 : 0;

  return {
    ok: true,
    data: {
      horasFaturaveisMensais,
      custoHora,
      custoMaoDeObra,
      custoServico,
      precoMinimo,
      precoRecomendado,
      valorImpostosTaxas,
      lucroLiquidoEstimado,
      margemEfetiva,
      faturamentoMensalAlvo,
    },
  };
}

/**
 * 1. Diagnóstico de precificação
 * Compara o preço atualmente cobrado com o preço mínimo (sem lucro) e o preço recomendado.
 */
export function diagnoseCurrentPrice(params: {
  precoAtual: number;
  custoServico: number;
  precoMinimo: number;
  precoRecomendado: number;
  impostosTaxasPercent: number;
}): { ok: true; data: PriceDiagnosisResult } | { ok: false; error: string } {
  const { precoAtual, custoServico, precoMinimo, precoRecomendado, impostosTaxasPercent } = params;

  if (!Number.isFinite(precoAtual) || precoAtual <= 0) {
    return { ok: false, error: 'Informe um preço atual maior que zero para diagnosticar.' };
  }
  if (
    !Number.isFinite(custoServico) ||
    custoServico < 0 ||
    !Number.isFinite(precoMinimo) ||
    precoMinimo < 0 ||
    !Number.isFinite(precoRecomendado) ||
    precoRecomendado <= 0 ||
    !Number.isFinite(impostosTaxasPercent) ||
    impostosTaxasPercent < 0 ||
    impostosTaxasPercent >= 100
  ) {
    return { ok: false, error: 'Dados base do cálculo inválidos para diagnóstico.' };
  }

  const impostosDecimal = impostosTaxasPercent / 100;
  const impostosAtuais = precoAtual * impostosDecimal;
  const lucroLiquidoAtual = precoAtual - custoServico - impostosAtuais;
  const margemRealAtual = (lucroLiquidoAtual / precoAtual) * 100;

  const diferencaMonetaria = precoAtual - precoRecomendado;
  const diferencaPercentual = (diferencaMonetaria / precoRecomendado) * 100;
  const faltaParaEmpate = Math.max(0, precoMinimo - precoAtual);
  const faltaParaRecomendado = Math.max(0, precoRecomendado - precoAtual);

  let status: PriceDiagnosisStatus;
  if (lucroLiquidoAtual < -EPSILON) {
    status = 'loss';
  } else if (Math.abs(lucroLiquidoAtual) <= EPSILON) {
    status = 'breakeven';
  } else if (precoAtual < precoRecomendado - EPSILON) {
    status = 'below_recommended';
  } else {
    status = 'healthy';
  }

  return {
    ok: true,
    data: {
      precoAtual,
      diferencaMonetaria,
      diferencaPercentual,
      impostosAtuais,
      lucroLiquidoAtual,
      margemRealAtual,
      faltaParaEmpate,
      faltaParaRecomendado,
      status,
    },
  };
}

/**
 * 2. Simulador de negociação (descontos em tempo real)
 * Recalcula lucro líquido, impostos, margem efetiva e desconto máximo permitido sem prejuízo.
 */
export function simulateNegotiationDiscount(params: {
  descontoPercentual: number;
  custoServico: number;
  precoMinimo: number;
  precoRecomendado: number;
  impostosTaxasPercent: number;
}): { ok: true; data: NegotiationSimulationResult } | { ok: false; error: string } {
  const { descontoPercentual, custoServico, precoMinimo, precoRecomendado, impostosTaxasPercent } =
    params;

  if (!Number.isFinite(descontoPercentual) || descontoPercentual < 0) {
    return { ok: false, error: 'O desconto não pode ser negativo.' };
  }
  if (descontoPercentual >= 100) {
    return { ok: false, error: 'O desconto deve ser inferior a 100%.' };
  }
  if (
    !Number.isFinite(custoServico) ||
    custoServico < 0 ||
    !Number.isFinite(precoMinimo) ||
    precoMinimo < 0 ||
    !Number.isFinite(precoRecomendado) ||
    precoRecomendado <= 0 ||
    !Number.isFinite(impostosTaxasPercent) ||
    impostosTaxasPercent < 0 ||
    impostosTaxasPercent >= 100
  ) {
    return { ok: false, error: 'Dados base do cálculo inválidos para simulação.' };
  }

  const descontoDecimal = descontoPercentual / 100;
  const impostosDecimal = impostosTaxasPercent / 100;

  const precoComDesconto = precoRecomendado * (1 - descontoDecimal);
  const valorDesconto = precoRecomendado - precoComDesconto;
  const impostosComDesconto = precoComDesconto * impostosDecimal;
  const lucroLiquidoComDesconto = precoComDesconto - custoServico - impostosComDesconto;
  const margemEfetivaComDesconto =
    precoComDesconto > 0 ? (lucroLiquidoComDesconto / precoComDesconto) * 100 : 0;

  const descontoMaximoSemPrejuizoReais = Math.max(0, precoRecomendado - precoMinimo);
  const descontoMaximoSemPrejuizoPercent =
    precoRecomendado > 0 ? (descontoMaximoSemPrejuizoReais / precoRecomendado) * 100 : 0;

  const geraPrejuizo = lucroLiquidoComDesconto < -EPSILON;
  const noLimiteSemLucro = !geraPrejuizo && Math.abs(lucroLiquidoComDesconto) <= EPSILON;

  return {
    ok: true,
    data: {
      descontoPercentual,
      valorDesconto,
      precoComDesconto,
      impostosComDesconto,
      lucroLiquidoComDesconto,
      margemEfetivaComDesconto,
      descontoMaximoSemPrejuizoPercent,
      descontoMaximoSemPrejuizoReais,
      geraPrejuizo,
      noLimiteSemLucro,
    },
  };
}
