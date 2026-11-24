import React, { useEffect, useMemo, useState } from 'react';
import {
  Target,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Plus,
  Minus,
  RotateCcw,
  Calculator,
  Briefcase,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { calculateProfileSummary } from '../utils/pricing';
import { calculateServiceGoalProjection, calculateServiceMixSummary } from '../utils/planning';
import { formatCurrencyBRL, formatHours, formatPercent } from '../utils/format';
import { DemoBadge } from '../components/EmptyState';

export const GoalsPage: React.FC = () => {
  const { state, totalMonthlyCosts, updateGoal, setActivePage, notify } = useApp();

  const [metaStr, setMetaStr] = useState<string>(
    state.goal.metaFaturamentoMensal > 0 ? String(state.goal.metaFaturamentoMensal) : ''
  );

  // Simulador rápido para serviço avulso (quando usuário quer testar um ticket livre)
  const [customPriceStr, setCustomPriceStr] = useState<string>('');
  const [customHoursStr, setCustomHoursStr] = useState<string>('');

  useEffect(() => {
    setMetaStr(state.goal.metaFaturamentoMensal > 0 ? String(state.goal.metaFaturamentoMensal) : '');
  }, [state.goal.metaFaturamentoMensal]);

  const profileSummary = useMemo(
    () => calculateProfileSummary(state.profile, totalMonthlyCosts),
    [state.profile, totalMonthlyCosts]
  );

  const horasFaturaveis = profileSummary?.horasFaturaveisMensais ?? null;

  const metaValor = useMemo(() => {
    const n = Number(metaStr.replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [metaStr]);

  const receitaHoraNecessaria = useMemo(() => {
    if (metaValor <= 0 || !horasFaturaveis || horasFaturaveis <= 0) return null;
    return metaValor / horasFaturaveis;
  }, [metaValor, horasFaturaveis]);

  const handleMetaChange = (val: string) => {
    setMetaStr(val);
    const parsed = Number(val.replace(',', '.'));
    if (val.trim() === '') {
      updateGoal({ metaFaturamentoMensal: 0 });
    } else if (Number.isFinite(parsed) && parsed >= 0) {
      updateGoal({ metaFaturamentoMensal: Number(parsed.toFixed(2)) });
    }
  };

  const handleApplyRecommendedRevenue = () => {
    if (!profileSummary || profileSummary.faturamentoMensalAlvo <= 0) {
      notify({
        type: 'info',
        title: 'Configure seu perfil financeiro primeiro',
        description: 'Defina sua remuneração desejada na calculadora para sugerirmos uma meta.',
      });
      return;
    }
    const denom = 1 - state.profile.margemLucroPadrao / 100 - state.profile.impostosTaxasPadrao / 100;
    const suggested =
      denom > 0 ? profileSummary.faturamentoMensalAlvo / denom : profileSummary.faturamentoMensalAlvo;
    const rounded = Math.ceil(suggested / 100) * 100;
    setMetaStr(String(rounded));
    updateGoal({ metaFaturamentoMensal: rounded });
    notify({
      type: 'success',
      title: 'Meta sugerida aplicada',
      description: `Meta ajustada para ${formatCurrencyBRL(rounded)} cobrindo custos, pró-labore, impostos e margem.`,
    });
  };

  // Projeção individual para cada serviço cadastrado
  const serviceProjections = useMemo(() => {
    if (metaValor <= 0) return [];
    return state.services
      .map((srv) => {
        const proj = calculateServiceGoalProjection({
          metaFaturamentoMensal: metaValor,
          precoUnitario: srv.precoRecomendado,
          horasPorServico: srv.tempoEstimado,
          horasFaturaveisMensais: horasFaturaveis,
        });
        return proj.ok ? { service: srv, projection: proj.data } : null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [state.services, metaValor, horasFaturaveis]);

  // Projeção para ticket personalizado
  const customProjection = useMemo(() => {
    const price = Number(customPriceStr.replace(',', '.'));
    const hours = Number(customHoursStr.replace(',', '.'));
    if (metaValor <= 0 || !Number.isFinite(price) || price <= 0 || !Number.isFinite(hours) || hours <= 0) {
      return null;
    }
    const proj = calculateServiceGoalProjection({
      metaFaturamentoMensal: metaValor,
      precoUnitario: price,
      horasPorServico: hours,
      horasFaturaveisMensais: horasFaturaveis,
    });
    return proj.ok ? proj.data : null;
  }, [metaValor, customPriceStr, customHoursStr, horasFaturaveis]);

  // Mix de serviços combinados
  const mixSummary = useMemo(() => {
    return calculateServiceMixSummary({
      metaFaturamentoMensal: metaValor,
      horasFaturaveisMensais: horasFaturaveis,
      items: state.services.map((s) => ({
        id: s.id,
        nome: s.nome,
        precoRecomendado: s.precoRecomendado,
        tempoEstimado: s.tempoEstimado,
        quantidade: state.goal.mixQuantidades[s.id] ?? 0,
      })),
    });
  }, [metaValor, horasFaturaveis, state.services, state.goal.mixQuantidades]);

  const handleAdjustMix = (serviceId: string, delta: number) => {
    const current = state.goal.mixQuantidades[serviceId] ?? 0;
    const next = Math.max(0, Math.min(999, current + delta));
    const updated = { ...state.goal.mixQuantidades };
    if (next === 0) {
      delete updated[serviceId];
    } else {
      updated[serviceId] = next;
    }
    updateGoal({ mixQuantidades: updated });
  };

  const renderStatusPill = (status: 'viable' | 'tight' | 'overloaded' | 'unknown') => {
    if (status === 'viable') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-[#F0FDF4] px-2 py-0.5 text-[11px] font-semibold text-[#14532D] dark:bg-emerald-950/70 dark:text-emerald-300">
          <CheckCircle2 className="h-3 w-3 text-[#16A34A]" />
          Viável
        </span>
      );
    }
    if (status === 'tight') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
          <AlertTriangle className="h-3 w-3 text-amber-600" />
          No limite
        </span>
      );
    }
    if (status === 'overloaded') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 dark:bg-red-950/50 dark:text-red-300">
          <ShieldAlert className="h-3 w-3 text-red-600" />
          Excede capacidade
        </span>
      );
    }
    return (
      <span className="inline-flex rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500 dark:bg-slate-800 dark:text-slate-400">
        Defina horas
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-[#111827] dark:text-white sm:text-3xl">
            Planejamento de metas
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
            Defina sua meta de faturamento mensal e descubra quantos serviços cabem na sua
            capacidade real de horas faturáveis.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setActivePage('calculator')}
          className="inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#111827] transition-colors hover:bg-gray-50 dark:border-slate-700 dark:bg-[#111827] dark:text-white dark:hover:bg-slate-800"
        >
          <Calculator className="h-4 w-4 text-[#16A34A]" />
          Ajustar perfil financeiro
        </button>
      </div>

      {/* Top Grid: Goal Input + Capacity Metrics */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="rounded-2xl border border-[#16A34A]/30 bg-white p-6 dark:border-emerald-800/70 dark:bg-[#111827] lg:col-span-5">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="goal-monthly-revenue"
              className="text-xs font-bold uppercase tracking-wider text-[#14532D] dark:text-emerald-400"
            >
              Meta de faturamento mensal
            </label>
            <button
              type="button"
              onClick={handleApplyRecommendedRevenue}
              className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[11px] font-semibold text-[#16A34A] hover:underline dark:text-emerald-400"
            >
              <Sparkles className="h-3 w-3" />
              Sugerir pelo perfil
            </button>
          </div>

          <div className="relative mt-3">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base font-semibold text-gray-400">
              R$
            </span>
            <input
              id="goal-monthly-revenue"
              type="number"
              min="0"
              step="100"
              placeholder="10000"
              value={metaStr}
              onChange={(e) => handleMetaChange(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-12 pr-4 font-display text-2xl font-extrabold text-[#111827] outline-none tabular-nums focus:border-[#16A34A] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">
            Faturamento bruto mensal desejado antes de custos, impostos e pró-labore.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-7">
          <div className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-slate-800 dark:bg-[#111827]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                Capacidade faturável mensal
              </span>
              <Clock className="h-4 w-4 text-[#16A34A]" />
            </div>
            <p className="mt-3 font-display text-2xl font-extrabold text-[#111827] tabular-nums dark:text-white">
              {horasFaturaveis !== null ? formatHours(horasFaturaveis) : '—'}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
              {state.profile.diasTrabalhadosMes} dias × {state.profile.horasProdutivasDia}h/dia ×{' '}
              {formatPercent(state.profile.percentualFaturavel, 0)} faturável
            </p>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-slate-800 dark:bg-[#111827]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                Receita necessária / hora
              </span>
              <Target className="h-4 w-4 text-[#16A34A]" />
            </div>
            <p className="mt-3 font-display text-2xl font-extrabold text-[#14532D] tabular-nums dark:text-emerald-400">
              {receitaHoraNecessaria !== null ? `${formatCurrencyBRL(receitaHoraNecessaria)}/h` : '—'}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
              {profileSummary && profileSummary.custoHora > 0
                ? `Custo base atual: ${formatCurrencyBRL(profileSummary.custoHora)}/h`
                : 'Informe uma meta para ver o ticket/hora necessário'}
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: Cenários por serviço cadastrado */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-slate-800 dark:bg-[#111827]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-[#111827] dark:text-white">
              Quantos serviços vender para atingir a meta
            </h2>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
              Análise individual de volume e ocupação da sua agenda para cada serviço cadastrado
            </p>
          </div>
          {state.services.length === 0 && (
            <button
              type="button"
              onClick={() => setActivePage('services')}
              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Briefcase className="h-3.5 w-3.5" />
              Cadastrar serviços
            </button>
          )}
        </div>

        {metaValor <= 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-gray-200 p-6 text-center text-xs text-gray-500 dark:border-slate-700 dark:text-slate-400">
            Digite uma meta de faturamento mensal acima (ou clique em &ldquo;Sugerir pelo perfil&rdquo;)
            para calcular o volume de vendas e a viabilidade de horas.
          </div>
        ) : serviceProjections.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-gray-200 p-6 text-center text-xs text-gray-500 dark:border-slate-700 dark:text-slate-400">
            Você ainda não cadastrou serviços em <strong>Meus serviços</strong>. Utilize o simulador
            rápido abaixo ou cadastre seus serviços para comparar cenários automaticamente.
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[680px] text-left">
              <thead>
                <tr className="border-b border-gray-100 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:border-slate-800 dark:text-slate-500">
                  <th className="whitespace-nowrap pb-3 pr-3">Serviço</th>
                  <th className="whitespace-nowrap px-3 pb-3 text-right">Preço / Tempo</th>
                  <th className="whitespace-nowrap px-3 pb-3 text-right">Vendas necessárias</th>
                  <th className="whitespace-nowrap px-3 pb-3 text-right">Horas exigidas</th>
                  <th className="whitespace-nowrap px-3 pb-3 text-right">Capacidade</th>
                  <th className="whitespace-nowrap pb-3 pl-3 text-right">Viabilidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm dark:divide-slate-800">
                {serviceProjections.map(({ service, projection }) => (
                  <tr
                    key={service.id}
                    className="transition-colors hover:bg-gray-50/70 dark:hover:bg-slate-800/40"
                  >
                    <td className="py-3.5 pr-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-semibold text-[#111827] dark:text-white">
                          {service.nome}
                        </span>
                        {service.isDemo && <DemoBadge />}
                      </div>
                      <p className="text-xs text-gray-500 tabular-nums dark:text-slate-400">
                        Receita/hora: {formatCurrencyBRL(projection.receitaPorHoraServico)}/h
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3.5 text-right text-xs tabular-nums">
                      <span className="block font-semibold text-[#111827] dark:text-white">
                        {formatCurrencyBRL(service.precoRecomendado)}
                      </span>
                      <span className="text-gray-500 dark:text-slate-400">
                        {formatHours(service.tempoEstimado)} / unid.
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3.5 text-right tabular-nums">
                      <span className="font-display text-base font-extrabold text-[#14532D] dark:text-emerald-400">
                        {projection.unidadesNecessarias}
                      </span>
                      <span className="block text-[11px] text-gray-400">
                        ({projection.unidadesExatas.toFixed(1).replace('.', ',')} exatos)
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3.5 text-right text-xs font-semibold text-[#111827] tabular-nums dark:text-white">
                      {formatHours(projection.horasNecessarias)}
                      {projection.horasExcedentes > 0 && (
                        <span className="block text-[11px] font-medium text-red-600 dark:text-red-400">
                          +{formatHours(projection.horasExcedentes)} acima
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3.5 text-right text-xs font-semibold tabular-nums">
                      {projection.ocupacaoCapacidadePercent !== null ? (
                        <div>
                          <span
                            className={
                              projection.status === 'overloaded'
                                ? 'text-red-600 dark:text-red-400'
                                : projection.status === 'tight'
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-[#111827] dark:text-white'
                            }
                          >
                            {formatPercent(projection.ocupacaoCapacidadePercent, 0)}
                          </span>
                          {projection.faturamentoMaximoCapacidade !== null && (
                            <span className="block text-[11px] font-normal text-gray-400">
                              Teto: {formatCurrencyBRL(projection.faturamentoMaximoCapacidade)}
                            </span>
                          )}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="whitespace-nowrap py-3.5 pl-3 text-right">
                      {renderStatusPill(projection.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Section 2: Mix de Serviços + Simulador rápido avulso */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Mix Builder */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-slate-800 dark:bg-[#111827] lg:col-span-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#111827] dark:text-white">
                Montar mix mensal de serviços
              </h2>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                Combine diferentes serviços para simular um mês realista de entregas
              </p>
            </div>
            {mixSummary.totalUnidades > 0 && (
              <button
                type="button"
                onClick={() => updateGoal({ mixQuantidades: {} })}
                className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-xs font-semibold text-gray-500 hover:text-[#111827] dark:text-slate-400 dark:hover:text-white"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Zerar mix
              </button>
            )}
          </div>

          {state.services.length === 0 ? (
            <p className="mt-5 text-xs text-gray-500 dark:text-slate-400">
              Cadastre ao menos um serviço para montar seu mix mensal combinado.
            </p>
          ) : (
            <>
              <ul className="mt-4 divide-y divide-gray-100 dark:divide-slate-800">
                {state.services.map((srv) => {
                  const qty = state.goal.mixQuantidades[srv.id] ?? 0;
                  return (
                    <li
                      key={srv.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#111827] dark:text-white">
                          {srv.nome}
                        </p>
                        <p className="text-xs text-gray-500 tabular-nums dark:text-slate-400">
                          {formatCurrencyBRL(srv.precoRecomendado)} · {formatHours(srv.tempoEstimado)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAdjustMix(srv.id, -1)}
                          disabled={qty === 0}
                          aria-label={`Diminuir quantidade de ${srv.nome}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-bold text-[#111827] tabular-nums dark:text-white">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAdjustMix(srv.id, 1)}
                          aria-label={`Aumentar quantidade de ${srv.nome}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:border-[#16A34A] hover:bg-[#F0FDF4] hover:text-[#14532D] dark:border-slate-700 dark:text-slate-300 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-300"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* Mix summary bar */}
              <div className="mt-5 space-y-3 rounded-xl border border-gray-200 bg-gray-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-gray-600 dark:text-slate-300">
                    Faturamento do mix ({mixSummary.totalUnidades}{' '}
                    {mixSummary.totalUnidades === 1 ? 'serviço' : 'serviços'})
                  </span>
                  <span className="font-display text-base font-extrabold text-[#14532D] tabular-nums dark:text-emerald-400">
                    {formatCurrencyBRL(mixSummary.faturamentoProjetado)}
                    {metaValor > 0 && (
                      <span className="ml-1.5 text-xs font-semibold text-gray-500 dark:text-slate-400">
                        ({formatPercent(mixSummary.percentualMetaAtingida, 0)} da meta)
                      </span>
                    )}
                  </span>
                </div>

                {metaValor > 0 && (
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-[#16A34A] transition-all"
                      style={{
                        width: `${Math.min(100, Math.max(0, mixSummary.percentualMetaAtingida))}%`,
                      }}
                    />
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200/80 pt-3 text-xs dark:border-slate-800">
                  <span className="text-gray-600 dark:text-slate-300">
                    Horas alocadas:{' '}
                    <strong className="tabular-nums text-[#111827] dark:text-white">
                      {formatHours(mixSummary.horasAlocadas)}
                    </strong>
                    {horasFaturaveis !== null && (
                      <span className="text-gray-500 dark:text-slate-400">
                        {' '}
                        de {formatHours(horasFaturaveis)} (
                        {formatPercent(mixSummary.ocupacaoCapacidadePercent ?? 0, 0)})
                      </span>
                    )}
                  </span>
                  {renderStatusPill(mixSummary.statusCapacidade)}
                </div>
              </div>
            </>
          )}
        </section>

        {/* Simulador rápido de ticket avulso */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-slate-800 dark:bg-[#111827] lg:col-span-5">
          <h2 className="text-base font-bold text-[#111827] dark:text-white">
            Simulador rápido de ticket
          </h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
            Teste um serviço avulso ou novo pacote sem precisar cadastrá-lo antes
          </p>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <div>
              <label
                htmlFor="goal-custom-price"
                className="block text-xs font-semibold text-gray-700 dark:text-slate-300"
              >
                Preço do serviço (R$)
              </label>
              <input
                id="goal-custom-price"
                type="number"
                min="1"
                step="50"
                placeholder="1500"
                value={customPriceStr}
                onChange={(e) => setCustomPriceStr(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-[#111827] outline-none tabular-nums focus:border-[#16A34A] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="goal-custom-hours"
                className="block text-xs font-semibold text-gray-700 dark:text-slate-300"
              >
                Horas por serviço
              </label>
              <input
                id="goal-custom-hours"
                type="number"
                min="0.5"
                step="0.5"
                placeholder="12"
                value={customHoursStr}
                onChange={(e) => setCustomHoursStr(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-[#111827] outline-none tabular-nums focus:border-[#16A34A] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </div>

          {customProjection ? (
            <div className="mt-5 space-y-3 rounded-xl border border-gray-200 bg-gray-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/60">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-slate-400">
                  Vendas necessárias/mês
                </span>
                <span className="font-display text-xl font-extrabold text-[#14532D] tabular-nums dark:text-emerald-400">
                  {customProjection.unidadesNecessarias}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-slate-400">Horas exigidas</span>
                <span className="font-semibold text-[#111827] tabular-nums dark:text-white">
                  {formatHours(customProjection.horasNecessarias)}
                </span>
              </div>
              {customProjection.ocupacaoCapacidadePercent !== null && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-slate-400">Uso da capacidade</span>
                  <span className="font-semibold text-[#111827] tabular-nums dark:text-white">
                    {formatPercent(customProjection.ocupacaoCapacidadePercent, 0)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-gray-200 pt-3 text-xs dark:border-slate-800">
                <span className="text-gray-500 dark:text-slate-400">Diagnóstico</span>
                {renderStatusPill(customProjection.status)}
              </div>
            </div>
          ) : (
            <p className="mt-5 rounded-xl border border-dashed border-gray-200 p-4 text-xs leading-relaxed text-gray-500 dark:border-slate-700 dark:text-slate-400">
              Informe uma meta mensal, o preço unitário e as horas estimadas para testar
              instantaneamente quantas vendas são necessárias.
            </p>
          )}
        </section>
      </div>
    </div>
  );
};
