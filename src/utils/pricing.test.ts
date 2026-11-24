import { describe, expect, it } from 'vitest';
import {
  calculatePricing,
  calculateProfileSummary,
  diagnoseCurrentPrice,
  floorToDecimals,
  simulateNegotiationDiscount,
  validateFinancialProfileValues,
} from './pricing';
import { calculateServiceGoalProjection, calculateServiceMixSummary } from './planning';
import { generateSmartRecommendations } from './recommendations';
import { parseNumericInput } from './format';
import { parseAndValidateBackup, sanitizeStatePayload } from './backup';
import { AppState } from '../types';

describe('Fórmulas matemáticas do Preço Justo', () => {
  it('calcula corretamente horas faturáveis, custo da hora, custo do serviço, preço mínimo, preço recomendado e lucro líquido', () => {
    const res = calculatePricing({
      remuneracaoMensal: 4500,
      custosFixosMensais: 900,
      diasTrabalhadosMes: 20,
      horasProdutivasDia: 6,
      percentualFaturavel: 75,
      horasNecessarias: 10,
      custosAdicionais: 100,
      margemLucro: 20,
      impostosTaxas: 10,
    });

    expect(res.ok).toBe(true);
    if (!res.ok) return;

    expect(res.data.horasFaturaveisMensais).toBeCloseTo(90, 5);
    expect(res.data.custoHora).toBeCloseTo(60, 5);
    expect(res.data.custoMaoDeObra).toBeCloseTo(600, 5);
    expect(res.data.custoServico).toBeCloseTo(700, 5);
    expect(res.data.precoMinimo).toBeCloseTo(777.7778, 3);
    expect(res.data.precoRecomendado).toBeCloseTo(1000, 5);
    expect(res.data.valorImpostosTaxas).toBeCloseTo(100, 5);
    expect(res.data.lucroLiquidoEstimado).toBeCloseTo(200, 5);
    expect(res.data.margemEfetiva).toBeCloseTo(20, 5);
  });

  it('trata margem sobre o preço de venda (não acréscimo sobre custo)', () => {
    const res = calculatePricing({
      remuneracaoMensal: 4000,
      custosFixosMensais: 1000,
      diasTrabalhadosMes: 20,
      horasProdutivasDia: 5,
      percentualFaturavel: 100,
      horasNecessarias: 10,
      custosAdicionais: 0,
      margemLucro: 50,
      impostosTaxas: 0,
    });

    expect(res.ok).toBe(true);
    if (!res.ok) return;

    expect(res.data.custoServico).toBeCloseTo(500, 5);
    expect(res.data.precoRecomendado).toBeCloseTo(1000, 5);
    expect(res.data.lucroLiquidoEstimado).toBeCloseTo(500, 5);
    expect(res.data.margemEfetiva).toBeCloseTo(50, 5);
  });

  it('impede soma de margem de lucro + impostos igual ou superior a 100% e valores extremos inválidos', () => {
    const equal100 = calculatePricing({
      remuneracaoMensal: 4000,
      custosFixosMensais: 1000,
      diasTrabalhadosMes: 20,
      horasProdutivasDia: 6,
      percentualFaturavel: 70,
      horasNecessarias: 5,
      custosAdicionais: 0,
      margemLucro: 80,
      impostosTaxas: 20,
    });
    expect(equal100.ok).toBe(false);

    const over100 = calculatePricing({
      remuneracaoMensal: 4000,
      custosFixosMensais: 1000,
      diasTrabalhadosMes: 20,
      horasProdutivasDia: 6,
      percentualFaturavel: 70,
      horasNecessarias: 5,
      custosAdicionais: 0,
      margemLucro: 85,
      impostosTaxas: 20,
    });
    expect(over100.ok).toBe(false);

    const nanOrInf = calculatePricing({
      remuneracaoMensal: Number.POSITIVE_INFINITY,
      custosFixosMensais: 1000,
      diasTrabalhadosMes: 20,
      horasProdutivasDia: 6,
      percentualFaturavel: 70,
      horasNecessarias: Number.NaN,
      custosAdicionais: 0,
      margemLucro: 20,
      impostosTaxas: 6,
    });
    expect(nanOrInf.ok).toBe(false);
  });

  it('suporta valores extremos válidos (alto faturamento, margem 99%, fração mínima de hora)', () => {
    const highValue = calculatePricing({
      remuneracaoMensal: 100000,
      custosFixosMensais: 20000,
      diasTrabalhadosMes: 20,
      horasProdutivasDia: 8,
      percentualFaturavel: 75,
      horasNecessarias: 0.25,
      custosAdicionais: 5000,
      margemLucro: 90,
      impostosTaxas: 9,
    });
    expect(highValue.ok).toBe(true);
    if (!highValue.ok) return;
    // Horas faturáveis = 120h -> custoHora = 1000 -> mao de obra = 250 -> custoServico = 5250
    // denom = 1 - 0.90 - 0.09 = 0.01 -> precoRecomendado = 525.000
    expect(highValue.data.custoServico).toBeCloseTo(5250, 2);
    expect(highValue.data.precoRecomendado).toBeCloseTo(525000, 1);
    expect(highValue.data.margemEfetiva).toBeCloseTo(90, 2);
  });

  it('impede divisão por zero e valores negativos', () => {
    const zeroDays = calculatePricing({
      remuneracaoMensal: 4000,
      custosFixosMensais: 1000,
      diasTrabalhadosMes: 0,
      horasProdutivasDia: 6,
      percentualFaturavel: 70,
      horasNecessarias: 5,
      custosAdicionais: 0,
      margemLucro: 20,
      impostosTaxas: 6,
    });
    expect(zeroDays.ok).toBe(false);

    const zeroBillable = calculatePricing({
      remuneracaoMensal: 4000,
      custosFixosMensais: 1000,
      diasTrabalhadosMes: 20,
      horasProdutivasDia: 6,
      percentualFaturavel: 0,
      horasNecessarias: 5,
      custosAdicionais: 0,
      margemLucro: 20,
      impostosTaxas: 6,
    });
    expect(zeroBillable.ok).toBe(false);

    const negativeValues = calculatePricing({
      remuneracaoMensal: -100,
      custosFixosMensais: 500,
      diasTrabalhadosMes: 20,
      horasProdutivasDia: 6,
      percentualFaturavel: 70,
      horasNecessarias: 5,
      custosAdicionais: -10,
      margemLucro: -5,
      impostosTaxas: 6,
    });
    expect(negativeValues.ok).toBe(false);
  });

  it('usa custos mensais cadastrados sem duplicação no cálculo do perfil', () => {
    const summary = calculateProfileSummary(
      {
        remuneracaoMensal: 5000,
        usarCustosMensaisAutomaticos: true,
        custosFixosManuais: 9999,
        diasTrabalhadosMes: 20,
        horasProdutivasDia: 6,
        percentualFaturavel: 75,
        margemLucroPadrao: 25,
        impostosTaxasPadrao: 6,
      },
      1300
    );

    expect(summary).not.toBeNull();
    expect(summary?.custosFixosEfetivos).toBe(1300);
    expect(summary?.faturamentoMensalAlvo).toBe(6300);
    expect(summary?.custoHora).toBeCloseTo(70, 5);
  });
});

