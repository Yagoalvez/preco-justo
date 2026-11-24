import React, { useMemo } from 'react';
import {
  Calculator,
  Clock,
  Receipt,
  Briefcase,
  TrendingUp,
  ArrowRight,
  Database,
  History,
  FileText,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { calculateProfileSummary, getEffectiveMonthlyCosts } from '../utils/pricing';
import { formatCurrencyBRL, formatDateBR, formatHours, formatPercent } from '../utils/format';
import { DemoBadge } from '../components/EmptyState';
import { RecommendationsSection } from '../components/RecommendationsSection';

const CHART_COLORS_LIGHT = [
  '#16A34A',
  '#14532D',
  '#111827',
  '#22C55E',
  '#4B5563',
  '#059669',
  '#6B7280',
  '#9CA3AF',
];

const CHART_COLORS_DARK = [
  '#22C55E',
  '#15803D',
  '#64748B',
  '#4ADE80',
  '#94A3B8',
  '#10B981',
  '#475569',
  '#CBD5E1',
];

export const OverviewPage: React.FC = () => {
  const {
    state,
    totalMonthlyCosts,
    hasDemoData,
    loadDemoData,
    setActivePage,
    openQuoteModal,
  } = useApp();

  const profileSummary = useMemo(
    () => calculateProfileSummary(state.profile, totalMonthlyCosts),
    [state.profile, totalMonthlyCosts]
  );

  const effectiveMonthlyCosts = useMemo(
    () => getEffectiveMonthlyCosts(state.profile, totalMonthlyCosts),
    [state.profile, totalMonthlyCosts]
  );

  // Recommended hourly rate based on profile & default margin/taxes (or base hourly cost if margin/tax invalid)
  const recommendedHourlyRate = useMemo(() => {
    if (!profileSummary || profileSummary.custoHora <= 0) return null;
    const margin = state.profile.margemLucroPadrao / 100;
    const tax = state.profile.impostosTaxasPadrao / 100;
    const denom = 1 - margin - tax;
    if (denom > 0) {
      return profileSummary.custoHora / denom;
    }
    return profileSummary.custoHora;
  }, [profileSummary, state.profile.margemLucroPadrao, state.profile.impostosTaxasPadrao]);

  // Faturamento bruto necessário para cobrir pró-labore + custos fixos + impostos + margem padrão
  const targetGrossMonthlyRevenue = useMemo(() => {
    if (!profileSummary || profileSummary.faturamentoMensalAlvo <= 0) return 0;
    const margin = state.profile.margemLucroPadrao / 100;
    const tax = state.profile.impostosTaxasPadrao / 100;
    const denom = 1 - margin - tax;
    return denom > 0 ? profileSummary.faturamentoMensalAlvo / denom : profileSummary.faturamentoMensalAlvo;
  }, [profileSummary, state.profile.margemLucroPadrao, state.profile.impostosTaxasPadrao]);

  const costDistribution = useMemo(() => {
    const grouped = new Map<string, number>();
    for (const item of state.costs) {
      grouped.set(item.categoria, (grouped.get(item.categoria) ?? 0) + item.valor);
    }
    return Array.from(grouped.entries())
      .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value);
  }, [state.costs]);

  const recentCalculations = useMemo(() => state.history.slice(0, 5), [state.history]);

  const chartColors = state.theme === 'dark' ? CHART_COLORS_DARK : CHART_COLORS_LIGHT;

  const hasAnyData =
    state.profile.remuneracaoMensal > 0 ||
    state.costs.length > 0 ||
    state.services.length > 0 ||
    state.history.length > 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#16A34A] dark:text-emerald-400">
            Seu trabalho tem valor. Saiba quanto cobrar.
          </p>
          <h1 className="mt-0.5 font-display text-2xl font-extrabold tracking-tight text-[#111827] dark:text-white sm:text-3xl">
            Visão geral
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
            Acompanhe sua estrutura de custos, o valor da sua hora e as últimas precificações.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {!hasDemoData && !hasAnyData && (
            <button
              type="button"
              onClick={loadDemoData}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-700 dark:bg-[#1A2333] dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Database className="h-4 w-4 text-gray-500 dark:text-slate-400" />
              Carregar demonstração
            </button>
          )}
          <button
            type="button"
            onClick={() => setActivePage('calculator')}
            className="inline-flex min-h-[42px] shrink-0 items-center gap-2 whitespace-nowrap rounded-xl bg-[#16A34A] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#15803D]"
          >
            <Calculator className="h-4 w-4" />
            Calcular novo serviço
          </button>
        </div>
      </div>

      {/* Onboarding banner when workspace is empty */}
      {!hasAnyData && (
        <div className="rounded-2xl border border-[#16A34A]/25 bg-white p-5 dark:border-emerald-800/60 dark:bg-[#111827]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#111827] dark:text-white">
                Comece a precificar com segurança
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-gray-600 dark:text-slate-400">
                Cadastre seus custos mensais e configure seu perfil financeiro na calculadora, ou
                carregue os dados demonstrativos para explorar o painel com exemplos reais.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={loadDemoData}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-[#F3F4F6] px-4 py-2 text-sm font-semibold text-[#111827] transition-colors hover:bg-gray-200/70 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
              >
                <Database className="h-4 w-4 text-[#16A34A]" />
                Carregar dados demonstrativos
              </button>
              <button
                type="button"
                onClick={() => setActivePage('costs')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cadastrar custos
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPI Grid */}
      <section aria-label="Indicadores principais" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {/* Card 1 (Primary Hero KPI): Valor recomendado da hora */}
        <div className="col-span-2 flex flex-col justify-between rounded-2xl border-2 border-[#16A34A]/50 bg-[#F0FDF4]/45 p-4 sm:col-span-1 sm:p-5 dark:border-emerald-600/60 dark:bg-emerald-950/30">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-[#14532D] dark:text-emerald-300">
              Valor recomendado / hora
            </span>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#16A34A] text-white dark:bg-emerald-600">
              <Clock className="h-[18px] w-[18px]" />
            </div>
          </div>
          <p className="mt-2.5 font-display text-3xl font-extrabold tracking-tight text-[#14532D] tabular-nums dark:text-emerald-300">
            {recommendedHourlyRate !== null ? formatCurrencyBRL(recommendedHourlyRate) : '—'}
          </p>
          <p className="mt-1.5 text-xs text-gray-700 dark:text-emerald-100/80">
            {profileSummary && profileSummary.custoHora > 0 ? (
              <>
                Custo base:{' '}
                <strong className="font-semibold text-[#111827] tabular-nums dark:text-white">
                  {formatCurrencyBRL(profileSummary.custoHora)}/h
                </strong>{' '}
                · {formatHours(profileSummary.horasFaturaveisMensais)}/mês
              </>
            ) : (
              'Configure seu perfil financeiro na calculadora'
            )}
          </p>
        </div>

        {/* Card 2: Custos operacionais mensais */}
        <div className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 dark:border-slate-700/80 dark:bg-[#111827]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-slate-300">
              Custos mensais
            </span>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#F3F4F6] text-gray-700 dark:bg-[#1A2333] dark:text-slate-300 sm:h-9 sm:w-9">
              <Receipt className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
            </div>
          </div>
          <p className="mt-2.5 font-display text-xl font-extrabold tracking-tight text-[#111827] tabular-nums dark:text-white sm:text-2xl">
            {formatCurrencyBRL(effectiveMonthlyCosts)}
          </p>
          <p className="mt-1.5 text-xs text-gray-600 dark:text-slate-400">
            {!state.profile.usarCustosMensaisAutomaticos
              ? 'Valor manual ativo na calculadora'
              : state.costs.length === 0
              ? 'Nenhuma despesa cadastrada'
              : `${state.costs.length} ${state.costs.length === 1 ? 'despesa ativa' : 'despesas ativas'} no mês`}
          </p>
        </div>

        {/* Card 3: Serviços cadastrados */}
        <div className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 dark:border-slate-700/80 dark:bg-[#111827]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-slate-300">
              Serviços cadastrados
            </span>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#F3F4F6] text-gray-700 dark:bg-[#1A2333] dark:text-slate-300 sm:h-9 sm:w-9">
              <Briefcase className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
            </div>
          </div>
          <p className="mt-2.5 font-display text-xl font-extrabold tracking-tight text-[#111827] tabular-nums dark:text-white sm:text-2xl">
            {state.services.length}
          </p>
          <p className="mt-1.5 text-xs text-gray-600 dark:text-slate-400">
            {state.services.length === 0
              ? 'Cadastre serviços para agilizar orçamentos'
              : `${state.history.length} ${state.history.length === 1 ? 'cálculo salvo' : 'cálculos salvos'} no histórico`}
          </p>
        </div>

        {/* Card 4: Faturamento mensal alvo (bruto) */}
        <div className="col-span-2 flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-4 sm:col-span-1 sm:p-5 dark:border-slate-700/80 dark:bg-[#111827]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-slate-300">
              Faturamento mensal alvo
            </span>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#F3F4F6] text-gray-700 dark:bg-[#1A2333] dark:text-slate-300 sm:h-9 sm:w-9">
              <TrendingUp className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
            </div>
          </div>
          <p className="mt-2.5 font-display text-2xl font-extrabold tracking-tight text-[#111827] tabular-nums dark:text-white">
            {targetGrossMonthlyRevenue > 0
              ? formatCurrencyBRL(targetGrossMonthlyRevenue)
              : 'R$ 0,00'}
          </p>
          <p className="mt-1.5 text-xs text-gray-600 dark:text-slate-400">
            {profileSummary && profileSummary.faturamentoMensalAlvo > 0
              ? `Cobertura base ${formatCurrencyBRL(profileSummary.faturamentoMensalAlvo)} (pró-labore + custos) + margem e impostos`
              : 'Defina sua remuneração desejada'}
          </p>
        </div>
      </section>

      {/* Recomendações inteligentes */}
      <RecommendationsSection />

      {/* Main grid: Cost chart + Recent calculations */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Cost distribution chart */}
        <section className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 dark:border-slate-700/80 dark:bg-[#111827] lg:col-span-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-[#111827] dark:text-white">
                Distribuição dos custos
              </h2>
              <p className="mt-0.5 text-xs text-gray-600 dark:text-slate-400">
                Participação de cada categoria nas despesas mensais
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActivePage('costs')}
              className="text-xs font-semibold text-[#16A34A] hover:text-[#14532D] dark:text-emerald-400"
            >
              Gerenciar
            </button>
          </div>

          {costDistribution.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F3F4F6] text-gray-500 dark:bg-[#1A2333] dark:text-slate-300">
                <Receipt className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm font-semibold text-[#111827] dark:text-white">
                Sem despesas registradas
              </p>
              <p className="mt-1 max-w-xs text-xs text-gray-600 dark:text-slate-400">
                Adicione internet, energia, softwares ou aluguel para visualizar o peso de cada
                custo na sua operação.
              </p>
              <button
                type="button"
                onClick={() => setActivePage('costs')}
                className="mt-4 rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-semibold text-[#111827] transition-colors hover:bg-gray-50 dark:border-slate-700 dark:bg-[#1A2333] dark:text-white dark:hover:bg-slate-800"
              >
                Adicionar custos mensais
              </button>
            </div>
          ) : (
            <div className="mt-3 flex flex-1 flex-col justify-between gap-3">
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%" minHeight={208}>
                  <PieChart>
                    <Pie
                      data={costDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={54}
                      outerRadius={82}
                      paddingAngle={2}
                      stroke="none"
                      isAnimationActive={false}
                    >
                      {costDistribution.map((entry, idx) => (
                        <Cell
                          key={entry.name}
                          fill={chartColors[idx % chartColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      separator=": "
                      formatter={(val: number) => [formatCurrencyBRL(val), 'Valor mensal']}
                      contentStyle={{
                        borderRadius: '10px',
                        border: state.theme === 'dark' ? '1px solid #334155' : '1px solid #E5E7EB',
                        fontSize: '12px',
                        backgroundColor: state.theme === 'dark' ? '#1A2333' : '#FFFFFF',
                        color: state.theme === 'dark' ? '#F9FAFB' : '#111827',
                      }}
                      itemStyle={{
                        color: state.theme === 'dark' ? '#F9FAFB' : '#111827',
                      }}
                      labelStyle={{
                        color: state.theme === 'dark' ? '#CBD5E1' : '#4B5563',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <ul className="space-y-2 border-t border-gray-100 pt-3.5 dark:border-slate-800">
                {costDistribution.map((item, idx) => {
                  const pct = totalMonthlyCosts > 0 ? (item.value / totalMonthlyCosts) * 100 : 0;
                  return (
                    <li
                      key={item.name}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="flex items-center gap-2 text-gray-700 dark:text-slate-200">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: chartColors[idx % chartColors.length] }}
                        />
                        <span className="truncate">{item.name}</span>
                      </span>
                      <span className="flex items-center gap-2 font-medium text-[#111827] tabular-nums dark:text-white">
                        <span>{formatCurrencyBRL(item.value)}</span>
                        <span className="w-11 text-right text-gray-500 dark:text-slate-400">
                          {formatPercent(pct, 0)}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>

        {/* Recent calculations */}
        <section className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 dark:border-slate-700/80 dark:bg-[#111827] lg:col-span-7">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-[#111827] dark:text-white">
                Últimas precificações realizadas
              </h2>
              <p className="mt-0.5 text-xs text-gray-600 dark:text-slate-400">
                Histórico recente de serviços calculados e prontos para orçamento
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActivePage('history')}
              className="shrink-0 whitespace-nowrap text-xs font-semibold text-[#16A34A] hover:text-[#14532D] dark:text-emerald-400"
            >
              Ver histórico completo
            </button>
          </div>

          {recentCalculations.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F3F4F6] text-gray-500 dark:bg-[#1A2333] dark:text-slate-300">
                <History className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm font-semibold text-[#111827] dark:text-white">
                Nenhuma precificação registrada ainda
              </p>
              <p className="mt-1 max-w-sm text-xs text-gray-600 dark:text-slate-400">
                Use a calculadora para descobrir o preço mínimo e o preço recomendado do seu
                próximo serviço.
              </p>
              <button
                type="button"
                onClick={() => setActivePage('calculator')}
                className="mt-4 inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-[#16A34A] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#15803D]"
              >
                <Calculator className="h-3.5 w-3.5" />
                Fazer primeira precificação
              </button>
            </div>
          ) : (
            <div className="mt-3.5 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200/80 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:border-slate-700/80 dark:text-slate-400">
                    <th className="whitespace-nowrap pb-2.5 pr-2">Serviço</th>
                    <th className="hidden whitespace-nowrap px-2 pb-2.5 sm:table-cell">Data</th>
                    <th className="whitespace-nowrap px-2 pb-2.5 text-right">Preço</th>
                    <th className="whitespace-nowrap pb-2.5 pl-2 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm dark:divide-slate-800">
                  {recentCalculations.map((item) => (
                    <tr
                      key={item.id}
                      className="transition-colors hover:bg-gray-50/80 dark:hover:bg-slate-800/50"
                    >
                      <td className="py-3 pr-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-semibold text-[#111827] dark:text-white">
                            {item.serviceName}
                          </span>
                          {item.isDemo && <DemoBadge />}
                        </div>
                        <span className="text-xs text-gray-600 tabular-nums dark:text-slate-400">
                          {item.categoria} · Custo {formatCurrencyBRL(item.result.custoServico)} · Margem{' '}
                          {formatPercent(item.result.margemEfetiva, 1)}
                        </span>
                      </td>
                      <td className="hidden whitespace-nowrap px-2 py-3 text-xs text-gray-600 tabular-nums dark:text-slate-400 sm:table-cell">
                        {formatDateBR(item.data)}
                      </td>
                      <td className="whitespace-nowrap px-2 py-3 text-right text-sm font-bold text-[#14532D] tabular-nums dark:text-emerald-400">
                        {formatCurrencyBRL(item.result.precoRecomendado)}
                      </td>
                      <td className="whitespace-nowrap py-3 pl-2 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            openQuoteModal({
                              nomeServico: item.serviceName,
                              descricao: item.descricao,
                              valorFinal: item.result.precoRecomendado,
                            })
                          }
                          title="Gerar orçamento em PDF"
                          aria-label={`Gerar orçamento em PDF de ${item.serviceName}`}
                          className="inline-flex min-h-[34px] items-center gap-1.5 whitespace-nowrap rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:border-[#16A34A]/50 hover:bg-[#F0FDF4] hover:text-[#14532D] dark:border-slate-700 dark:bg-[#1A2333] dark:text-slate-200 dark:hover:border-emerald-600 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-300"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Orçamento
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
