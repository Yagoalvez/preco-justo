import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AppState,
  CalculationHistoryItem,
  FinancialProfile,
  GoalSettings,
  MonthlyCost,
  PageId,
  ProfessionalSettings,
  QuoteDraft,
  ServiceFormInput,
  ServiceItem,
  ThemeMode,
  ToastMessage,
} from '../types';
import { buildDemoBundle, DEMO_GOAL } from '../data/demoData';
import { generateId } from '../utils/format';
import {
  BACKUP_SCHEMA_VERSION,
  BackupParseResult,
  DEFAULT_GOAL,
  DEFAULT_PROFESSIONAL,
  DEFAULT_PROFILE,
  DEFAULT_STATE,
  parseAndValidateBackup,
  sanitizeStatePayload,
} from '../utils/backup';

const STORAGE_KEY = 'preco_justo_app_state_v1';

interface InitialLoadResult {
  state: AppState;
  storageWarning: string | null;
}

function loadInitialState(): InitialLoadResult {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { state: DEFAULT_STATE, storageWarning: null };
    }
    try {
      const parsed = JSON.parse(raw) as Partial<AppState>;
      return { state: sanitizeStatePayload(parsed), storageWarning: null };
    } catch {
      return {
        state: DEFAULT_STATE,
        storageWarning:
          'Os dados salvos anteriormente no navegador estavam corrompidos e o aplicativo foi restaurado para o estado inicial. Se possuir um backup JSON, importe-o em Configurações.',
      };
    }
  } catch {
    return {
      state: DEFAULT_STATE,
      storageWarning:
        'O armazenamento local do navegador (LocalStorage) está indisponível ou bloqueado. Suas alterações podem não ser mantidas ao fechar a aba — exporte backups JSON em Configurações.',
    };
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
  storageWarning: string | null;
  dismissStorageWarning: () => void;
  toasts: ToastMessage[];
  notify: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
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
  previewBackup: (json: string) => BackupParseResult;
  applyBackupState: (restored: AppState) => void;
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
  const initialRef = useRef<InitialLoadResult | null>(null);
  if (initialRef.current === null) {
    initialRef.current = loadInitialState();
  }

  const [state, setState] = useState<AppState>(() => initialRef.current!.state);
  const [storageWarning, setStorageWarning] = useState<string | null>(
    () => initialRef.current!.storageWarning
  );
  const [activePage, setActivePage] = useState<PageId>('overview');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [quoteModalDraft, setQuoteModalDraft] = useState<QuoteDraft | null>(null);
  const [calculatorPrefill, setCalculatorPrefill] = useState<CalculatorPrefill | null>(null);
  const [onboardingOpen, setOnboardingOpen] = useState<boolean>(
    () => !initialRef.current!.state.onboardingCompleted
  );

  const writeFailedRef = useRef<boolean>(false);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const notify = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = generateId('toast');
    setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const dismissStorageWarning = useCallback(() => {
    setStorageWarning(null);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      if (writeFailedRef.current) {
        writeFailedRef.current = false;
        setStorageWarning(null);
      }
    } catch (err) {
      const isQuota =
        err instanceof DOMException &&
        (err.name === 'QuotaExceededError' || err.code === 22 || err.code === 1014);
      const message = isQuota
        ? 'O espaço de armazenamento local (LocalStorage) atingiu o limite. Exporte um backup JSON e remova itens antigos do histórico.'
        : 'Não foi possível salvar no armazenamento local do navegador (LocalStorage bloqueado ou indisponível). Exporte um backup JSON para não perder seus dados.';
      setStorageWarning(message);
      if (!writeFailedRef.current) {
        writeFailedRef.current = true;
        notify({
          type: 'error',
          title: 'Falha ao salvar localmente',
          description: message,
        });
      }
    }
  }, [state, notify]);

  useEffect(() => {
    const root = document.documentElement;
    if (state.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [state.theme]);

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
        goal:
          prev.goal.metaFaturamentoMensal > 0
            ? prev.goal
            : { ...bundle.goal, mixQuantidades: prev.goal.mixQuantidades },
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
        'Despesas, serviços, meta mensal e cálculos de exemplo foram adicionados e marcados como demonstrativos.',
    });
  }, [notify]);

  const clearDemoData = useCallback(() => {
    setState((prev) => {
      const remainingCosts = prev.costs.filter((c) => !c.isDemo);
      const remainingServices = prev.services.filter((s) => !s.isDemo);
      const remainingHistory = prev.history.filter((h) => !h.isDemo);
      const noUserRecords =
        remainingCosts.length === 0 &&
        remainingServices.length === 0 &&
        remainingHistory.length === 0;
      const isDefaultDemoProf =
        prev.professional.nomeProfissional === 'Studio Clara Mendes' &&
        prev.professional.email === 'contato@studioclaramendes.com.br';
      const isDefaultDemoProfile = noUserRecords && prev.profile.remuneracaoMensal === 5500;
      const isDefaultDemoGoal =
        noUserRecords && prev.goal.metaFaturamentoMensal === DEMO_GOAL.metaFaturamentoMensal;

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
        goal: isDefaultDemoGoal
          ? DEFAULT_GOAL
          : { ...prev.goal, mixQuantidades: cleanedMix },
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

  const previewBackup = useCallback(
    (json: string): BackupParseResult => {
      return parseAndValidateBackup(json, state.theme);
    },
    [state.theme]
  );

  const applyBackupState = useCallback(
    (restored: AppState) => {
      setState(restored);
      setOnboardingOpen(false);
      notify({
        type: 'success',
        title: 'Backup restaurado com sucesso',
        description: `${restored.costs.length} despesas, ${restored.services.length} serviços e ${restored.history.length} cálculos importados.`,
      });
    },
    [notify]
  );

  const importBackup = useCallback(
    (json: string): boolean => {
      const outcome = parseAndValidateBackup(json, state.theme);
      if (!outcome.ok) {
        notify({
          type: 'error',
          title: 'Erro ao importar backup',
          description: outcome.error,
        });
        return false;
      }
      applyBackupState(outcome.state);
      return true;
    },
    [applyBackupState, notify, state.theme]
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
      storageWarning,
      dismissStorageWarning,
      toasts,
      notify,
      dismissToast,
      clearToasts,
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
      previewBackup,
      applyBackupState,
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
      storageWarning,
      dismissStorageWarning,
      toasts,
      notify,
      dismissToast,
      clearToasts,
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
      previewBackup,
      applyBackupState,
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