describe('Diagnóstico de precificação (preço atual vs recomendado vs prejuízo)', () => {
  // Base: custoServico = 700, impostos = 10%, precoMinimo = 777.78, precoRecomendado = 1000
  const base = {
    custoServico: 700,
    precoMinimo: 700 / 0.9,
    precoRecomendado: 1000,
    impostosTaxasPercent: 10,
  };

  it('identifica prejuízo real quando preço atual é menor que o preço mínimo', () => {
    const diag = diagnoseCurrentPrice({ ...base, precoAtual: 700 });
    expect(diag.ok).toBe(true);
    if (!diag.ok) return;
    // Imposto = 70 -> Lucro líquido = 700 - 700 - 70 = -70 (prejuízo!)
    expect(diag.data.status).toBe('loss');
    expect(diag.data.lucroLiquidoAtual).toBeCloseTo(-70, 2);
    expect(diag.data.margemRealAtual).toBeCloseTo(-10, 2);
    expect(diag.data.diferencaMonetaria).toBeCloseTo(-300, 2);
    expect(diag.data.diferencaPercentual).toBeCloseTo(-30, 2);
    expect(diag.data.faltaParaEmpate).toBeCloseTo(77.78, 2);
  });

  it('diferencia preço abaixo do recomendado (com lucro) de prejuízo', () => {
    const diag = diagnoseCurrentPrice({ ...base, precoAtual: 900 });
    expect(diag.ok).toBe(true);
    if (!diag.ok) return;
    // Imposto = 90 -> Lucro líquido = 900 - 700 - 90 = +110 (lucro positivo, abaixo do recomendado)
    expect(diag.data.status).toBe('below_recommended');
    expect(diag.data.lucroLiquidoAtual).toBeCloseTo(110, 2);
    expect(diag.data.margemRealAtual).toBeCloseTo(12.22, 2);
    expect(diag.data.faltaParaEmpate).toBe(0);
    expect(diag.data.faltaParaRecomendado).toBeCloseTo(100, 2);
  });

  it('identifica empate técnico exato no preço mínimo', () => {
    const diag = diagnoseCurrentPrice({ ...base, precoAtual: 700 / 0.9 });
    expect(diag.ok).toBe(true);
    if (!diag.ok) return;
    expect(diag.data.status).toBe('breakeven');
    expect(Math.abs(diag.data.lucroLiquidoAtual)).toBeLessThan(0.01);
  });

  it('identifica preço saudável quando igual ou acima do recomendado', () => {
    const diag = diagnoseCurrentPrice({ ...base, precoAtual: 1200 });
    expect(diag.ok).toBe(true);
    if (!diag.ok) return;
    expect(diag.data.status).toBe('healthy');
    expect(diag.data.diferencaMonetaria).toBeCloseTo(200, 2);
    expect(diag.data.diferencaPercentual).toBeCloseTo(20, 2);
    expect(diag.data.lucroLiquidoAtual).toBeCloseTo(380, 2);
  });

  it('bloqueia preço atual zero ou negativo', () => {
    expect(diagnoseCurrentPrice({ ...base, precoAtual: 0 }).ok).toBe(false);
    expect(diagnoseCurrentPrice({ ...base, precoAtual: -50 }).ok).toBe(false);
  });
});

