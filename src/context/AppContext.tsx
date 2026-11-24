import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  AppState,
  COST_CATEGORIES,
  CalculationHistoryItem,
  CostCategory,
  FinancialProfile,
  GoalSettings,
  MonthlyCost,
  PageId,
  ProfessionalSettings,
  QuoteDraft,
  SERVICE_CATEGORIES,
  ServiceCategory,
  ServiceFormInput,
  ServiceItem,
  ThemeMode,
  ToastMessage,
} from '../types';
import { buildDemoBundle } from '../data/demoData';
import { generateId } from '../utils/format';

const STORAGE_KEY = 'preco_justo_app_state_v1';
const BACKUP_SCHEMA_VERSION = 2;

const DEFAULT_PROFILE: FinancialProfile = {
  remuneracaoMensal: 0,
  usarCustosMensaisAutomaticos: true,
  custosFixosManuais: 0,
  diasTrabalhadosMes: 20,
  horasProdutivasDia: 6,
  percentualFaturavel: 70,
  margemLucroPadrao: 25,
  impostosTaxasPadrao: 6,
};

const DEFAULT_PROFESSIONAL: ProfessionalSettings = {
  nomeProfissional: '',
  especialidade: '',
  email: '',
  telefone: '',
  documento: '',
  cidade: '',
  validadePadraoDias: 15,
  observacoesPadrao:
    'Pagamento: 50% na aprovação e 50% na entrega. Alterações fora do escopo descrito serão orçadas separadamente.',
};

const DEFAULT_GOAL: GoalSettings = {
  metaFaturamentoMensal: 0,
  mixQuantidades: {},
};

const DEFAULT_STATE: AppState = {
  theme: 'light',
  profile: DEFAULT_PROFILE,
  costs: [],
  services: [],
  history: [],
  professional: DEFAULT_PROFESSIONAL,
  goal: DEFAULT_GOAL,
  onboardingCompleted: false,
};

function sanitizeNumber(value: unknown, fallback: number, min = -Infinity, max = Infinity): number {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}

function sanitizeCostCategory(value: unknown): CostCategory {
  return (COST_CATEGORIES as readonly string[]).includes(String(value))
    ? (value as CostCategory)
    : 'Outros';
}

function sanitizeServiceCategory(value: unknown): ServiceCategory {
  return (SERVICE_CATEGORIES as readonly string[]).includes(String(value))
    ? (value as ServiceCategory)
    : 'Outros';
}

