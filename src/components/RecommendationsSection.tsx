import React, { useMemo } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { generateSmartRecommendations } from '../utils/recommendations';
import { RecommendationSeverity } from '../types';

const SEVERITY_STYLES: Record<
  RecommendationSeverity,
  {
    border: string;
    iconBg: string;
    badgeBg: string;
    icon: React.FC<{ className?: string }>;
  }
> = {
  critical: {
    border: 'border-red-200 dark:border-red-900/70',
    iconBg: 'bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400',
    badgeBg: 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300',
    icon: ShieldAlert,
  },
  warning: {
    border: 'border-amber-200 dark:border-amber-900/60',
    iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400',
    badgeBg: 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
    icon: AlertTriangle,
  },
  opportunity: {
    border: 'border-gray-200 dark:border-slate-800',
    iconBg: 'bg-[#F3F4F6] text-[#111827] dark:bg-slate-800 dark:text-slate-200',
    badgeBg: 'bg-[#F3F4F6] text-gray-700 dark:bg-slate-800 dark:text-slate-300',
    icon: Lightbulb,
  },
  healthy: {
    border: 'border-[#16A34A]/30 dark:border-emerald-800/70',
    iconBg: 'bg-[#F0FDF4] text-[#16A34A] dark:bg-emerald-950/60 dark:text-emerald-400',
    badgeBg: 'bg-[#F0FDF4] text-[#14532D] dark:bg-emerald-950/60 dark:text-emerald-300',
    icon: CheckCircle2,
  },
};

export const RecommendationsSection: React.FC = () => {
  const { state, totalMonthlyCosts, setActivePage } = useApp();

  const recommendations = useMemo(
    () => generateSmartRecommendations(state, totalMonthlyCosts),
    [state, totalMonthlyCosts]
  );

  if (recommendations.length === 0) return null;

  return (
    <section
      aria-label="Recomendações inteligentes"
      className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-slate-800 dark:bg-[#111827]"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F0FDF4] text-[#16A34A] dark:bg-emerald-950/70 dark:text-emerald-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#111827] dark:text-white">
              Recomendações inteligentes
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Insights calculados localmente com base nos seus custos, perfil e serviços cadastrados
            </p>
          </div>
        </div>
      </div>

      <div
        className={`mt-4 grid grid-cols-1 gap-3.5 ${
          recommendations.length > 1 ? 'md:grid-cols-2' : ''
        }`}
      >
        {recommendations.map((rec) => {
          const style = SEVERITY_STYLES[rec.severity];
          const Icon = style.icon;
          return (
            <article
              key={rec.id}
              className={`flex flex-col justify-between rounded-xl border p-4 transition-colors ${style.border}`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${style.iconBg}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-bold text-[#111827] dark:text-white">
                      {rec.title}
                    </h3>
                  </div>
                  {rec.metricLabel && (
                    <span
                      className={`shrink-0 whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-semibold tabular-nums ${style.badgeBg}`}
                    >
                      {rec.metricLabel}
                    </span>
                  )}
                </div>
                <p className="mt-2 pl-9 text-xs leading-relaxed text-gray-600 dark:text-slate-400">
                  {rec.description}
                </p>
              </div>

              {rec.actionLabel && rec.actionPage && (
                <div className="mt-3 pl-9">
                  <button
                    type="button"
                    onClick={() => setActivePage(rec.actionPage!)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#16A34A] transition-colors hover:text-[#14532D] dark:text-emerald-400 dark:hover:text-emerald-300"
                  >
                    {rec.actionLabel}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
};