describe('Simulador de negociação (descontos em tempo real)', () => {
  // Base: custoServico = 700, impostos = 10%, precoMinimo = 777.7778, precoRecomendado = 1000
  // Desconto máximo sem prejuízo = (1000 - 777.7778) / 1000 = 22.2222%
  const base = {
    custoServico: 700,
    precoMinimo: 700 / 0.9,
    precoRecomendado: 1000,
    impostosTaxasPercent: 10,
  };

  it('recalcula lucro líquido, impostos e margem efetiva com desconto seguro', () => {
    const sim = simulateNegotiationDiscount({ ...base, descontoPercentual: 10 });
    expect(sim.ok).toBe(true);
    if (!sim.ok) return;
    // Preço com 10% desc = 900; imposto 10% = 90; lucro = 900 - 700 - 90 = 110; margem = 110/900 = 12.22%
    expect(sim.data.precoComDesconto).toBeCloseTo(900, 2);
    expect(sim.data.valorDesconto).toBeCloseTo(100, 2);
    expect(sim.data.impostosComDesconto).toBeCloseTo(90, 2);
    expect(sim.data.lucroLiquidoComDesconto).toBeCloseTo(110, 2);
    expect(sim.data.margemEfetivaComDesconto).toBeCloseTo(12.222, 2);
    expect(sim.data.descontoMaximoSemPrejuizoPercent).toBeCloseTo(22.222, 2);
    expect(sim.data.geraPrejuizo).toBe(false);
  });

  it('sinaliza prejuízo quando desconto excede o limite máximo permitido', () => {
    const sim = simulateNegotiationDiscount({ ...base, descontoPercentual: 25 });
    expect(sim.ok).toBe(true);
    if (!sim.ok) return;
    // Preço = 750; imposto = 75; lucro = 750 - 700 - 75 = -25
    expect(sim.data.precoComDesconto).toBeCloseTo(750, 2);
    expect(sim.data.lucroLiquidoComDesconto).toBeCloseTo(-25, 2);
    expect(sim.data.geraPrejuizo).toBe(true);
  });

  it('atinge empate exato no desconto máximo permitido sem prejuízo', () => {
    const maxDiscount = (1 - 700 / 0.9 / 1000) * 100;
    const sim = simulateNegotiationDiscount({ ...base, descontoPercentual: maxDiscount });
    expect(sim.ok).toBe(true);
    if (!sim.ok) return;
    expect(sim.data.geraPrejuizo).toBe(false);
    expect(sim.data.noLimiteSemLucro).toBe(true);
    expect(Math.abs(sim.data.lucroLiquidoComDesconto)).toBeLessThan(0.01);
  });

  it('rejeita descontos negativos ou iguais/superiores a 100%', () => {
    expect(simulateNegotiationDiscount({ ...base, descontoPercentual: -1 }).ok).toBe(false);
    expect(simulateNegotiationDiscount({ ...base, descontoPercentual: 100 }).ok).toBe(false);
    expect(simulateNegotiationDiscount({ ...base, descontoPercentual: 150 }).ok).toBe(false);
  });
});