function sanitizeStatePayload(raw: Partial<AppState>, fallbackTheme: ThemeMode = 'light'): AppState {
  const rawProfile = raw.profile ?? ({} as Partial<FinancialProfile>);
  const rawProfessional = raw.professional ?? ({} as Partial<ProfessionalSettings>);
  const rawGoal = raw.goal ?? ({} as Partial<GoalSettings>);

  const costs: MonthlyCost[] = Array.isArray(raw.costs)
    ? raw.costs
        .filter((c) => c && typeof c === 'object' && typeof c.nome === 'string')
        .map((c) => ({
          id: typeof c.id === 'string' && c.id ? c.id : generateId('cost'),
          nome: c.nome.trim().slice(0, 120) || 'Despesa',
          categoria: sanitizeCostCategory(c.categoria),
          valor: sanitizeNumber(c.valor, 0, 0),
          observacao: typeof c.observacao === 'string' ? c.observacao.slice(0, 240) : undefined,
          isDemo: Boolean(c.isDemo),
          createdAt: typeof c.createdAt === 'string' ? c.createdAt : new Date().toISOString(),
        }))
    : [];

  const services: ServiceItem[] = Array.isArray(raw.services)
    ? raw.services
        .filter((s) => s && typeof s === 'object' && typeof s.nome === 'string')
        .map((s) => ({
          id: typeof s.id === 'string' && s.id ? s.id : generateId('srv'),
          nome: s.nome.trim().slice(0, 140) || 'Serviço',
          categoria: sanitizeServiceCategory(s.categoria),
          descricao: typeof s.descricao === 'string' ? s.descricao.slice(0, 1000) : '',
          tempoEstimado: sanitizeNumber(s.tempoEstimado, 1, 0.1),
          custoAdicional: sanitizeNumber(s.custoAdicional, 0, 0),
          precoRecomendado: sanitizeNumber(s.precoRecomendado, 0, 0),
          margemLucro: sanitizeNumber(s.margemLucro, DEFAULT_PROFILE.margemLucroPadrao, 0, 99),
          impostosTaxas: sanitizeNumber(s.impostosTaxas, DEFAULT_PROFILE.impostosTaxasPadrao, 0, 99),
          isDemo: Boolean(s.isDemo),
          createdAt: typeof s.createdAt === 'string' ? s.createdAt : new Date().toISOString(),
          updatedAt: typeof s.updatedAt === 'string' ? s.updatedAt : new Date().toISOString(),
        }))
    : [];

  const history: CalculationHistoryItem[] = Array.isArray(raw.history)
    ? raw.history
        .filter(
          (h) =>
            h &&
            typeof h === 'object' &&
            typeof h.serviceName === 'string' &&
            h.inputs &&
            h.result
        )
        .map((h) => ({
          id: typeof h.id === 'string' && h.id ? h.id : generateId('calc'),
          data: typeof h.data === 'string' ? h.data : new Date().toISOString(),
          serviceName: h.serviceName.trim().slice(0, 140) || 'Cálculo',
          categoria: sanitizeServiceCategory(h.categoria),
          descricao: typeof h.descricao === 'string' ? h.descricao.slice(0, 1000) : '',
          inputs: h.inputs,
          result: h.result,
          isDemo: Boolean(h.isDemo),
        }))
    : [];

  const mixQuantidades: Record<string, number> = {};
  if (rawGoal.mixQuantidades && typeof rawGoal.mixQuantidades === 'object') {
    for (const [key, qty] of Object.entries(rawGoal.mixQuantidades)) {
      const safeQty = Math.floor(sanitizeNumber(qty, 0, 0, 9999));
      if (safeQty > 0) mixQuantidades[key] = safeQty;
    }
  }

  const hasExistingData =
    costs.length > 0 ||
    services.length > 0 ||
    history.length > 0 ||
    sanitizeNumber(rawProfile.remuneracaoMensal, 0, 0) > 0;

  return {
    theme: raw.theme === 'dark' || raw.theme === 'light' ? raw.theme : fallbackTheme,
    profile: {
      remuneracaoMensal: sanitizeNumber(rawProfile.remuneracaoMensal, DEFAULT_PROFILE.remuneracaoMensal, 0),
      usarCustosMensaisAutomaticos:
        typeof rawProfile.usarCustosMensaisAutomaticos === 'boolean'
          ? rawProfile.usarCustosMensaisAutomaticos
          : DEFAULT_PROFILE.usarCustosMensaisAutomaticos,
      custosFixosManuais: sanitizeNumber(rawProfile.custosFixosManuais, DEFAULT_PROFILE.custosFixosManuais, 0),
      diasTrabalhadosMes: sanitizeNumber(rawProfile.diasTrabalhadosMes, DEFAULT_PROFILE.diasTrabalhadosMes, 1, 31),
      horasProdutivasDia: sanitizeNumber(rawProfile.horasProdutivasDia, DEFAULT_PROFILE.horasProdutivasDia, 0.5, 24),
      percentualFaturavel: sanitizeNumber(rawProfile.percentualFaturavel, DEFAULT_PROFILE.percentualFaturavel, 1, 100),
      margemLucroPadrao: sanitizeNumber(rawProfile.margemLucroPadrao, DEFAULT_PROFILE.margemLucroPadrao, 0, 99),
      impostosTaxasPadrao: sanitizeNumber(rawProfile.impostosTaxasPadrao, DEFAULT_PROFILE.impostosTaxasPadrao, 0, 99),
    },
    costs,
    services,
    history,
    professional: {
      nomeProfissional:
        typeof rawProfessional.nomeProfissional === 'string'
          ? rawProfessional.nomeProfissional
          : DEFAULT_PROFESSIONAL.nomeProfissional,
      especialidade:
        typeof rawProfessional.especialidade === 'string'
          ? rawProfessional.especialidade
          : DEFAULT_PROFESSIONAL.especialidade,
      email: typeof rawProfessional.email === 'string' ? rawProfessional.email : DEFAULT_PROFESSIONAL.email,
      telefone:
        typeof rawProfessional.telefone === 'string' ? rawProfessional.telefone : DEFAULT_PROFESSIONAL.telefone,
      documento:
        typeof rawProfessional.documento === 'string' ? rawProfessional.documento : DEFAULT_PROFESSIONAL.documento,
      cidade: typeof rawProfessional.cidade === 'string' ? rawProfessional.cidade : DEFAULT_PROFESSIONAL.cidade,
      validadePadraoDias: Math.round(
        sanitizeNumber(rawProfessional.validadePadraoDias, DEFAULT_PROFESSIONAL.validadePadraoDias, 1, 365)
      ),
      observacoesPadrao:
        typeof rawProfessional.observacoesPadrao === 'string'
          ? rawProfessional.observacoesPadrao
          : DEFAULT_PROFESSIONAL.observacoesPadrao,
    },
    goal: {
      metaFaturamentoMensal: sanitizeNumber(rawGoal.metaFaturamentoMensal, 0, 0),
      mixQuantidades,
    },
    onboardingCompleted:
      typeof raw.onboardingCompleted === 'boolean' ? raw.onboardingCompleted : hasExistingData,
  };
}

