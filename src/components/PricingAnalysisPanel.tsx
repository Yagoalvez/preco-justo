import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  FileDown,
  Percent,
  ShieldAlert,
  TrendingDown,
} from 'lucide-react';
import { PricingCalculationResult } from '../types';
import { diagnoseCurrentPrice, simulateNegotiationDiscount } from '../utils/pricing';
import { formatCurrencyBRL, formatPercent } from '../utils/format';

interface PricingAnalysisPanelProps {
  serviceName: string;
  descricao: string;
  impostosTaxas: number;
  result: PricingCalculationResult;
  onGenerateQuoteWithPrice: (finalPrice: number, discountNote?: string) => void;
}

export const PricingAnalysisPanel: React.FC<PricingAnalysisPanelProps> = ({
  impostosTaxas,
  result,
  onGenerateQuoteWithPrice,
}) => {
  const [currentPriceStr, setCurrentPriceStr] = useState<string>('');
  const [discountStr, setDiscountStr] = useState<string>('0');

  const parsedCurrentPrice = currentPriceStr.trim() === '' ? NaN : Number(currentPriceStr.replace(',', '.'));
  const parsedDiscount = discountStr.trim() === '' ? 0 : Number(discountStr.replace(',', '.'));

  const diagnosis = useMemo(() => {
    if (!Number.isFinite(parsedCurrentPrice) || parsedCurrentPrice <= 0) return null;
    const outcome = diagnoseCurrentPrice({
      precoAtual: parsedCurrentPrice,
      custoServico: result.custoServico,
      precoMinimo: result.precoMinimo,
      precoRecomendado: result.precoRecomendado,
      impostosTaxasPercent: impostosTaxas,
    });
    return outcome.ok ? outcome.data : null;
  }, [parsedCurrentPrice, result.custoServico, result.precoMinimo, result.precoRecomendado, impostosTaxas]);

  const simulation = useMemo(() => {
    return simulateNegotiationDiscount({
      descontoPercentual: parsedDiscount,
      custoServico: result.custoServico,
      precoMinimo: result.precoMinimo,
      precoRecomendado: result.precoRecomendado,
      impostosTaxasPercent: impostosTaxas,
    });
  }, [parsedDiscount, result.custoServico, result.precoMinimo, result.precoRecomendado, impostosTaxas]);

  const maxSafeDiscountPercent = useMemo(() => {
    if (result.precoRecomendado <= 0) return 0;
    return Math.max(0, ((result.precoRecomendado - result.precoMinimo) / result.precoRecomendado) * 100);
  }, [result.precoRecomendado, result.precoMinimo]);

  const diagnosisBadge = () => {
    if (!diagnosis) return null;
    switch (diagnosis.status) {
      case 'loss':
        return (
          <div className="rounded-xl border border-red-200 bg-red-50/90 p-3.5 dark:border-red-900/70 dark:bg-red-950/40">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
              <div className="text-xs">
                <p className="font-bold text-red-800 dark:text-red-300">
                  Prejuízo operacional confirmado
                </p>
                <p className="mt-0.5 leading-relaxed text-red-700 dark:text-red-300/90">
                  Neste preço você paga para trabalhar: o valor não cobre seus custos e impostos,
                  gerando prejuízo real de{' '}
                  <strong className="tabular-nums">
                    {formatCurrencyBRL(Math.abs(diagnosis.lucroLiquidoAtual))}
                  </strong>{' '}
                  por serviço. Faltam{' '}
                  <strong className="tabular-nums">{formatCurrencyBRL(diagnosis.faltaParaEmpate)}</strong>{' '}
                  apenas para empatar (sem lucro).
                </p>
              </div>
            </div>
          </div>
        );
      case 'breakeven':
        return (
          <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-3.5 dark:border-amber-900/60 dark:bg-amber-950/30">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="text-xs">
                <p className="font-bold text-amber-900 dark:text-amber-300">
                  Ponto de empate (lucro zero)
                </p>
                <p className="mt-0.5 leading-relaxed text-amber-800 dark:text-amber-300/90">
                  Seu preço cobre apenas custos operacionais e impostos, sem gerar reserva ou lucro
                  líquido. Reajuste em{' '}
                  <strong className="tabular-nums">
                    {formatCurrencyBRL(diagnosis.faltaParaRecomendado)}
                  </strong>{' '}
                  para atingir o preço recomendado.
                </p>
              </div>
            </div>
          </div>
        );
      case 'below_recommended':
        return (
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 dark:border-amber-900/60 dark:bg-amber-950/30">
            <div className="flex items-start gap-2.5">
              <TrendingDown className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="text-xs">
                <p className="font-bold text-amber-900 dark:text-amber-300">
                  Abaixo do recomendado (sem prejuízo, mas com margem reduzida)
                </p>
                <p className="mt-0.5 leading-relaxed text-amber-800 dark:text-amber-300/90">
                  Este valor não dá prejuízo, mas reduz sua margem real para{' '}
                  <strong className="tabular-nums">{formatPercent(diagnosis.margemRealAtual, 1)}</strong>{' '}
                  (contra {formatPercent(result.margemEfetiva, 1)} planejados), deixando{' '}
                  <strong className="tabular-nums">
                    {formatCurrencyBRL(diagnosis.faltaParaRecomendado)}
                  </strong>{' '}
                  na mesa por projeto.
                </p>
              </div>
            </div>
          </div>
        );
      case 'healthy':
        return (
          <div className="rounded-xl border border-[#16A34A]/30 bg-[#F0FDF4]/80 p-3.5 dark:border-emerald-800/60 dark:bg-emerald-950/40">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#16A34A] dark:text-emerald-400" />
              <div className="text-xs">
                <p className="font-bold text-[#14532D] dark:text-emerald-300">
                  Preço saudável e rentável
                </p>
                <p className="mt-0.5 leading-relaxed text-[#14532D]/90 dark:text-emerald-300/90">
                  Seu preço atual atinge ou supera o recomendado, entregando rentabilidade líquida
                  real de{' '}
                  <strong className="tabular-nums">{formatPercent(diagnosis.margemRealAtual, 1)}</strong>.
                </p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      {/* 1. Diagnóstico de precificação */}
      <section
        aria-label="Diagnóstico de precificação"
        className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-6 dark:border-slate-800 dark:bg-[#111827]"
      >
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F3F4F6] text-[#111827] dark:bg-slate-800 dark:text-white">
                <Activity className="h-4 w-4 text-[#16A34A]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#111827] dark:text-white">
                  Diagnóstico de precificação
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Compare o preço que você cobra hoje com o preço recomendado
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <label
              htmlFor="diag-current-price"
              className="block text-xs font-semibold text-gray-700 dark:text-slate-300"
            >
              Preço cobrado atualmente por este serviço (R$)
            </label>
            <div className="relative mt-1.5">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                R$
              </span>
              <input
                id="diag-current-price"
                type="number"
                min="0"
                step="10"
                placeholder={`Ex.: ${Math.round(result.precoRecomendado * 0.8)}`}
                value={currentPriceStr}
                onChange={(e) => setCurrentPriceStr(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm font-semibold text-[#111827] outline-none tabular-nums focus:border-[#16A34A] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
            {currentPriceStr.trim() !== '' && (!Number.isFinite(parsedCurrentPrice) || parsedCurrentPrice <= 0) && (
              <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
                Informe um valor maior que zero para executar o diagnóstico.
              </p>
            )}
          </div>

          {diagnosis ? (
            <div className="mt-5 space-y-4">
              {diagnosisBadge()}

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-gray-200 p-3 dark:border-slate-800">
                  <p className="text-[11px] text-gray-500 dark:text-slate-400">
                    Diferença vs recomendado
                  </p>
                  <p
                    className={`mt-1 text-sm font-bold tabular-nums ${
                      diagnosis.diferencaMonetaria < -0.01
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-[#16A34A] dark:text-emerald-400'
                    }`}
                  >
                    {diagnosis.diferencaMonetaria >= 0 ? '+' : ''}
                    {formatCurrencyBRL(diagnosis.diferencaMonetaria)}
                  </p>
                  <p className="text-[11px] text-gray-500 tabular-nums dark:text-slate-400">
                    {diagnosis.diferencaPercentual >= 0 ? '+' : ''}
                    {formatPercent(diagnosis.diferencaPercentual, 1)}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 p-3 dark:border-slate-800">
                  <p className="text-[11px] text-gray-500 dark:text-slate-400">
                    {diagnosis.lucroLiquidoAtual < 0 ? 'Prejuízo líquido real' : 'Lucro líquido real'}
                  </p>
                  <p
                    className={`mt-1 text-sm font-bold tabular-nums ${
                      diagnosis.lucroLiquidoAtual < -0.01
                        ? 'text-red-600 dark:text-red-400'
                        : diagnosis.status === 'below_recommended'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-[#16A34A] dark:text-emerald-400'
                    }`}
                  >
                    {formatCurrencyBRL(diagnosis.lucroLiquidoAtual)}
                  </p>
                  <p className="text-[11px] text-gray-500 tabular-nums dark:text-slate-400">
                    Rentabilidade: {formatPercent(diagnosis.margemRealAtual, 1)}
                  </p>
                </div>
              </div>

              {/* Comparativo visual de referência */}
              <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3.5 text-xs dark:border-slate-800 dark:bg-slate-900/50">
                <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-slate-400">
                  <span>Mínimo sem lucro: {formatCurrencyBRL(result.precoMinimo)}</span>
                  <span>Recomendado: {formatCurrencyBRL(result.precoRecomendado)}</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all ${
                      diagnosis.status === 'loss'
                        ? 'bg-red-500'
                        : diagnosis.status === 'below_recommended' || diagnosis.status === 'breakeven'
                        ? 'bg-amber-500'
                        : 'bg-[#16A34A]'
                    }`}
                    style={{
                      width: `${Math.min(100, Math.max(4, (diagnosis.precoAtual / result.precoRecomendado) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed border-gray-200 p-4 text-xs leading-relaxed text-gray-500 dark:border-slate-700 dark:text-slate-400">
              Digite o valor que você cobra hoje para descobrir imediatamente se ele gera lucro
              reduzido ou prejuízo real descontando impostos e o custo da sua hora.
            </div>
          )}
        </div>
      </section>

      {/* 2. Simulador de negociação */}
      <section
        aria-label="Simulador de negociação"
        className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-6 dark:border-slate-800 dark:bg-[#111827]"
      >
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F3F4F6] text-[#111827] dark:bg-slate-800 dark:text-white">
                <Percent className="h-4 w-4 text-[#16A34A]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#111827] dark:text-white">
                  Simulador de negociação
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Teste descontos em tempo real antes de responder ao cliente
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="sim-discount-input"
                className="text-xs font-semibold text-gray-700 dark:text-slate-300"
              >
                Desconto simulado (%)
              </label>
              <span className="text-xs font-semibold text-gray-500 tabular-nums dark:text-slate-400">
                Máximo sem prejuízo:{' '}
                <strong className="text-[#14532D] dark:text-emerald-400">
                  {formatPercent(maxSafeDiscountPercent, 1)}
                </strong>
              </span>
            </div>

            <div className="mt-2 flex items-center gap-3">
              <input
                type="range"
                min="0"
                max={Math.min(95, Math.max(40, Math.ceil(maxSafeDiscountPercent + 15)))}
                step="0.5"
                aria-label="Controle deslizante de desconto"
                value={Number.isFinite(parsedDiscount) ? Math.max(0, Math.min(95, parsedDiscount)) : 0}
                onChange={(e) => setDiscountStr(e.target.value)}
                className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-gray-200 accent-[#16A34A] dark:bg-slate-700"
              />
              <div className="relative w-24 shrink-0">
                <input
                  id="sim-discount-input"
                  type="number"
                  min="0"
                  max="99"
                  step="0.5"
                  value={discountStr}
                  onChange={(e) => setDiscountStr(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-3 pr-7 text-sm font-semibold text-[#111827] outline-none tabular-nums focus:border-[#16A34A] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  %
                </span>
              </div>
            </div>

            {/* Quick discount presets */}
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {[0, 5, 10, 15].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setDiscountStr(String(pct))}
                  className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    Math.abs(parsedDiscount - pct) < 0.05
                      ? 'border-[#16A34A] bg-[#F0FDF4] text-[#14532D] dark:border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  {pct === 0 ? 'Sem desconto' : `${pct}%`}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setDiscountStr(maxSafeDiscountPercent.toFixed(1))}
                className="rounded-lg border border-gray-200 px-2.5 py-1 text-[11px] font-semibold text-gray-700 transition-colors hover:border-[#16A34A]/50 hover:bg-[#F0FDF4] hover:text-[#14532D] dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Limite ({formatPercent(maxSafeDiscountPercent, 1)})
              </button>
            </div>
          </div>

          {!simulation.ok ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
              {simulation.error}
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {simulation.data.geraPrejuizo && (
                <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                  <span>
                    <strong>Desconto acima do limite seguro!</strong> Com{' '}
                    {formatPercent(simulation.data.descontoPercentual, 1)} de desconto você terá{' '}
                    <strong className="tabular-nums">
                      prejuízo de {formatCurrencyBRL(Math.abs(simulation.data.lucroLiquidoComDesconto))}
                    </strong>
                    . O teto sem prejuízo é{' '}
                    <strong className="tabular-nums">
                      {formatPercent(simulation.data.descontoMaximoSemPrejuizoPercent, 1)} (
                      {formatCurrencyBRL(simulation.data.descontoMaximoSemPrejuizoReais)})
                    </strong>
                    .
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-gray-200 p-3 dark:border-slate-800">
                  <p className="text-[11px] text-gray-500 dark:text-slate-400">Preço negociado</p>
                  <p className="mt-1 text-base font-extrabold text-[#111827] tabular-nums dark:text-white">
                    {formatCurrencyBRL(simulation.data.precoComDesconto)}
                  </p>
                  <p className="text-[11px] text-gray-500 tabular-nums dark:text-slate-400">
                    Desconto: -{formatCurrencyBRL(simulation.data.valorDesconto)}
                  </p>
                </div>

                <div
                  className={`rounded-xl border p-3 ${
                    simulation.data.geraPrejuizo
                      ? 'border-red-200 bg-red-50/50 dark:border-red-900/70 dark:bg-red-950/30'
                      : 'border-[#16A34A]/30 bg-[#F0FDF4]/50 dark:border-emerald-900/60 dark:bg-emerald-950/30'
                  }`}
                >
                  <p className="text-[11px] text-gray-600 dark:text-slate-300">
                    {simulation.data.geraPrejuizo ? 'Prejuízo estimado' : 'Lucro líquido restante'}
                  </p>
                  <p
                    className={`mt-1 text-base font-extrabold tabular-nums ${
                      simulation.data.geraPrejuizo
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-[#16A34A] dark:text-emerald-400'
                    }`}
                  >
                    {formatCurrencyBRL(simulation.data.lucroLiquidoComDesconto)}
                  </p>
                  <p className="text-[11px] text-gray-500 tabular-nums dark:text-slate-400">
                    Margem efetiva: {formatPercent(simulation.data.margemEfetivaComDesconto, 1)}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 p-3 dark:border-slate-800">
                  <p className="text-[11px] text-gray-500 dark:text-slate-400">
                    Impostos recalculados
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#111827] tabular-nums dark:text-white">
                    {formatCurrencyBRL(simulation.data.impostosComDesconto)}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 p-3 dark:border-slate-800">
                  <p className="text-[11px] text-gray-500 dark:text-slate-400">
                    Teto de desconto (R$)
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#14532D] tabular-nums dark:text-emerald-400">
                    {formatCurrencyBRL(simulation.data.descontoMaximoSemPrejuizoReais)}
                  </p>
                </div>
              </div>

              {simulation.data.descontoPercentual > 0 && !simulation.data.geraPrejuizo && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      onGenerateQuoteWithPrice(
                        simulation.data.precoComDesconto,
                        `Condição comercial negociada com desconto de ${formatPercent(simulation.data.descontoPercentual, 1)} aplicada sobre o valor de tabela.`
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#111827] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-[#111827] dark:hover:bg-gray-200"
                  >
                    <FileDown className="h-3.5 w-3.5" />
                    Gerar orçamento com {formatCurrencyBRL(simulation.data.precoComDesconto)}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