describe('Planejamento de metas e capacidade faturável', () => {
  it('calcula unidades necessárias, horas exigidas e detecta sobrecarga de capacidade', () => {
    const proj = calculateServiceGoalProjection({
      metaFaturamentoMensal: 10000,
      precoUnitario: 1000,
      horasPorServico: 12,
      horasFaturaveisMensais: 90,
    });
    expect(proj.ok).toBe(true);
    if (!proj.ok) return;

    expect(proj.data.unidadesNecessarias).toBe(10);
    expect(proj.data.horasNecessarias).toBe(120);
    expect(proj.data.ocupacaoCapacidadePercent).toBeCloseTo(133.33, 2);
    expect(proj.data.horasExcedentes).toBe(30);
    expect(proj.data.unidadesMaximasCapacidade).toBe(7);
    expect(proj.data.faturamentoMaximoCapacidade).toBe(7000);
    expect(proj.data.status).toBe('overloaded');
  });

  it('calcula resumo do mix de serviços corretamente', () => {
    const mix = calculateServiceMixSummary({
      metaFaturamentoMensal: 8000,
      horasFaturaveisMensais: 90,
      items: [
        { id: '1', nome: 'Site', precoRecomendado: 3000, tempoEstimado: 25, quantidade: 2 },
        { id: '2', nome: 'Post', precoRecomendado: 500, tempoEstimado: 4, quantidade: 4 },
      ],
    });

    expect(mix.totalUnidades).toBe(6);
    expect(mix.faturamentoProjetado).toBe(8000);
    expect(mix.percentualMetaAtingida).toBeCloseTo(100, 2);
    expect(mix.horasAlocadas).toBe(66);
    expect(mix.horasDisponiveisRestantes).toBe(24);
    expect(mix.statusCapacidade).toBe('viable');
  });

  it('impede divisões por zero em metas ou preços zerados', () => {
    expect(
      calculateServiceGoalProjection({
        metaFaturamentoMensal: 0,
        precoUnitario: 500,
        horasPorServico: 5,
        horasFaturaveisMensais: 90,
      }).ok
    ).toBe(false);

    expect(
      calculateServiceGoalProjection({
        metaFaturamentoMensal: 5000,
        precoUnitario: 0,
        horasPorServico: 5,
        horasFaturaveisMensais: 90,
      }).ok
    ).toBe(false);
  });
});