function loadInitialState(): AppState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return sanitizeStatePayload(parsed);
  } catch {
    return DEFAULT_STATE;
  }
}

export interface CalculatorPrefill {
  step: 1 | 2 | 3;
  service: ServiceFormInput;
  profileOverride?: Partial<FinancialProfile>;
}

interface AppContextValue {
  state: AppState;
  activePage: PageId;
  setActivePage: (page: PageId) => void;
  totalMonthlyCosts: number;
  hasDemoData: boolean;
  toasts: ToastMessage[];
  notify: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  updateProfile: (patch: Partial<FinancialProfile>) => void;
  updateProfessional: (patch: Partial<ProfessionalSettings>) => void;
  updateGoal: (patch: Partial<GoalSettings>) => void;
  addCost: (cost: Omit<MonthlyCost, 'id' | 'createdAt'>) => void;
  updateCost: (id: string, patch: Partial<Omit<MonthlyCost, 'id' | 'createdAt'>>) => void;
  deleteCost: (id: string) => void;
  addService: (service: Omit<ServiceItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateService: (id: string, patch: Partial<Omit<ServiceItem, 'id' | 'createdAt'>>) => void;
  deleteService: (id: string) => void;
  addHistoryItem: (item: Omit<CalculationHistoryItem, 'id'>) => CalculationHistoryItem;
  duplicateHistoryItem: (id: string) => void;
  deleteHistoryItem: (id: string) => void;
  loadDemoData: () => void;
  clearDemoData: () => void;
  resetAllData: () => void;
  createBackupJson: () => string;
  importBackup: (json: string) => boolean;
  quoteModalDraft: QuoteDraft | null;
  openQuoteModal: (draft: QuoteDraft) => void;
  closeQuoteModal: () => void;
  calculatorPrefill: CalculatorPrefill | null;
  openCalculatorWithPrefill: (prefill: CalculatorPrefill) => void;
  clearCalculatorPrefill: () => void;
  onboardingOpen: boolean;
  openOnboarding: () => void;
  completeOnboarding: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => loadInitialState());
  const [activePage, setActivePage] = useState<PageId>('overview');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [quoteModalDraft, setQuoteModalDraft] = useState<QuoteDraft | null>(null);
  const [calculatorPrefill, setCalculatorPrefill] = useState<CalculatorPrefill | null>(null);
  const [onboardingOpen, setOnboardingOpen] = useState<boolean>(() => {
    const initial = loadInitialState();
    return !initial.onboardingCompleted;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors gracefully
    }
  }, [state]);

  useEffect(() => {
    const root = document.documentElement;
    if (state.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [state.theme]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = generateId('toast');
    setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const totalMonthlyCosts = useMemo(
    () => state.costs.reduce((sum, item) => sum + (Number.isFinite(item.valor) ? item.valor : 0), 0),
    [state.costs]
  );

  const hasDemoData = useMemo(
    () =>
      state.costs.some((c) => c.isDemo) ||
      state.services.some((s) => s.isDemo) ||
      state.history.some((h) => h.isDemo),
    [state.costs, state.services, state.history]
  );

  const setTheme = useCallback((theme: ThemeMode) => {
    setState((prev) => ({ ...prev, theme }));
  }, []);

  const toggleTheme = useCallback(() => {
    setState((prev) => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  }, []);

  const updateProfile = useCallback((patch: Partial<FinancialProfile>) => {
    setState((prev) => ({
      ...prev,
      profile: { ...prev.profile, ...patch },
    }));
  }, []);

  const updateProfessional = useCallback((patch: Partial<ProfessionalSettings>) => {
    setState((prev) => ({
      ...prev,
      professional: { ...prev.professional, ...patch },
    }));
  }, []);

  const updateGoal = useCallback((patch: Partial<GoalSettings>) => {
    setState((prev) => ({
      ...prev,
      goal: { ...prev.goal, ...patch },
    }));
  }, []);

  const addCost = useCallback(
    (cost: Omit<MonthlyCost, 'id' | 'createdAt'>) => {
      const next: MonthlyCost = {
        ...cost,
        id: generateId('cost'),
        createdAt: new Date().toISOString(),
        isDemo: false,
      };
      setState((prev) => ({ ...prev, costs: [next, ...prev.costs] }));
      notify({
        type: 'success',
        title: 'Despesa cadastrada',
        description: `"${next.nome}" já está incluída no seu total mensal.`,
      });
    },
    [notify]
  );

  const updateCost = useCallback(
    (id: string, patch: Partial<Omit<MonthlyCost, 'id' | 'createdAt'>>) => {
      setState((prev) => ({
        ...prev,
        costs: prev.costs.map((c) => (c.id === id ? { ...c, ...patch, isDemo: false } : c)),
      }));
      notify({
        type: 'success',
        title: 'Despesa atualizada',
        description: 'Os valores foram recalculados automaticamente.',
      });
    },
    [notify]
  );

  const deleteCost = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        costs: prev.costs.filter((c) => c.id !== id),
      }));
      notify({
        type: 'info',
        title: 'Despesa removida',
        description: 'O custo operacional mensal foi atualizado.',
      });
    },
    [notify]
  );

  const addService = useCallback(
    (service: Omit<ServiceItem, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString();
      const next: ServiceItem = {
        ...service,
        id: generateId('srv'),
        createdAt: now,
        updatedAt: now,
        isDemo: false,
      };
      setState((prev) => ({ ...prev, services: [next, ...prev.services] }));
      notify({
        type: 'success',
        title: 'Serviço cadastrado',
        description: `"${next.nome}" foi salvo em Meus serviços.`,
      });
    },
    [notify]
  );

  const updateService = useCallback(
    (id: string, patch: Partial<Omit<ServiceItem, 'id' | 'createdAt'>>) => {
      const now = new Date().toISOString();
      setState((prev) => ({
        ...prev,
        services: prev.services.map((s) =>
          s.id === id ? { ...s, ...patch, updatedAt: now, isDemo: false } : s
        ),
      }));
      notify({
        type: 'success',
        title: 'Serviço atualizado',
        description: 'As alterações foram salvas com sucesso.',
      });
    },
    [notify]
  );

  const deleteService = useCallback(
    (id: string) => {
      setState((prev) => {
        const nextMix = { ...prev.goal.mixQuantidades };
        delete nextMix[id];
        return {
          ...prev,
          services: prev.services.filter((s) => s.id !== id),
          goal: { ...prev.goal, mixQuantidades: nextMix },
        };
      });
      notify({
        type: 'info',
        title: 'Serviço excluído',
        description: 'O serviço foi removido do catálogo.',
      });
    },
    [notify]
  );

  const addHistoryItem = useCallback(
    (item: Omit<CalculationHistoryItem, 'id'>): CalculationHistoryItem => {
      const next: CalculationHistoryItem = {
        ...item,
        id: generateId('calc'),
      };
      setState((prev) => ({ ...prev, history: [next, ...prev.history] }));
      notify({
        type: 'success',
        title: 'Cálculo salvo no histórico',
        description: `Precificação de "${next.serviceName}" registrada.`,
      });
      return next;
    },
    [notify]
  );

  const duplicateHistoryItem = useCallback(
    (id: string) => {
      setState((prev) => {
        const source = prev.history.find((h) => h.id === id);
        if (!source) return prev;
        const copy: CalculationHistoryItem = {
          ...source,
          id: generateId('calc'),
          data: new Date().toISOString(),
          serviceName: source.serviceName.endsWith('(Cópia)')
            ? source.serviceName
            : `${source.serviceName} (Cópia)`,
          isDemo: false,
        };
        return { ...prev, history: [copy, ...prev.history] };
      });
      notify({
        type: 'success',
        title: 'Cálculo duplicado',
        description: 'Uma cópia foi criada no topo do histórico.',
      });
    },
    [notify]
  );

  const deleteHistoryItem = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        history: prev.history.filter((h) => h.id !== id),
      }));
      notify({
        type: 'info',
        title: 'Registro removido',
        description: 'O cálculo foi excluído do histórico.',
      });
    },
    [notify]
  );

  const loadDemoData = useCallback(() => {
    const bundle = buildDemoBundle();
    setState((prev) => {
      const nonDemoCosts = prev.costs.filter((c) => !c.isDemo);
      const nonDemoServices = prev.services.filter((s) => !s.isDemo);
      const nonDemoHistory = prev.history.filter((h) => !h.isDemo);

      return {
        ...prev,
        onboardingCompleted: true,
        profile: prev.profile.remuneracaoMensal > 0 ? prev.profile : bundle.profile,
        professional: prev.professional.nomeProfissional.trim()
          ? prev.professional
          : bundle.professional,
        costs: [...nonDemoCosts, ...bundle.costs],
        services: [...nonDemoServices, ...bundle.services],
        history: [...nonDemoHistory, ...bundle.history],
      };
    });
    setOnboardingOpen(false);
    notify({
      type: 'success',
      title: 'Dados demonstrativos carregados',
      description:
        'Despesas, serviços e cálculos de exemplo foram adicionados e marcados como demonstrativos.',
    });
  }, [notify]);

  const clearDemoData = useCallback(() => {
    setState((prev) => {
      const remainingCosts = prev.costs.filter((c) => !c.isDemo);
      const remainingServices = prev.services.filter((s) => !s.isDemo);
      const remainingHistory = prev.history.filter((h) => !h.isDemo);
      const isDefaultDemoProf =
        prev.professional.nomeProfissional === 'Studio Clara Mendes' &&
        prev.professional.email === 'contato@studioclaramendes.com.br';
      const isDefaultDemoProfile =
        remainingCosts.length === 0 &&
        remainingServices.length === 0 &&
        remainingHistory.length === 0 &&
        prev.profile.remuneracaoMensal === 5500;

      const remainingServiceIds = new Set(remainingServices.map((s) => s.id));
      const cleanedMix: Record<string, number> = {};
      for (const [k, v] of Object.entries(prev.goal.mixQuantidades)) {
        if (remainingServiceIds.has(k)) cleanedMix[k] = v;
      }

      return {
        ...prev,
        costs: remainingCosts,
        services: remainingServices,
        history: remainingHistory,
        professional: isDefaultDemoProf ? DEFAULT_PROFESSIONAL : prev.professional,
        profile: isDefaultDemoProfile ? DEFAULT_PROFILE : prev.profile,
        goal: { ...prev.goal, mixQuantidades: cleanedMix },
      };
    });
    notify({
      type: 'info',
      title: 'Dados demonstrativos removidos',
      description: 'Todos os registros de exemplo foram apagados. Seus dados próprios foram preservados.',
    });
  }, [notify]);

  const resetAllData = useCallback(() => {
    setState((prev) => ({
      ...DEFAULT_STATE,
      theme: prev.theme,
      onboardingCompleted: true,
    }));
    notify({
      type: 'info',
      title: 'Dados redefinidos',
      description: 'O aplicativo foi restaurado para o estado inicial.',
    });
  }, [notify]);

  const createBackupJson = useCallback(() => {
    const payload = {
      app: 'preco-justo',
      schemaVersion: BACKUP_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      data: state,
    };
    return JSON.stringify(payload, null, 2);
  }, [state]);

  const importBackup = useCallback(
    (json: string): boolean => {
      try {
        const parsed = JSON.parse(json) as
          | { app?: string; schemaVersion?: number; data?: Partial<AppState> }
          | Partial<AppState>;

        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Formato inválido');
        }

        const candidateData: Partial<AppState> =
          'data' in parsed && parsed.data && typeof parsed.data === 'object'
            ? parsed.data
            : (parsed as Partial<AppState>);

        const hasRecognizedKeys =
          'profile' in candidateData ||
          'costs' in candidateData ||
          'services' in candidateData ||
          'history' in candidateData ||
          'professional' in candidateData;

        if (!hasRecognizedKeys) {
          throw new Error('Estrutura de backup não reconhecida');
        }

        const restored = sanitizeStatePayload(candidateData, state.theme);
        setState(restored);
        setOnboardingOpen(false);
        notify({
          type: 'success',
          title: 'Backup restaurado com sucesso',
          description: `${restored.costs.length} despesas, ${restored.services.length} serviços e ${restored.history.length} cálculos importados.`,
        });
        return true;
      } catch {
        notify({
          type: 'error',
          title: 'Erro ao importar backup',
          description: 'O arquivo selecionado não é um backup JSON válido do Preço Justo.',
        });
        return false;
      }
    },
    [notify, state.theme]
  );

  const openQuoteModal = useCallback((draft: QuoteDraft) => {
    setQuoteModalDraft(draft);
  }, []);

  const closeQuoteModal = useCallback(() => {
    setQuoteModalDraft(null);
  }, []);

  const openCalculatorWithPrefill = useCallback((prefill: CalculatorPrefill) => {
    setCalculatorPrefill(prefill);
    setActivePage('calculator');
  }, []);

  const clearCalculatorPrefill = useCallback(() => {
    setCalculatorPrefill(null);
  }, []);

  const openOnboarding = useCallback(() => {
    setOnboardingOpen(true);
  }, []);

  const completeOnboarding = useCallback(() => {
    setOnboardingOpen(false);
    setState((prev) =>
      prev.onboardingCompleted ? prev : { ...prev, onboardingCompleted: true }
    );
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      activePage,
      setActivePage,
      totalMonthlyCosts,
      hasDemoData,
      toasts,
      notify,
      dismissToast,
      toggleTheme,
      setTheme,
      updateProfile,
      updateProfessional,
      updateGoal,
      addCost,
      updateCost,
      deleteCost,
      addService,
      updateService,
      deleteService,
      addHistoryItem,
      duplicateHistoryItem,
      deleteHistoryItem,
      loadDemoData,
      clearDemoData,
      resetAllData,
      createBackupJson,
      importBackup,
      quoteModalDraft,
      openQuoteModal,
      closeQuoteModal,
      calculatorPrefill,
      openCalculatorWithPrefill,
      clearCalculatorPrefill,
      onboardingOpen,
      openOnboarding,
      completeOnboarding,
    }),
    [
      state,
      activePage,
      totalMonthlyCosts,
      hasDemoData,
      toasts,
      notify,
      dismissToast,
      toggleTheme,
      setTheme,
      updateProfile,
      updateProfessional,
      updateGoal,
      addCost,
      updateCost,
      deleteCost,
      addService,
      updateService,
      deleteService,
      addHistoryItem,
      duplicateHistoryItem,
      deleteHistoryItem,
      loadDemoData,
      clearDemoData,
      resetAllData,
      createBackupJson,
      importBackup,
      quoteModalDraft,
      openQuoteModal,
      closeQuoteModal,
      calculatorPrefill,
      openCalculatorWithPrefill,
      clearCalculatorPrefill,
      onboardingOpen,
      openOnboarding,
      completeOnboarding,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp deve ser utilizado dentro de AppProvider');
  }
  return ctx;
}
