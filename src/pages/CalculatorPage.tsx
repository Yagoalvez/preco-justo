import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookmarkPlus,
  Check,
  Copy,
  FileDown,
  RotateCcw,
  Save,
  Sliders,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { useApp } from '../context/AppContext';
import { SERVICE_CATEGORIES, ServiceCategory, ServiceFormInput } from '../types';
import {
  calculatePricing,
  validateFinancialProfileValues,
  validateServiceFormValues,
  ValidationErrors,
} from '../utils/pricing';
import { formatCurrencyBRL, formatHours, formatPercent, parseNumericInput } from '../utils/format';
import { PricingAnalysisPanel } from '../components/PricingAnalysisPanel';

const COMPOSITION_COLORS = {
  labor: '#111827',
  additional: '#6B7280',
  taxes: '#D97706',
  profit: '#16A34A',
};

const STEPS = [
  { id: 1 as const, shortLabel: 'Perfil', label: 'Perfil financeiro', subtitle: 'Sua meta mensal e capacidade' },
  { id: 2 as const, shortLabel: 'Serviço', label: 'Informações do serviço', subtitle: 'Tempo, custos e margem' },
  { id: 3 as const, shortLabel: 'Resultado', label: 'Resultado', subtitle: 'Preço recomendado e orçamento' },
];