describe('Recomendações inteligentes determinísticas', () => {
  const baseState: AppState = {
    theme: 'light',
    profile: {
      remuneracaoMensal: 5000,
      usarCustosMensaisAutomaticos: true,
      custosFixosManuais: 0,
      diasTrabalhadosMes: 20,
      horasProdutivasDia: 6,
      percentualFaturavel: 75,
      margemLucroPadrao: 25,
      impostosTaxasPadrao: 6,
    },
    costs: [
      {
        id: 'c1',
        nome: 'Internet',
        categoria: 'Internet',
        valor: 400,
        createdAt: '2026-10-01T00:00:00Z',
      },
    ],
    services: [
      {
        id: 's1',
        nome: 'Logo subprecificado',
        categoria: 'Design',
        descricao: '',
        tempoEstimado: 10,
        custoAdicional: 0,
        precoRecomendado: 500, // Custo é 600 -> prejuízo!
        margemLucro: 25,
        impostosTaxas: 6,
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z',
      },
    ],
    history: [],
    professional: {
      nomeProfissional: '',
      especialidade: '',
      email: '',
      telefone: '',
      documento: '',
      cidade: '',
      validadePadraoDias: 15,
      observacoesPadrao: '',
    },
    goal: {
      metaFaturamentoMensal: 0,
      mixQuantidades: {},
    },
    onboardingCompleted: true,
  };

  it('detecta serviço cadastrado abaixo do custo mínimo como alerta crítico', () => {
    const recs = generateSmartRecommendations(baseState, 400);
    expect(recs.some((r) => r.id === 'rec-services-loss' && r.severity === 'critical')).toBe(true);
  });

  it('emite diagnóstico saudável quando estrutura e serviços estão equilibrados', () => {
    const healthyState: AppState = {
      ...baseState,
      services: [
        {
          ...baseState.services[0],
          precoRecomendado: 1200,
        },
      ],
    };
    const recs = generateSmartRecommendations(healthyState, 400);
    expect(recs[0]?.id).toBe('rec-healthy-structure');
    expect(recs[0]?.severity).toBe('healthy');
  });

  it('considera custos fixos manuais nas recomendações quando modo automático está desativado', () => {
    const manualState: AppState = {
      ...baseState,
      costs: [],
      profile: {
        ...baseState.profile,
        usarCustosMensaisAutomaticos: false,
        custosFixosManuais: 4000,
      },
      services: [],
    };
    const recs = generateSmartRecommendations(manualState, 0);
    expect(recs.some((r) => r.id === 'rec-heavy-fixed-costs')).toBe(true);
    expect(recs.some((r) => r.id === 'rec-no-costs')).toBe(false);
  });
});

