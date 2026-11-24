import { AppState, SmartRecommendation } from '../types';
import { calculatePricing, calculateProfileSummary, getEffectiveMonthlyCosts } from './pricing';
import { formatCurrencyBRL, formatPercent } from './format';

/**
 * Motor determinístico de recomendações financeiras baseado exclusivamente
 * em regras matemáticas aplicadas aos dados reais cadastrados pelo usuário.
 */
export function generateSmartRecommendations(
  state: AppState,
  totalMonthlyCosts: number
): SmartRecommendation[] {
  const recommendations: SmartRecommendation[] = [];
  const profileSummary = calculateProfileSummary(state.profile, totalMonthlyCosts);
  const custosFixosEfetivos = getEffectiveMonthlyCosts(state.profile, totalMonthlyCosts);

  // 1. Perfil financeiro incompleto
  if (state.profile.remuneracaoMensal <= 0) {
    recommendations.push({
      id: 'rec-missing-remuneration',
      severity: 'warning',
      title: 'Defina sua remuneração mensal desejada',
      description:
        'Sem definir seu pró-labore mensal, o custo real da sua hora fica subestimado e pode levar a preços abaixo do sustentável.',
      actionLabel: 'Configurar na calculadora',
      actionPage: 'calculator',
    });
  }

  // 2. Nenhuma despesa fixa cadastrada
  if (state.costs.length === 0 && state.profile.usarCustosMensaisAutomaticos) {
    recommendations.push({
      id: 'rec-no-costs',
      severity: 'warning',
      title: 'Cadastre seus custos fixos operacionais',
      description:
        'Despesas recorrentes como internet, energia, softwares e contabilidade precisam compor o valor da sua hora para não corroerem sua margem.',
      actionLabel: 'Cadastrar custos mensais',
      actionPage: 'costs',
    });
  }

  // 3. Verificação de serviços cadastrados vs custo atual (detecta prejuízo ou margem comprimida!)
  if (profileSummary && profileSummary.custoHora > 0 && state.services.length > 0) {
    let servicesAtLoss = 0;
    let worstLossService: { nome: string; falta: number } | null = null;
    let servicesBelowRecommended = 0;

    for (const srv of state.services) {
      const calc = calculatePricing({
        remuneracaoMensal: state.profile.remuneracaoMensal,
        custosFixosMensais: custosFixosEfetivos,
        diasTrabalhadosMes: state.profile.diasTrabalhadosMes,
        horasProdutivasDia: state.profile.horasProdutivasDia,
        percentualFaturavel: state.profile.percentualFaturavel,
        horasNecessarias: srv.tempoEstimado,
        custosAdicionais: srv.custoAdicional,
        margemLucro: srv.margemLucro ?? state.profile.margemLucroPadrao,
        impostosTaxas: srv.impostosTaxas ?? state.profile.impostosTaxasPadrao,
      });

      if (!calc.ok) continue;

      if (srv.precoRecomendado < calc.data.precoMinimo - 0.01) {
        servicesAtLoss += 1;
        const falta = calc.data.precoMinimo - srv.precoRecomendado;
        if (!worstLossService || falta > worstLossService.falta) {
          worstLossService = { nome: srv.nome, falta };
        }
      } else if (srv.precoRecomendado < calc.data.precoRecomendado - 0.5) {
        servicesBelowRecommended += 1;
      }
    }

    if (servicesAtLoss > 0 && worstLossService) {
      recommendations.push({
        id: 'rec-services-loss',
        severity: 'critical',
        title:
          servicesAtLoss === 1
            ? `1 serviço está abaixo do custo mínimo`
            : `${servicesAtLoss} serviços estão gerando prejuízo`,
        description: `Com sua estrutura atual (${formatCurrencyBRL(profileSummary.custoHora)}/h), "${worstLossService.nome}" está ${formatCurrencyBRL(worstLossService.falta)} abaixo do preço mínimo sem lucro.`,
        metricLabel: 'Risco de prejuízo',
        actionLabel: 'Revisar serviços',
        actionPage: 'services',
      });
    } else if (servicesBelowRecommended > 0) {
      recommendations.push({
        id: 'rec-services-underpriced',
        severity: 'warning',
        title:
          servicesBelowRecommended === 1
            ? '1 serviço está abaixo do preço recomendado'
            : `${servicesBelowRecommended} serviços estão abaixo do preço recomendado`,
        description:
          'Seus custos ou remuneração mudaram desde o cadastro. Recalcule esses serviços para preservar a margem de lucro desejada.',
        metricLabel: 'Margem comprimida',
        actionLabel: 'Atualizar em Meus serviços',
        actionPage: 'services',
      });
    }
  }

  // 4. Taxa de horas faturáveis fora da faixa recomendada
  if (state.profile.percentualFaturavel > 85) {
    recommendations.push({
      id: 'rec-high-billable',
      severity: 'warning',
      title: 'Percentual faturável muito elevado',
      description: `Você configurou ${formatPercent(state.profile.percentualFaturavel, 0)} de horas faturáveis. Considerar tempo para prospecção, reuniões e administrativo (65% a 80%) torna o valor/hora mais realista.`,
      metricLabel: `${formatPercent(state.profile.percentualFaturavel, 0)} faturável`,
      actionLabel: 'Ajustar perfil',
      actionPage: 'calculator',
    });
  } else if (state.profile.percentualFaturavel > 0 && state.profile.percentualFaturavel < 50) {
    recommendations.push({
      id: 'rec-low-billable',
      severity: 'opportunity',
      title: 'Alta ociosidade reduzindo competitividade',
      description: `Apenas ${formatPercent(state.profile.percentualFaturavel, 0)} da sua jornada é faturável, elevando bastante o custo da hora. Automatizar tarefas administrativas pode liberar capacidade produtiva.`,
      metricLabel: `${formatPercent(state.profile.percentualFaturavel, 0)} faturável`,
      actionLabel: 'Revisar jornada',
      actionPage: 'calculator',
    });
  }

  // 5. Concentração ou peso elevado dos custos fixos
  if (state.costs.length > 0 && state.profile.remuneracaoMensal > 0) {
    const totalEstrutura = state.profile.remuneracaoMensal + totalMonthlyCosts;
    const pesoCustos = (totalMonthlyCosts / totalEstrutura) * 100;

    if (pesoCustos >= 35) {
      const byCategory = new Map<string, number>();
      for (const c of state.costs) {
        byCategory.set(c.categoria, (byCategory.get(c.categoria) ?? 0) + c.valor);
      }
      let topCat = '';
      let topVal = 0;
      for (const [cat, val] of byCategory.entries()) {
        if (val > topVal) {
          topVal = val;
          topCat = cat;
        }
      }
      const shareTop = totalMonthlyCosts > 0 ? (topVal / totalMonthlyCosts) * 100 : 0;
      recommendations.push({
        id: 'rec-heavy-fixed-costs',
        severity: 'warning',
        title: 'Custos fixos representam parcela alta da operação',
        description: `Seus custos fixos correspondem a ${formatPercent(pesoCustos, 1)} da necessidade mensal. A maior categoria é ${topCat} (${formatPercent(shareTop, 0)} das despesas).`,
        metricLabel: formatCurrencyBRL(totalMonthlyCosts),
        actionLabel: 'Analisar custos',
        actionPage: 'costs',
      });
    }
  }

  // 6. Alerta sobre impostos zerados quando há operação ativa
  if (state.profile.impostosTaxasPadrao === 0 && state.profile.remuneracaoMensal > 0) {
    recommendations.push({
      id: 'rec-zero-taxes',
      severity: 'opportunity',
      title: 'Impostos e taxas configurados em 0%',
      description:
        'Caso você emita nota fiscal ou receba por cartão/plataforma, incluir um percentual de impostos e taxas evita perda silenciosa no recebimento.',
      actionLabel: 'Ajustar em Configurações',
      actionPage: 'settings',
    });
  }

  // 7. Análise da meta mensal vs valor recomendado da hora
  if (
    state.goal.metaFaturamentoMensal > 0 &&
    profileSummary &&
    profileSummary.horasFaturaveisMensais > 0
  ) {
    const receitaNecessariaPorHora =
      state.goal.metaFaturamentoMensal / profileSummary.horasFaturaveisMensais;
    const denom = 1 - state.profile.margemLucroPadrao / 100 - state.profile.impostosTaxasPadrao / 100;
    const horaRecomendada = denom > 0 ? profileSummary.custoHora / denom : profileSummary.custoHora;

    if (receitaNecessariaPorHora > horaRecomendada * 1.1) {
      recommendations.push({
        id: 'rec-goal-gap',
        severity: 'opportunity',
        title: 'Meta mensal exige ticket por hora superior ao atual',
        description: `Para faturar ${formatCurrencyBRL(state.goal.metaFaturamentoMensal)} em ${profileSummary.horasFaturaveisMensais.toFixed(0)}h faturáveis, sua receita média precisa chegar a ${formatCurrencyBRL(receitaNecessariaPorHora)}/h (hoje ${formatCurrencyBRL(horaRecomendada)}/h).`,
        metricLabel: `${formatCurrencyBRL(receitaNecessariaPorHora)}/h alvo`,
        actionLabel: 'Abrir planejamento',
        actionPage: 'goals',
      });
    }
  }

  // 8. Margem média do histórico
  if (state.history.length >= 2) {
    const avgMargin =
      state.history.reduce((sum, item) => sum + item.result.margemEfetiva, 0) / state.history.length;
    if (avgMargin < 15) {
      recommendations.push({
        id: 'rec-low-avg-margin',
        severity: 'warning',
        title: 'Margem média dos cálculos está baixa',
        description: `A margem líquida média do seu histórico é de ${formatPercent(avgMargin, 1)}. Elevar a margem para 20%–30% amplia sua folga para negociação e reserva de caixa.`,
        metricLabel: `Média ${formatPercent(avgMargin, 1)}`,
        actionLabel: 'Ver histórico',
        actionPage: 'history',
      });
    }
  }

  // 9. Diagnóstico saudável se estrutura estiver completa e sem alertas críticos/aviso
  if (
    profileSummary &&
    profileSummary.custoHora > 0 &&
    state.costs.length > 0 &&
    recommendations.filter((r) => r.severity === 'critical' || r.severity === 'warning').length === 0
  ) {
    const denom = 1 - state.profile.margemLucroPadrao / 100 - state.profile.impostosTaxasPadrao / 100;
    const horaRecomendada = denom > 0 ? profileSummary.custoHora / denom : profileSummary.custoHora;
    const maxSafeDiscount =
      1 - state.profile.impostosTaxasPadrao / 100 > 0
        ? (state.profile.margemLucroPadrao / (100 - state.profile.impostosTaxasPadrao)) * 100
        : 0;

    recommendations.unshift({
      id: 'rec-healthy-structure',
      severity: 'healthy',
      title: 'Estrutura de precificação equilibrada',
      description: `Sua hora recomendada (${formatCurrencyBRL(horaRecomendada)}/h) cobre seus custos fixos (${formatCurrencyBRL(totalMonthlyCosts)}) e pró-labore, oferecendo margem de segurança de até ${formatPercent(maxSafeDiscount, 1)} para negociações sem prejuízo.`,
      metricLabel: 'Operação saudável',
      actionLabel: 'Planejar metas',
      actionPage: 'goals',
    });
  }

  // Ordenar por prioridade (critical -> warning -> opportunity -> healthy) e limitar a 4 itens mais relevantes
  const priorityOrder: Record<SmartRecommendation['severity'], number> = {
    critical: 0,
    warning: 1,
    opportunity: 2,
    healthy: 3,
  };

  return recommendations
    .sort((a, b) => priorityOrder[a.severity] - priorityOrder[b.severity])
    .slice(0, 4);
}