export const CalculatorPage: React.FC = () => {
  const {
    state,
    totalMonthlyCosts,
    updateProfile,
    addHistoryItem,
    addService,
    notify,
    clearToasts,
    setActivePage,
    openQuoteModal,
    calculatorPrefill,
    clearCalculatorPrefill,
  } = useApp();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 string inputs for smooth typing & clear validation
  const [remuneracaoStr, setRemuneracaoStr] = useState<string>(
    state.profile.remuneracaoMensal > 0 ? String(state.profile.remuneracaoMensal) : ''
  );
  const [usarCustosAutomaticos, setUsarCustosAutomaticos] = useState<boolean>(
    state.profile.usarCustosMensaisAutomaticos
  );
  const [custosManuaisStr, setCustosManuaisStr] = useState<string>(
    state.profile.custosFixosManuais > 0 ? String(state.profile.custosFixosManuais) : ''
  );
  const [diasStr, setDiasStr] = useState<string>(String(state.profile.diasTrabalhadosMes));
  const [horasDiaStr, setHorasDiaStr] = useState<string>(String(state.profile.horasProdutivasDia));
  const [faturavelStr, setFaturavelStr] = useState<string>(
    String(state.profile.percentualFaturavel)
  );

  // Step 2 inputs
  const [serviceName, setServiceName] = useState<string>('');
  const [categoria, setCategoria] = useState<ServiceCategory>('Design');
  const [descricao, setDescricao] = useState<string>('');
  const [horasNecessariasStr, setHorasNecessariasStr] = useState<string>('');
  const [custosAdicionaisStr, setCustosAdicionaisStr] = useState<string>('0');
  const [margemStr, setMargemStr] = useState<string>(String(state.profile.margemLucroPadrao));
  const [impostosStr, setImpostosStr] = useState<string>(String(state.profile.impostosTaxasPadrao));

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [savedHistoryId, setSavedHistoryId] = useState<string | null>(null);
  const [savedAsService, setSavedAsService] = useState<boolean>(false);

  // Sync profile changes from Settings or Demo data load
  useEffect(() => {
    setRemuneracaoStr(
      state.profile.remuneracaoMensal > 0 ? String(state.profile.remuneracaoMensal) : ''
    );
    setUsarCustosAutomaticos(state.profile.usarCustosMensaisAutomaticos);
    setCustosManuaisStr(
      state.profile.custosFixosManuais > 0 ? String(state.profile.custosFixosManuais) : ''
    );
    setDiasStr(String(state.profile.diasTrabalhadosMes));
    setHorasDiaStr(String(state.profile.horasProdutivasDia));
    setFaturavelStr(String(state.profile.percentualFaturavel));
  }, [
    state.profile.remuneracaoMensal,
    state.profile.usarCustosMensaisAutomaticos,
    state.profile.custosFixosManuais,
    state.profile.diasTrabalhadosMes,
    state.profile.horasProdutivasDia,
    state.profile.percentualFaturavel,
  ]);

  // Apply prefill when coming from Services or History
  useEffect(() => {
    if (!calculatorPrefill) return;
    setServiceName(calculatorPrefill.service.nome);
    setCategoria(calculatorPrefill.service.categoria);
    setDescricao(calculatorPrefill.service.descricao);
    setHorasNecessariasStr(String(calculatorPrefill.service.horasNecessarias));
    setCustosAdicionaisStr(String(calculatorPrefill.service.custosAdicionais));
    setMargemStr(String(calculatorPrefill.service.margemLucro));
    setImpostosStr(String(calculatorPrefill.service.impostosTaxas));
    if (calculatorPrefill.profileOverride) {
      const ov = calculatorPrefill.profileOverride;
      if (ov.remuneracaoMensal !== undefined) setRemuneracaoStr(String(ov.remuneracaoMensal));
      if (ov.usarCustosMensaisAutomaticos !== undefined) {
        setUsarCustosAutomaticos(ov.usarCustosMensaisAutomaticos);
      }
      if (ov.custosFixosManuais !== undefined) {
        setCustosManuaisStr(ov.custosFixosManuais > 0 ? String(ov.custosFixosManuais) : '0');
      }
      if (ov.diasTrabalhadosMes !== undefined) setDiasStr(String(ov.diasTrabalhadosMes));
      if (ov.horasProdutivasDia !== undefined) setHorasDiaStr(String(ov.horasProdutivasDia));
      if (ov.percentualFaturavel !== undefined) setFaturavelStr(String(ov.percentualFaturavel));
    }
    setStep(calculatorPrefill.step);
    setSavedHistoryId(null);
    setSavedAsService(false);
    setErrors({});
    clearCalculatorPrefill();
  }, [calculatorPrefill, clearCalculatorPrefill]);

  const remuneracaoMensal = parseNumericInput(remuneracaoStr, 0);
  const rawCustosManuais = parseNumericInput(custosManuaisStr, 0);
  const custosFixosMensais = usarCustosAutomaticos ? totalMonthlyCosts : rawCustosManuais;
  const diasTrabalhadosMes = parseNumericInput(diasStr, 0);
  const horasProdutivasDia = parseNumericInput(horasDiaStr, 0);
  const percentualFaturavel = parseNumericInput(faturavelStr, 0);

  const horasNecessarias = parseNumericInput(horasNecessariasStr, 0);
  const custosAdicionais = parseNumericInput(custosAdicionaisStr, 0);
  const margemLucro = parseNumericInput(margemStr, 0);
  const impostosTaxas = parseNumericInput(impostosStr, 0);

  const step1Preview = useMemo(() => {
    const errs = validateFinancialProfileValues({
      remuneracaoMensal,
      custosFixosMensais,
      diasTrabalhadosMes,
      horasProdutivasDia,
      percentualFaturavel,
    });
    if (Object.keys(errs).length > 0) return null;
    const horasFaturaveis = diasTrabalhadosMes * horasProdutivasDia * (percentualFaturavel / 100);
    const faturamentoAlvo = remuneracaoMensal + custosFixosMensais;
    const custoHora = faturamentoAlvo / horasFaturaveis;
    return { horasFaturaveis, faturamentoAlvo, custoHora };
  }, [
    remuneracaoMensal,
    custosFixosMensais,
    diasTrabalhadosMes,
    horasProdutivasDia,
    percentualFaturavel,
  ]);

  const calculationOutcome = useMemo(() => {
    return calculatePricing({
      remuneracaoMensal,
      custosFixosMensais,
      diasTrabalhadosMes,
      horasProdutivasDia,
      percentualFaturavel,
      horasNecessarias,
      custosAdicionais,
      margemLucro,
      impostosTaxas,
    });
  }, [
    remuneracaoMensal,
    custosFixosMensais,
    diasTrabalhadosMes,
    horasProdutivasDia,
    percentualFaturavel,
    horasNecessarias,
    custosAdicionais,
    margemLucro,
    impostosTaxas,
  ]);

  const persistProfile = () => {
    updateProfile({
      remuneracaoMensal: Number.isFinite(remuneracaoMensal) && remuneracaoMensal >= 0 ? remuneracaoMensal : 0,
      usarCustosMensaisAutomaticos: usarCustosAutomaticos,
      custosFixosManuais: Number.isFinite(rawCustosManuais) && rawCustosManuais >= 0 ? rawCustosManuais : 0,
      diasTrabalhadosMes: Number.isFinite(diasTrabalhadosMes) ? diasTrabalhadosMes : 20,
      horasProdutivasDia: Number.isFinite(horasProdutivasDia) ? horasProdutivasDia : 6,
      percentualFaturavel: Number.isFinite(percentualFaturavel) ? percentualFaturavel : 70,
    });
  };

  const handleNextFromStep1 = () => {
    const errs = validateFinancialProfileValues({
      remuneracaoMensal,
      custosFixosMensais,
      diasTrabalhadosMes,
      horasProdutivasDia,
      percentualFaturavel,
    });

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      notify({
        type: 'error',
        title: 'Verifique seu perfil financeiro',
        description: 'Corrija os campos destacados antes de continuar.',
      });
      return;
    }

    setErrors({});
    clearToasts();
    persistProfile();
    setStep(2);
  };

  const handleCalculateResult = () => {
    const profileErrs = validateFinancialProfileValues({
      remuneracaoMensal,
      custosFixosMensais,
      diasTrabalhadosMes,
      horasProdutivasDia,
      percentualFaturavel,
    });
    const serviceInput: ServiceFormInput = {
      nome: serviceName,
      categoria,
      descricao,
      horasNecessarias,
      custosAdicionais,
      margemLucro,
      impostosTaxas,
    };
    const serviceErrs = validateServiceFormValues(serviceInput);
    const merged = { ...profileErrs, ...serviceErrs };

    if (Object.keys(merged).length > 0 || !calculationOutcome.ok) {
      setErrors(merged);
      notify({
        type: 'error',
        title: 'Não foi possível calcular',
        description:
          merged.margemLucro ||
          'Revise os campos obrigatórios e os percentuais informados.',
      });
      return;
    }

    setErrors({});
    clearToasts();
    persistProfile();
    setSavedHistoryId(null);
    setSavedAsService(false);
    setStep(3);
  };

  const handleStepClick = (target: 1 | 2 | 3) => {
    if (target === 1) {
      setStep(1);
      return;
    }
    if (target === 2) {
      handleNextFromStep1();
      return;
    }
    if (target === 3) {
      handleCalculateResult();
    }
  };

  const handleSelectExistingService = (serviceId: string) => {
    const found = state.services.find((s) => s.id === serviceId);
    if (!found) return;
    setServiceName(found.nome);
    setCategoria(found.categoria);
    setDescricao(found.descricao);
    setHorasNecessariasStr(String(found.tempoEstimado));
    setCustosAdicionaisStr(String(found.custoAdicional));
    setMargemStr(String(found.margemLucro));
    setImpostosStr(String(found.impostosTaxas));
    setErrors({});
  };

  const handleSaveCalculation = () => {
    if (!calculationOutcome.ok) return;
    if (savedHistoryId) {
      notify({
        type: 'info',
        title: 'Cálculo já salvo',
        description: 'Este cálculo já foi registrado no histórico.',
      });
      return;
    }
    const created = addHistoryItem({
      data: new Date().toISOString(),
      serviceName: serviceName.trim(),
      categoria,
      descricao: descricao.trim(),
      inputs: {
        remuneracaoMensal,
        custosFixosMensais,
        diasTrabalhadosMes,
        horasProdutivasDia,
        percentualFaturavel,
        horasNecessarias,
        custosAdicionais,
        margemLucro,
        impostosTaxas,
      },
      result: calculationOutcome.data,
      isDemo: false,
    });
    setSavedHistoryId(created.id);
  };

  const handleSaveToCatalog = () => {
    if (!calculationOutcome.ok || savedAsService) return;
    addService({
      nome: serviceName.trim(),
      categoria,
      descricao:
        descricao.trim() ||
        `Serviço de ${categoria.toLowerCase()} com duração estimada de ${formatHours(horasNecessarias)}.`,
      tempoEstimado: horasNecessarias,
      custoAdicional: custosAdicionais,
      precoRecomendado: Number(calculationOutcome.data.precoRecomendado.toFixed(2)),
      margemLucro,
      impostosTaxas,
      isDemo: false,
    });
    setSavedAsService(true);
  };

  const handleCopyQuote = async () => {
    if (!calculationOutcome.ok) return;
    const profName = state.professional.nomeProfissional.trim() || 'Profissional Responsável';
    const validDays = state.professional.validadePadraoDias || 15;
    const text = [
      `ORÇAMENTO DE SERVIÇO`,
      `Profissional: ${profName}`,
      `Serviço: ${serviceName.trim()}`,
      descricao.trim() ? `Descrição: ${descricao.trim()}` : null,
      `Investimento: ${formatCurrencyBRL(calculationOutcome.data.precoRecomendado)}`,
      `Validade da proposta: ${validDays} dias`,
      state.professional.observacoesPadrao.trim()
        ? `Observações: ${state.professional.observacoesPadrao.trim()}`
        : null,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    notify({
      type: 'success',
      title: 'Orçamento copiado',
      description: 'Texto pronto para enviar ao cliente (sem expor custos internos ou margem).',
    });
  };

  const handleOpenPdfModal = () => {
    if (!calculationOutcome.ok) return;
    openQuoteModal({
      nomeServico: serviceName.trim(),
      descricao:
        descricao.trim() ||
        `Execução completa do serviço "${serviceName.trim()}" conforme escopo alinhado.`,
      valorFinal: calculationOutcome.data.precoRecomendado,
    });
  };

  const handleResetCalculation = () => {
    setServiceName('');
    setDescricao('');
    setHorasNecessariasStr('');
    setCustosAdicionaisStr('0');
    setMargemStr(String(state.profile.margemLucroPadrao));
    setImpostosStr(String(state.profile.impostosTaxasPadrao));
    setErrors({});
    clearToasts();
    setSavedHistoryId(null);
    setSavedAsService(false);
    setStep(1);
  };

  const compositionData = useMemo(() => {
    if (!calculationOutcome.ok) return [];
    const r = calculationOutcome.data;
    const laborColor = state.theme === 'dark' ? '#64748B' : COMPOSITION_COLORS.labor;
    return [
      { name: 'Mão de obra', value: Number(r.custoMaoDeObra.toFixed(2)), color: laborColor },
      { name: 'Custos adicionais', value: Number(r.custoServico - r.custoMaoDeObra > 0 ? (r.custoServico - r.custoMaoDeObra).toFixed(2) : 0), color: COMPOSITION_COLORS.additional },
      { name: 'Impostos e taxas', value: Number(r.valorImpostosTaxas.toFixed(2)), color: COMPOSITION_COLORS.taxes },
      { name: 'Lucro líquido', value: Number(r.lucroLiquidoEstimado.toFixed(2)), color: COMPOSITION_COLORS.profit },
    ].filter((d) => d.value > 0);
  }, [calculationOutcome, state.theme]);

  const combinedPercent =
    (Number.isFinite(margemLucro) ? margemLucro : 0) +
    (Number.isFinite(impostosTaxas) ? impostosTaxas : 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-[#111827] dark:text-white sm:text-3xl">
            Calculadora de preços
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
            Calcule seu preço justo com base nos custos reais, horas faturáveis, impostos e margem
            sobre o preço de venda.
          </p>
        </div>
        {step === 3 && (
          <button
            type="button"
            onClick={handleResetCalculation}
            className="inline-flex items-center gap-1.5 self-start rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-700 dark:bg-[#111827] dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Realizar novo cálculo
          </button>
        )}
      </div>

      {/* Stepper */}
      <div className="rounded-2xl border border-gray-200 bg-white p-2.5 sm:p-3.5 dark:border-slate-700/80 dark:bg-[#111827]">
        <ol className="grid grid-cols-3 gap-2 sm:gap-3">
          {STEPS.map((s) => {
            const isCurrent = step === s.id;
            const isCompleted = step > s.id;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => handleStepClick(s.id)}
                  aria-current={isCurrent ? 'step' : undefined}
                  className={`flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl border px-1.5 py-2 text-left transition-colors sm:justify-start sm:gap-3 sm:px-3.5 sm:py-2.5 ${
                    isCurrent
                      ? 'border-[#16A34A] bg-[#F0FDF4]/85 dark:border-emerald-500 dark:bg-emerald-950/50'
                      : isCompleted
                      ? 'border-gray-200 bg-gray-50/80 hover:border-gray-300 dark:border-slate-700 dark:bg-[#1A2333]/80 dark:hover:border-slate-600'
                      : 'border-gray-100 hover:border-gray-200 dark:border-slate-800 dark:hover:border-slate-700'
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold sm:h-7 sm:w-7 ${
                      isCurrent
                        ? 'bg-[#16A34A] text-white'
                        : isCompleted
                        ? 'bg-[#14532D] text-white dark:bg-emerald-600'
                        : 'bg-[#F3F4F6] text-gray-600 dark:bg-[#1A2333] dark:text-slate-300'
                    }`}
                  >
                    {isCompleted ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : s.id}
                  </span>
                  <div className="min-w-0">
                    <p
                      className={`truncate text-xs font-semibold sm:text-sm ${
                        isCurrent
                          ? 'text-[#14532D] dark:text-emerald-300'
                          : 'text-[#111827] dark:text-white'
                      }`}
                    >
                      <span className="sm:hidden">{s.shortLabel}</span>
                      <span className="hidden sm:inline">
                        Etapa {s.id} — {s.label}
                      </span>
                    </p>
                    <p className="hidden truncate text-xs text-gray-600 dark:text-slate-400 sm:block">
                      {s.subtitle}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {/* STEP 1: Financial Profile */}
      {step === 1 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-slate-700/80 dark:bg-[#111827] lg:col-span-8">
            <h2 className="text-base font-bold text-[#111827] dark:text-white">
              Etapa 1 — Perfil financeiro
            </h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
              Esses parâmetros determinam quanto custa cada hora produtiva da sua operação.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* Remuneração mensal desejada */}
              <div>
                <label
                  htmlFor="calc-remuneracao"
                  className="block text-xs font-semibold text-gray-700 dark:text-slate-300"
                >
                  Remuneração mensal desejada (R$)
                </label>
                <div className="relative mt-1.5">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                    R$
                  </span>
                  <input
                    id="calc-remuneracao"
                    type="number"
                    min="0"
                    step="50"
                    placeholder="5000"
                    value={remuneracaoStr}
                    onChange={(e) => setRemuneracaoStr(e.target.value)}
                    className={`w-full rounded-xl border bg-white py-2.5 pl-10 pr-3.5 text-sm font-medium text-[#111827] outline-none transition-colors tabular-nums focus:border-[#16A34A] dark:bg-[#1A2333] dark:text-white ${
                      errors.remuneracaoMensal
                        ? 'border-red-400 dark:border-red-500'
                        : 'border-gray-200 dark:border-slate-700'
                    }`}
                  />
                </div>
                {errors.remuneracaoMensal ? (
                  <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
                    {errors.remuneracaoMensal}
                  </p>
                ) : (
                  <p className="mt-1 text-[11px] text-gray-500 dark:text-slate-400">
                    Seu salário mensal (pró-labore) antes do lucro da empresa.
                  </p>
                )}
              </div>

              {/* Custos fixos mensais */}
              <div>
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="calc-custos-fixos"
                    className="block text-xs font-semibold text-gray-700 dark:text-slate-300"
                  >
                    Custos fixos mensais (R$)
                  </label>
                  <button
                    type="button"
                    onClick={() => setActivePage('costs')}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#16A34A] hover:underline dark:text-emerald-400"
                  >
                    Gerenciar custos
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>

                {usarCustosAutomaticos ? (
                  <div className="mt-1.5 flex items-center justify-between rounded-xl border border-[#16A34A]/30 bg-[#F0FDF4]/60 px-3.5 py-2.5 dark:border-emerald-800/70 dark:bg-emerald-950/30">
                    <span className="text-sm font-bold text-[#14532D] tabular-nums dark:text-emerald-300">
                      {formatCurrencyBRL(totalMonthlyCosts)}
                    </span>
                    <span className="text-[11px] font-medium text-[#16A34A] dark:text-emerald-400">
                      Sincronizado ({state.costs.length}{' '}
                      {state.costs.length === 1 ? 'item' : 'itens'})
                    </span>
                  </div>
                ) : (
                  <div className="relative mt-1.5">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                      R$
                    </span>
                    <input
                      id="calc-custos-fixos"
                      type="number"
                      min="0"
                      step="10"
                      placeholder="1200"
                      value={custosManuaisStr}
                      onChange={(e) => setCustosManuaisStr(e.target.value)}
                      className={`w-full rounded-xl border bg-white py-2.5 pl-10 pr-3.5 text-sm font-medium text-[#111827] outline-none transition-colors tabular-nums focus:border-[#16A34A] dark:bg-[#1A2333] dark:text-white ${
                        errors.custosFixosMensais
                          ? 'border-red-400 dark:border-red-500'
                          : 'border-gray-200 dark:border-slate-700'
                      }`}
                    />
                  </div>
                )}

                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 text-[11px] text-gray-500 dark:text-slate-400">
                    <input
                      type="checkbox"
                      checked={usarCustosAutomaticos}
                      onChange={(e) => setUsarCustosAutomaticos(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-gray-300 text-[#16A34A] focus:ring-[#16A34A]"
                    />
                    Usar soma automática de Custos mensais (sem duplicar)
                  </label>
                </div>
                {errors.custosFixosMensais && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {errors.custosFixosMensais}
                  </p>
                )}
              </div>

              {/* Dias trabalhados por mês */}
              <div>
                <label
                  htmlFor="calc-dias"
                  className="block text-xs font-semibold text-gray-700 dark:text-slate-300"
                >
                  Dias trabalhados por mês
                </label>
                <input
                  id="calc-dias"
                  type="number"
                  min="1"
                  max="31"
                  step="1"
                  value={diasStr}
                  onChange={(e) => setDiasStr(e.target.value)}
                  className={`mt-1.5 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm font-medium text-[#111827] outline-none transition-colors tabular-nums focus:border-[#16A34A] dark:bg-[#1A2333] dark:text-white ${
                    errors.diasTrabalhadosMes
                      ? 'border-red-400 dark:border-red-500'
                      : 'border-gray-200 dark:border-slate-700'
                  }`}
                />
                {errors.diasTrabalhadosMes ? (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {errors.diasTrabalhadosMes}
                  </p>
                ) : (
                  <p className="mt-1 text-[11px] text-gray-500 dark:text-slate-400">
                    Ex.: 20 a 22 dias úteis no mês.
                  </p>
                )}
              </div>

              {/* Horas produtivas por dia */}
              <div>
                <label
                  htmlFor="calc-horas-dia"
                  className="block text-xs font-semibold text-gray-700 dark:text-slate-300"
                >
                  Horas produtivas por dia
                </label>
                <input
                  id="calc-horas-dia"
                  type="number"
                  min="0.5"
                  max="24"
                  step="0.5"
                  value={horasDiaStr}
                  onChange={(e) => setHorasDiaStr(e.target.value)}
                  className={`mt-1.5 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm font-medium text-[#111827] outline-none transition-colors tabular-nums focus:border-[#16A34A] dark:bg-[#1A2333] dark:text-white ${
                    errors.horasProdutivasDia
                      ? 'border-red-400 dark:border-red-500'
                      : 'border-gray-200 dark:border-slate-700'
                  }`}
                />
                {errors.horasProdutivasDia ? (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {errors.horasProdutivasDia}
                  </p>
                ) : (
                  <p className="mt-1 text-[11px] text-gray-500 dark:text-slate-400">
                    Jornada diária efetivamente dedicada ao trabalho.
                  </p>
                )}
              </div>

              {/* Percentual faturável */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="calc-faturavel"
                    className="block text-xs font-semibold text-gray-700 dark:text-slate-300"
                  >
                    Percentual de horas efetivamente faturáveis (%)
                  </label>
                  <span className="text-xs font-bold text-[#16A34A] tabular-nums dark:text-emerald-400">
                    {Number.isFinite(percentualFaturavel) ? `${percentualFaturavel}%` : '—'}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-4">
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    aria-label="Controle deslizante de percentual faturável"
                    value={
                      Number.isFinite(percentualFaturavel)
                        ? Math.min(100, Math.max(10, percentualFaturavel))
                        : 70
                    }
                    onChange={(e) => setFaturavelStr(e.target.value)}
                    className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-gray-200 accent-[#16A34A] dark:bg-slate-700"
                  />
                  <div className="relative w-24 shrink-0">
                    <input
                      id="calc-faturavel"
                      type="number"
                      min="1"
                      max="100"
                      step="1"
                      value={faturavelStr}
                      onChange={(e) => setFaturavelStr(e.target.value)}
                      className={`w-full rounded-xl border bg-white py-2 pl-3 pr-7 text-sm font-medium text-[#111827] outline-none tabular-nums focus:border-[#16A34A] dark:bg-[#1A2333] dark:text-white ${
                        errors.percentualFaturavel
                          ? 'border-red-400 dark:border-red-500'
                          : 'border-gray-200 dark:border-slate-700'
                      }`}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                      %
                    </span>
                  </div>
                </div>
                {errors.percentualFaturavel ? (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {errors.percentualFaturavel}
                  </p>
                ) : (
                  <p className="mt-1 text-[11px] text-gray-500 dark:text-slate-400">
                    Parte do tempo é gasta em prospecção, administrativo e reuniões. Para autônomos,
                    60% a 80% costuma ser realista.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end border-t border-gray-100 pt-5 dark:border-slate-800">
              <button
                type="button"
                onClick={handleNextFromStep1}
                className="inline-flex items-center gap-2 rounded-xl bg-[#16A34A] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#15803D]"
              >
                Avançar para informações do serviço
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Live preview sidebar */}
          <aside className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-slate-700/80 dark:bg-[#111827] lg:col-span-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
              <Sliders className="h-4 w-4 text-[#16A34A]" />
              Resumo do perfil
            </div>

            {step1Preview ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-[#16A34A]/25 bg-[#F0FDF4]/70 p-4 dark:border-emerald-800/60 dark:bg-emerald-950/40">
                  <p className="text-xs font-medium text-[#14532D] dark:text-emerald-300">
                    Custo base da sua hora
                  </p>
                  <p className="mt-1 font-display text-2xl font-extrabold text-[#14532D] tabular-nums dark:text-emerald-400">
                    {formatCurrencyBRL(step1Preview.custoHora)}
                    <span className="text-sm font-semibold">/h</span>
                  </p>
                </div>

                <dl className="space-y-3 border-t border-gray-100 pt-4 text-sm dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <dt className="text-gray-500 dark:text-slate-400">Horas faturáveis / mês</dt>
                    <dd className="font-semibold text-[#111827] tabular-nums dark:text-white">
                      {formatHours(step1Preview.horasFaturaveis)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-gray-500 dark:text-slate-400">Remuneração desejada</dt>
                    <dd className="font-semibold text-[#111827] tabular-nums dark:text-white">
                      {formatCurrencyBRL(remuneracaoMensal)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-gray-500 dark:text-slate-400">Custos fixos mensais</dt>
                    <dd className="font-semibold text-[#111827] tabular-nums dark:text-white">
                      {formatCurrencyBRL(custosFixosMensais)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-100 pt-3 dark:border-slate-800">
                    <dt className="font-medium text-gray-700 dark:text-slate-300">
                      Cobertura mensal necessária
                    </dt>
                    <dd className="font-bold text-[#111827] tabular-nums dark:text-white">
                      {formatCurrencyBRL(step1Preview.faturamentoAlvo)}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-dashed border-gray-200 p-4 text-xs leading-relaxed text-gray-500 dark:border-slate-700 dark:text-slate-400">
                Preencha sua remuneração mensal desejada e sua rotina de trabalho para visualizar o
                custo real da sua hora.
              </div>
            )}
          </aside>
        </div>
      )}

      {/* STEP 2: Service Information */}
      {step === 2 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-slate-700/80 dark:bg-[#111827] lg:col-span-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-[#111827] dark:text-white">
                  Etapa 2 — Informações do serviço
                </h2>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                  Informe o escopo, o tempo estimado, os custos extras e os percentuais sobre o
                  preço de venda.
                </p>
              </div>

              {state.services.length > 0 && (
                <div className="sm:w-56">
                  <label htmlFor="prefill-service" className="sr-only">
                    Preencher a partir de Meus serviços
                  </label>
                  <select
                    id="prefill-service"
                    value=""
                    onChange={(e) => handleSelectExistingService(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-[#F3F4F6]/60 px-3 py-2 text-xs font-medium text-gray-700 outline-none focus:border-[#16A34A] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <option value="">Preencher de Meus serviços...</option>
                    {state.services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nome}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* Nome do serviço */}
              <div className="sm:col-span-2 sm:grid sm:grid-cols-3 sm:gap-4">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="calc-service-name"
                    className="block text-xs font-semibold text-gray-700 dark:text-slate-300"
                  >
                    Nome do serviço
                  </label>
                  <input
                    id="calc-service-name"
                    type="text"
                    placeholder="Ex.: Criação de identidade visual"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    className={`mt-1.5 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-[#111827] outline-none transition-colors focus:border-[#16A34A] dark:bg-[#1A2333] dark:text-white ${
                      errors.nome
                        ? 'border-red-400 dark:border-red-500'
                        : 'border-gray-200 dark:border-slate-700'
                    }`}
                  />
                  {errors.nome && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.nome}</p>
                  )}
                </div>

                <div className="mt-4 sm:mt-0">
                  <label
                    htmlFor="calc-service-category"
                    className="block text-xs font-semibold text-gray-700 dark:text-slate-300"
                  >
                    Categoria
                  </label>
                  <select
                    id="calc-service-category"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value as ServiceCategory)}
                    className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-[#111827] outline-none focus:border-[#16A34A] dark:border-slate-700 dark:bg-[#1A2333] dark:text-white"
                  >
                    {SERVICE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Descrição opcional */}
              <div className="sm:col-span-2">
                <label
                  htmlFor="calc-service-desc"
                  className="block text-xs font-semibold text-gray-700 dark:text-slate-300"
                >
                  Descrição do escopo <span className="font-normal text-gray-400">(opcional — usada no orçamento PDF)</span>
                </label>
                <textarea
                  id="calc-service-desc"
                  rows={2}
                  placeholder="Descreva brevemente entregas, etapas ou inclusões deste serviço..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="mt-1.5 w-full resize-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-[#111827] outline-none focus:border-[#16A34A] dark:border-slate-700 dark:bg-[#1A2333] dark:text-white"
                />
              </div>

              {/* Quantidade de horas necessárias */}
              <div>
                <label
                  htmlFor="calc-hours-needed"
                  className="block text-xs font-semibold text-gray-700 dark:text-slate-300"
                >
                  Quantidade de horas necessárias
                </label>
                <input
                  id="calc-hours-needed"
                  type="number"
                  min="0.5"
                  step="0.5"
                  placeholder="Ex.: 12"
                  value={horasNecessariasStr}
                  onChange={(e) => setHorasNecessariasStr(e.target.value)}
                  className={`mt-1.5 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm font-medium text-[#111827] outline-none tabular-nums focus:border-[#16A34A] dark:bg-[#1A2333] dark:text-white ${
                    errors.horasNecessarias
                      ? 'border-red-400 dark:border-red-500'
                      : 'border-gray-200 dark:border-slate-700'
                  }`}
                />
                {errors.horasNecessarias ? (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {errors.horasNecessarias}
                  </p>
                ) : (
                  <p className="mt-1 text-[11px] text-gray-500 dark:text-slate-400">
                    Inclua planejamento, execução, revisões e entrega.
                  </p>
                )}
              </div>

              {/* Custos adicionais */}
              <div>
                <label
                  htmlFor="calc-extra-cost"
                  className="block text-xs font-semibold text-gray-700 dark:text-slate-300"
                >
                  Custos adicionais diretos (R$)
                </label>
                <div className="relative mt-1.5">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                    R$
                  </span>
                  <input
                    id="calc-extra-cost"
                    type="number"
                    min="0"
                    step="10"
                    placeholder="0"
                    value={custosAdicionaisStr}
                    onChange={(e) => setCustosAdicionaisStr(e.target.value)}
                    className={`w-full rounded-xl border bg-white py-2.5 pl-10 pr-3.5 text-sm font-medium text-[#111827] outline-none tabular-nums focus:border-[#16A34A] dark:bg-[#1A2333] dark:text-white ${
                      errors.custosAdicionais
                        ? 'border-red-400 dark:border-red-500'
                        : 'border-gray-200 dark:border-slate-700'
                    }`}
                  />
                </div>
                {errors.custosAdicionais ? (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {errors.custosAdicionais}
                  </p>
                ) : (
                  <p className="mt-1 text-[11px] text-gray-500 dark:text-slate-400">
                    Bancos de imagem, licenças, terceiros, frete ou materiais exclusivos.
                  </p>
                )}
              </div>

              {/* Margem de lucro desejada */}
              <div>
                <label
                  htmlFor="calc-margin"
                  className="block text-xs font-semibold text-gray-700 dark:text-slate-300"
                >
                  Margem de lucro desejada (% sobre a venda)
                </label>
                <div className="relative mt-1.5">
                  <input
                    id="calc-margin"
                    type="number"
                    min="0"
                    max="99"
                    step="1"
                    value={margemStr}
                    onChange={(e) => setMargemStr(e.target.value)}
                    className={`w-full rounded-xl border bg-white py-2.5 pl-3.5 pr-8 text-sm font-medium text-[#111827] outline-none tabular-nums focus:border-[#16A34A] dark:bg-[#1A2333] dark:text-white ${
                      errors.margemLucro
                        ? 'border-red-400 dark:border-red-500'
                        : 'border-gray-200 dark:border-slate-700'
                    }`}
                  />
                  <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    %
                  </span>
                </div>
                {errors.margemLucro && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {errors.margemLucro}
                  </p>
                )}
              </div>

              {/* Impostos e taxas */}
              <div>
                <label
                  htmlFor="calc-taxes"
                  className="block text-xs font-semibold text-gray-700 dark:text-slate-300"
                >
                  Impostos e taxas (% sobre a venda)
                </label>
                <div className="relative mt-1.5">
                  <input
                    id="calc-taxes"
                    type="number"
                    min="0"
                    max="99"
                    step="0.5"
                    value={impostosStr}
                    onChange={(e) => setImpostosStr(e.target.value)}
                    className={`w-full rounded-xl border bg-white py-2.5 pl-3.5 pr-8 text-sm font-medium text-[#111827] outline-none tabular-nums focus:border-[#16A34A] dark:bg-[#1A2333] dark:text-white ${
                      errors.impostosTaxas
                        ? 'border-red-400 dark:border-red-500'
                        : 'border-gray-200 dark:border-slate-700'
                    }`}
                  />
                  <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    %
                  </span>
                </div>
                {errors.impostosTaxas ? (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {errors.impostosTaxas}
                  </p>
                ) : (
                  <p className="mt-1 text-[11px] text-gray-500 dark:text-slate-400">
                    Nota fiscal (Simples/ISS), taxas de cartão ou intermediadores.
                  </p>
                )}
              </div>
            </div>

            {combinedPercent >= 100 && (
              <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  A soma da margem de lucro ({formatPercent(margemLucro, 1)}) com impostos e taxas (
                  {formatPercent(impostosTaxas, 1)}) é igual ou superior a 100%. Como ambos incidem
                  sobre o preço de venda, reduza os percentuais para obter um preço válido.
                </span>
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-5 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </button>
              <button
                type="button"
                onClick={handleCalculateResult}
                className="inline-flex items-center gap-2 rounded-xl bg-[#16A34A] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#15803D]"
              >
                Calcular preço justo
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Step 2 live estimation sidebar */}
          <aside className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-slate-700/80 dark:bg-[#111827] lg:col-span-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
              Prévia em tempo real
            </h3>

            {calculationOutcome.ok ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-[#16A34A]/30 bg-[#F0FDF4]/70 p-4 dark:border-emerald-800/60 dark:bg-emerald-950/40">
                  <p className="text-xs font-medium text-[#14532D] dark:text-emerald-300">
                    Preço recomendado estimado
                  </p>
                  <p className="mt-1 font-display text-2xl font-extrabold text-[#14532D] tabular-nums dark:text-emerald-400">
                    {formatCurrencyBRL(calculationOutcome.data.precoRecomendado)}
                  </p>
                </div>
                <dl className="space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-gray-500 dark:text-slate-400">Custo da hora</dt>
                    <dd className="font-semibold text-[#111827] tabular-nums dark:text-white">
                      {formatCurrencyBRL(calculationOutcome.data.custoHora)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500 dark:text-slate-400">Custo total do serviço</dt>
                    <dd className="font-semibold text-[#111827] tabular-nums dark:text-white">
                      {formatCurrencyBRL(calculationOutcome.data.custoServico)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500 dark:text-slate-400">Preço mínimo (sem lucro)</dt>
                    <dd className="font-semibold text-[#111827] tabular-nums dark:text-white">
                      {formatCurrencyBRL(calculationOutcome.data.precoMinimo)}
                    </dd>
                  </div>
                  <div className="flex justify-between border-t border-gray-100 pt-2.5 dark:border-slate-800">
                    <dt className="text-gray-500 dark:text-slate-400">Lucro líquido estimado</dt>
                    <dd className="font-bold text-[#16A34A] tabular-nums dark:text-emerald-400">
                      {formatCurrencyBRL(calculationOutcome.data.lucroLiquidoEstimado)}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : (
              <p className="mt-4 text-xs leading-relaxed text-gray-500 dark:text-slate-400">
                Informe a quantidade de horas e os percentuais válidos para ver a prévia imediata
                do valor do serviço.
              </p>
            )}
          </aside>
        </div>
      )}

      {/* STEP 3: Result */}
      {step === 3 && calculationOutcome.ok && (
        <div className="space-y-6">
          {/* Primary Hero + Key Breakdown */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Hero Recommended Price */}
            <div className="flex flex-col justify-between rounded-2xl border-2 border-[#16A34A] bg-white p-6 dark:border-emerald-500 dark:bg-[#111827] lg:col-span-7">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center rounded-lg bg-[#F0FDF4] px-2.5 py-1 text-xs font-semibold text-[#14532D] dark:bg-emerald-950/70 dark:text-emerald-300">
                    {categoria}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-slate-400">
                    {formatHours(horasNecessarias)} estimadas
                  </span>
                </div>

                <h2 className="mt-3 font-display text-xl font-bold text-[#111827] dark:text-white">
                  {serviceName.trim()}
                </h2>
                {descricao.trim() && (
                  <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">{descricao}</p>
                )}

                <div className="mt-6 rounded-2xl bg-[#14532D] px-6 py-6 text-white dark:bg-emerald-950">
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-200">
                    Preço recomendado para cobrança
                  </p>
                  <p className="mt-2 font-display text-4xl font-extrabold tracking-tight tabular-nums sm:text-5xl">
                    {formatCurrencyBRL(calculationOutcome.data.precoRecomendado)}
                  </p>
                  <p className="mt-2 text-xs text-emerald-100/90">
                    Cobre 100% do seu tempo, custos operacionais, despesas extras, impostos e garante{' '}
                    <strong className="font-semibold text-white">
                      {formatPercent(calculationOutcome.data.margemEfetiva, 1)}
                    </strong>{' '}
                    de margem líquida real sobre a venda.
                  </p>
                </div>

                {/* Secondary metrics grid */}
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-gray-200 p-3.5 dark:border-slate-800">
                    <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400">
                      Custo da hora
                    </p>
                    <p className="mt-1 text-base font-bold text-[#111827] tabular-nums dark:text-white">
                      {formatCurrencyBRL(calculationOutcome.data.custoHora)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-3.5 dark:border-slate-800">
                    <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400">
                      Custo total do serviço
                    </p>
                    <p className="mt-1 text-base font-bold text-[#111827] tabular-nums dark:text-white">
                      {formatCurrencyBRL(calculationOutcome.data.custoServico)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-3.5 dark:border-slate-800">
                    <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400">
                      Preço mínimo sem lucro
                    </p>
                    <p className="mt-1 text-base font-bold text-[#111827] tabular-nums dark:text-white">
                      {formatCurrencyBRL(calculationOutcome.data.precoMinimo)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#16A34A]/30 bg-[#F0FDF4]/50 p-3.5 dark:border-emerald-900/70 dark:bg-emerald-950/30">
                    <p className="text-[11px] font-medium text-[#14532D] dark:text-emerald-300">
                      Lucro líquido estimado
                    </p>
                    <p className="mt-1 text-base font-bold text-[#16A34A] tabular-nums dark:text-emerald-400">
                      {formatCurrencyBRL(calculationOutcome.data.lucroLiquidoEstimado)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-3.5 dark:border-slate-800">
                    <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400">
                      Impostos e taxas ({formatPercent(impostosTaxas, 1)})
                    </p>
                    <p className="mt-1 text-base font-bold text-[#111827] tabular-nums dark:text-white">
                      {formatCurrencyBRL(calculationOutcome.data.valorImpostosTaxas)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-3.5 dark:border-slate-800">
                    <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400">
                      Margem de lucro efetiva
                    </p>
                    <p className="mt-1 text-base font-bold text-[#111827] tabular-nums dark:text-white">
                      {formatPercent(calculationOutcome.data.margemEfetiva, 1)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-6 space-y-3 border-t border-gray-100 pt-5 dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleSaveCalculation}
                    className={`inline-flex min-h-[42px] items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                      savedHistoryId
                        ? 'border border-[#16A34A]/40 bg-[#F0FDF4] text-[#14532D] dark:border-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-[#16A34A] text-white hover:bg-[#15803D]'
                    }`}
                  >
                    {savedHistoryId ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Cálculo salvo
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Salvar cálculo
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenPdfModal}
                    className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#111827] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-[#111827] dark:hover:bg-gray-200"
                  >
                    <FileDown className="h-4 w-4" />
                    Gerar orçamento em PDF
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyQuote}
                    className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-[#111827] transition-colors hover:bg-gray-50 dark:border-slate-600 dark:bg-[#1A2333] dark:text-white dark:hover:bg-slate-800"
                  >
                    <Copy className="h-4 w-4 text-gray-500 dark:text-slate-300" />
                    Copiar orçamento
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={handleSaveToCatalog}
                    disabled={savedAsService}
                    className="inline-flex min-h-[38px] items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-[#1A2333] dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <BookmarkPlus className="h-4 w-4 text-[#16A34A]" />
                    {savedAsService ? 'Salvo em Meus serviços' : 'Salvar em Meus serviços'}
                  </button>

                  <button
                    type="button"
                    onClick={handleResetCalculation}
                    className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-100 hover:text-[#111827] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Realizar novo cálculo
                  </button>
                </div>
              </div>
            </div>

            {/* Price composition chart */}
            <div className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-6 dark:border-slate-700/80 dark:bg-[#111827] lg:col-span-5">
              <div>
                <h3 className="text-base font-bold text-[#111827] dark:text-white">
                  Composição do preço
                </h3>
                <p className="mt-0.5 text-xs text-gray-600 dark:text-slate-400">
                  Como o valor recomendado se divide entre custos, impostos e lucro líquido
                </p>

                <div className="mt-4 h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%" minHeight={240}>
                    <PieChart>
                      <Pie
                        data={compositionData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={58}
                        outerRadius={90}
                        paddingAngle={2}
                        stroke="none"
                        isAnimationActive={false}
                      >
                        {compositionData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        separator=": "
                        formatter={(val: number) => [formatCurrencyBRL(val), 'Parcela']}
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

                <ul className="mt-3 space-y-2.5 border-t border-gray-100 pt-4 dark:border-slate-800">
                  {compositionData.map((item) => {
                    const pct =
                      calculationOutcome.data.precoRecomendado > 0
                        ? (item.value / calculationOutcome.data.precoRecomendado) * 100
                        : 0;
                    return (
                      <li key={item.name} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          {item.name}
                        </span>
                        <span className="flex items-center gap-2 font-semibold text-[#111827] tabular-nums dark:text-white">
                          <span>{formatCurrencyBRL(item.value)}</span>
                          <span className="w-12 text-right font-medium text-gray-400 dark:text-slate-500">
                            {formatPercent(pct, 1)}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-[#111827] dark:text-slate-400 dark:hover:text-white"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Ajustar parâmetros do serviço
                </button>
              </div>
            </div>
          </div>

          {/* Diagnóstico de precificação + Simulador de negociação */}
          <PricingAnalysisPanel
            serviceName={serviceName.trim()}
            descricao={descricao.trim()}
            impostosTaxas={impostosTaxas}
            result={calculationOutcome.data}
            onGenerateQuoteWithPrice={(finalPrice, discountNote) => {
              const baseNotes = state.professional.observacoesPadrao.trim();
              const mergedNotes = [discountNote, baseNotes].filter(Boolean).join('\n\n');
              openQuoteModal({
                nomeServico: serviceName.trim(),
                descricao:
                  descricao.trim() ||
                  `Execução completa do serviço "${serviceName.trim()}" conforme escopo alinhado.`,
                valorFinal: finalPrice,
                observacoes: mergedNotes,
              });
            }}
          />
        </div>
      )}
    </div>
  );
};