describe('Regressões da auditoria: limite de desconto, parsing numérico, custos manuais e backup JSON', () => {
  it('trunca para baixo o teto de desconto seguro (25% margem + 6% impostos = 26,5% sem prejuízo)', () => {
    const calc = calculatePricing({
      remuneracaoMensal: 5500,
      custosFixosMensais: 1578.9,
      diasTrabalhadosMes: 20,
      horasProdutivasDia: 6,
      percentualFaturavel: 75,
      horasNecessarias: 10,
      custosAdicionais: 100,
      margemLucro: 25,
      impostosTaxas: 6,
    });
    expect(calc.ok).toBe(true);
    if (!calc.ok) return;

    const rawMax =
      ((calc.data.precoRecomendado - calc.data.precoMinimo) / calc.data.precoRecomendado) * 100;
    const safePreset = floorToDecimals(rawMax, 1);
    expect(safePreset).toBe(26.5);

    const sim = simulateNegotiationDiscount({
      descontoPercentual: safePreset,
      custoServico: calc.data.custoServico,
      precoMinimo: calc.data.precoMinimo,
      precoRecomendado: calc.data.precoRecomendado,
      impostosTaxasPercent: 6,
    });
    expect(sim.ok).toBe(true);
    if (!sim.ok) return;
    expect(sim.data.geraPrejuizo).toBe(false);
    expect(sim.data.lucroLiquidoComDesconto).toBeGreaterThanOrEqual(0);
  });

  it('interpreta corretamente números em formato brasileiro e padrão via parseNumericInput', () => {
    expect(parseNumericInput('')).toBe(0);
    expect(parseNumericInput('', NaN)).toBeNaN();
    expect(parseNumericInput('149,90')).toBeCloseTo(149.9, 5);
    expect(parseNumericInput('1.500,50')).toBeCloseTo(1500.5, 5);
    expect(parseNumericInput('2500.75')).toBeCloseTo(2500.75, 5);
    expect(parseNumericInput('-500')).toBe(-500);
    expect(parseNumericInput('texto')).toBeNaN();
  });

  it('valida custos fixos manuais negativos na Etapa 1', () => {
    const errs = validateFinancialProfileValues({
      remuneracaoMensal: 4500,
      custosFixosMensais: -500,
      diasTrabalhadosMes: 20,
      horasProdutivasDia: 6,
      percentualFaturavel: 75,
    });
    expect(errs.custosFixosMensais).toBeDefined();
  });

  it('valida e rejeita backups JSON inválidos ou de outras aplicações', () => {
    expect(parseAndValidateBackup('').ok).toBe(false);
    expect(parseAndValidateBackup('{json quebrado').ok).toBe(false);
    expect(parseAndValidateBackup('[]').ok).toBe(false);
    expect(parseAndValidateBackup(JSON.stringify({ app: 'outro-app', data: {} })).ok).toBe(false);
    expect(parseAndValidateBackup(JSON.stringify({ profile: {} })).ok).toBe(false);
    expect(
      parseAndValidateBackup(
        JSON.stringify({ app: 'preco-justo', data: { services: 'invalido' } })
      ).ok
    ).toBe(false);
  });

  it('sanitiza backup válido, descarta histórico corrompido e impede margem + impostos >= 100%', () => {
    const validCalc = calculatePricing({
      remuneracaoMensal: 4500,
      custosFixosMensais: 900,
      diasTrabalhadosMes: 20,
      horasProdutivasDia: 6,
      percentualFaturavel: 75,
      horasNecessarias: 10,
      custosAdicionais: 100,
      margemLucro: 20,
      impostosTaxas: 10,
    });
    expect(validCalc.ok).toBe(true);
    if (!validCalc.ok) return;

    const payload = {
      app: 'preco-justo',
      schemaVersion: 2,
      exportedAt: '2026-11-24T10:00:00.000Z',
      data: {
        profile: {
          remuneracaoMensal: 5000,
          margemLucroPadrao: 80,
          impostosTaxasPadrao: 30,
        },
        costs: [{ nome: 'Internet', categoria: 'Internet', valor: 120 }],
        services: [
          {
            nome: 'Site',
            categoria: 'Desenvolvimento',
            tempoEstimado: 10,
            custoAdicional: 0,
            precoRecomendado: 2000,
            margemLucro: 70,
            impostosTaxas: 40,
          },
        ],
        history: [
          {
            id: 'h-corrupt',
            serviceName: 'Corrompido',
            inputs: { horasNecessarias: -5 },
            result: {},
          },
          {
            id: 'h-ok',
            serviceName: 'Válido',
            categoria: 'Consultoria',
            descricao: 'OK',
            inputs: {
              remuneracaoMensal: 4500,
              custosFixosMensais: 900,
              diasTrabalhadosMes: 20,
              horasProdutivasDia: 6,
              percentualFaturavel: 75,
              horasNecessarias: 10,
              custosAdicionais: 100,
              margemLucro: 20,
              impostosTaxas: 10,
            },
            result: validCalc.data,
          },
        ],
      },
    };

    const parsed = parseAndValidateBackup(JSON.stringify(payload), 'light');
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect(parsed.state.profile.margemLucroPadrao + parsed.state.profile.impostosTaxasPadrao).toBeLessThan(100);
    expect(parsed.state.services[0].margemLucro + parsed.state.services[0].impostosTaxas).toBeLessThan(100);
    expect(parsed.state.history).toHaveLength(1);
    expect(parsed.state.history[0].id).toBe('h-ok');
    expect(parsed.summary.costsCount).toBe(1);
    expect(parsed.summary.servicesCount).toBe(1);
    expect(parsed.summary.historyCount).toBe(1);

    const sanitizedDirect = sanitizeStatePayload({ profile: { remuneracaoMensal: -200 } as AppState['profile'] });
    expect(sanitizedDirect.profile.remuneracaoMensal).toBe(0);
  });
});
