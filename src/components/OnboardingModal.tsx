import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Calculator,
  Database,
  Receipt,
  Scale,
  Target,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const SLIDES = [
  {
    icon: Scale,
    eyebrow: 'Bem-vindo ao Preço Justo',
    title: 'Precifique seus serviços com base em números reais',
    description:
      'Seu trabalho tem valor. O Preço Justo calcula automaticamente quanto custa sua hora produtiva e determina o preço mínimo e o preço recomendado com margem real sobre o preço de venda.',
    bullets: [
      'Sem planilhas confusas e 100% armazenado localmente no seu navegador',
      'Diferencia margem reduzida de prejuízo real descontando custos e impostos',
      'Gera orçamentos profissionais em PDF sem expor seus custos internos',
    ],
  },
  {
    icon: Receipt,
    eyebrow: 'Passo 1 de 2 — Estrutura financeira',
    title: 'Configure seus custos fixos e sua capacidade faturável',
    description:
      'Comece registrando despesas fixas mensais (internet, energia, softwares, aluguel) em Custos mensais. Depois, informe na Calculadora sua remuneração desejada, dias trabalhados, horas diárias e percentual faturável.',
    bullets: [
      'Os custos mensais são somados automaticamente na calculadora, sem duplicar valores',
      'O percentual faturável considera o tempo real dedicado a clientes (geralmente 65% a 80%)',
      'Você pode testar tudo primeiro carregando os dados demonstrativos',
    ],
  },
  {
    icon: Target,
    eyebrow: 'Passo 2 de 2 — Cálculo, negociação e metas',
    title: 'Calcule seu primeiro serviço e negocie sem medo',
    description:
      'Na etapa de resultado você visualiza o preço recomendado, diagnostica o preço que cobra hoje, simula descontos até o limite sem prejuízo e planeja quantos serviços precisa vender para bater sua meta mensal.',
    bullets: [
      'Diagnóstico de precificação compara seu preço atual com o preço justo',
      'Simulador de negociação calcula o desconto máximo antes do prejuízo',
      'Exporte orçamentos comerciais em PDF e faça backups em JSON quando quiser',
    ],
  },
];

export const OnboardingModal: React.FC = () => {
  const { onboardingOpen, completeOnboarding, setActivePage, loadDemoData } = useApp();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!onboardingOpen) {
      setStep(0);
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') completeOnboarding();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onboardingOpen, completeOnboarding]);

  if (!onboardingOpen) return null;

  const current = SLIDES[step];
  const Icon = current.icon;
  const isLast = step === SLIDES.length - 1;

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#111827]">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            {SLIDES.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === step
                    ? 'w-8 bg-[#16A34A]'
                    : idx < step
                    ? 'w-4 bg-[#14532D] dark:bg-emerald-700'
                    : 'w-4 bg-gray-200 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={completeOnboarding}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            Pular guia
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-7">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0FDF4] text-[#16A34A] dark:bg-emerald-950/70 dark:text-emerald-400">
            <Icon className="h-5 w-5" />
          </div>

          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#16A34A] dark:text-emerald-400">
            {current.eyebrow}
          </p>
          <h2
            id="onboarding-title"
            className="mt-1 font-display text-xl font-extrabold tracking-tight text-[#111827] dark:text-white"
          >
            {current.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-slate-400">
            {current.description}
          </p>

          <ul className="mt-5 space-y-2.5 rounded-xl border border-gray-100 bg-gray-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/50">
            {current.bullets.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2.5 text-xs leading-relaxed text-gray-700 dark:text-slate-300"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#16A34A]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/40">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Anterior
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                loadDemoData();
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Database className="h-3.5 w-3.5 text-[#16A34A]" />
              Carregar dados demonstrativos
            </button>
          )}

          {isLast ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={completeOnboarding}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Explorar painel
              </button>
              <button
                type="button"
                onClick={() => {
                  completeOnboarding();
                  setActivePage('calculator');
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#16A34A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#15803D]"
              >
                <Calculator className="h-3.5 w-3.5" />
                Calcular primeiro serviço
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#16A34A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#15803D]"
            >
              Próximo
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
