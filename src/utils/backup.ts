import {
  AppState,
  COST_CATEGORIES,
  CalculationHistoryItem,
  CostCategory,
  FinancialProfile,
  GoalSettings,
  MonthlyCost,
  PricingCalculationInput,
  PricingCalculationResult,
  ProfessionalSettings,
  SERVICE_CATEGORIES,
  ServiceCategory,
  ServiceItem,
  ThemeMode,
} from '../types';
import { generateId } from './format';

export const BACKUP_SCHEMA_VERSION = 2;

export const DEFAULT_PROFILE: FinancialProfile = {
  remuneracaoMensal: 0,
  usarCustosMensaisAutomaticos: true,
  custosFixosManuais: 0,
  diasTrabalhadosMes: 20,
  horasProdutivasDia: 6,
  percentualFaturavel: 70,
  margemLucroPadrao: 25,
  impostosTaxasPadrao: 6,
};

export const DEFAULT_PROFESSIONAL: ProfessionalSettings = {
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

export const DEFAULT_GOAL: GoalSettings = {
  metaFaturamentoMensal: 0,
  mixQuantidades: {},
};

export const DEFAULT_STATE: AppState = {
  theme: 'light',
  profile: DEFAULT_PROFILE,
  costs: [],
  services: [],
  history: [],
  professional: DEFAULT_PROFESSIONAL,
  goal: DEFAULT_GOAL,
  onboardingCompleted: false,
};

export interface BackupPreviewSummary {
  costsCount: number;
  servicesCount: number;
  historyCount: number;
  hasProfile: boolean;
  exportedAt?: string;
}

export type BackupParseResult =
  | { ok: true; state: AppState; summary: BackupPreviewSummary }
  | { ok: false; error: string };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function sanitizeNumber(value: unknown, fallback: number, min = -Infinity, max = Infinity): number {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}

function sanitizePercentagePair(
  rawMargin: unknown,
  rawTax: unknown,
  fallbackMargin: number,
  fallbackTax: number
): { margin: number; tax: number } {
  const margin = sanitizeNumber(rawMargin, fallbackMargin, 0, 99.9);
  const tax = sanitizeNumber(rawTax, fallbackTax, 0, 99.9);
  if (margin + tax >= 100) {
    const safeTax = Math.min(tax, 99);
    const safeMargin = Math.max(0, Number((99 - safeTax).toFixed(2)));
    return { margin: safeMargin, tax: safeTax };
  }
  return { margin, tax };
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

function sanitizeHistoryInputs(raw: unknown): PricingCalculationInput | null {
  if (!isPlainObject(raw)) return null;

  const remuneracaoMensal = Number(raw.remuneracaoMensal);
  const custosFixosMensais = Number(raw.custosFixosMensais);
  const diasTrabalhadosMes = Number(raw.diasTrabalhadosMes);
  const horasProdutivasDia = Number(raw.horasProdutivasDia);
  const percentualFaturavel = Number(raw.percentualFaturavel);
  const horasNecessarias = Number(raw.horasNecessarias);
  const custosAdicionais = Number(raw.custosAdicionais);
  const margemLucro = Number(raw.margemLucro);
  const impostosTaxas = Number(raw.impostosTaxas);

  if (
    !Number.isFinite(remuneracaoMensal) ||
    remuneracaoMensal < 0 ||
    !Number.isFinite(custosFixosMensais) ||
    custosFixosMensais < 0 ||
    !Number.isFinite(diasTrabalhadosMes) ||
    diasTrabalhadosMes <= 0 ||
    diasTrabalhadosMes > 31 ||
    !Number.isFinite(horasProdutivasDia) ||
    horasProdutivasDia <= 0 ||
    horasProdutivasDia > 24 ||
    !Number.isFinite(percentualFaturavel) ||
    percentualFaturavel <= 0 ||
    percentualFaturavel > 100 ||
    !Number.isFinite(horasNecessarias) ||
    horasNecessarias <= 0 ||
    !Number.isFinite(custosAdicionais) ||
    custosAdicionais < 0 ||
    !Number.isFinite(margemLucro) ||
    margemLucro < 0 ||
    !Number.isFinite(impostosTaxas) ||
    impostosTaxas < 0 ||
    margemLucro + impostosTaxas >= 100
  ) {
    return null;
  }

  return {
    remuneracaoMensal,
    custosFixosMensais,
    diasTrabalhadosMes,
    horasProdutivasDia,
    percentualFaturavel,
    horasNecessarias,
    custosAdicionais,
    margemLucro,
    impostosTaxas,
  };
}

function sanitizeHistoryResult(raw: unknown): PricingCalculationResult | null {
  if (!isPlainObject(raw)) return null;

  const horasFaturaveisMensais = Number(raw.horasFaturaveisMensais);
  const custoHora = Number(raw.custoHora);
  const custoMaoDeObra = Number(raw.custoMaoDeObra);
  const custoServico = Number(raw.custoServico);
  const precoMinimo = Number(raw.precoMinimo);
  const precoRecomendado = Number(raw.precoRecomendado);
  const valorImpostosTaxas = Number(raw.valorImpostosTaxas);
  const lucroLiquidoEstimado = Number(raw.lucroLiquidoEstimado);
  const margemEfetiva = Number(raw.margemEfetiva);
  const faturamentoMensalAlvo = Number(raw.faturamentoMensalAlvo);

  if (
    !Number.isFinite(horasFaturaveisMensais) ||
    horasFaturaveisMensais <= 0 ||
    !Number.isFinite(custoHora) ||
    custoHora < 0 ||
    !Number.isFinite(custoMaoDeObra) ||
    custoMaoDeObra < 0 ||
    !Number.isFinite(custoServico) ||
    custoServico < 0 ||
    !Number.isFinite(precoMinimo) ||
    precoMinimo < 0 ||
    !Number.isFinite(precoRecomendado) ||
    precoRecomendado < 0 ||
    !Number.isFinite(valorImpostosTaxas) ||
    valorImpostosTaxas < 0 ||
    !Number.isFinite(lucroLiquidoEstimado) ||
    !Number.isFinite(margemEfetiva) ||
    !Number.isFinite(faturamentoMensalAlvo) ||
    faturamentoMensalAlvo < 0
  ) {
    return null;
  }

  return {
    horasFaturaveisMensais,
    custoHora,
    custoMaoDeObra,
    custoServico,
    precoMinimo,
    precoRecomendado,
    valorImpostosTaxas,
    lucroLiquidoEstimado,
    margemEfetiva,
    faturamentoMensalAlvo,
  };
}

export function sanitizeStatePayload(
  raw: Partial<AppState>,
  fallbackTheme: ThemeMode = 'light'
): AppState {
  const rawProfile = isPlainObject(raw.profile)
    ? (raw.profile as Partial<FinancialProfile>)
    : ({} as Partial<FinancialProfile>);
  const rawProfessional = isPlainObject(raw.professional)
    ? (raw.professional as Partial<ProfessionalSettings>)
    : ({} as Partial<ProfessionalSettings>);
  const rawGoal = isPlainObject(raw.goal)
    ? (raw.goal as Partial<GoalSettings>)
    : ({} as Partial<GoalSettings>);

  const costs: MonthlyCost[] = Array.isArray(raw.costs)
    ? raw.costs
        .filter((c) => isPlainObject(c) && typeof c.nome === 'string')
        .map((c) => ({
          id: typeof c.id === 'string' && c.id ? c.id : generateId('cost'),
          nome: String(c.nome).trim().slice(0, 120) || 'Despesa',
          categoria: sanitizeCostCategory(c.categoria),
          valor: sanitizeNumber(c.valor, 0, 0),
          observacao: typeof c.observacao === 'string' ? c.observacao.slice(0, 240) : undefined,
          isDemo: Boolean(c.isDemo),
          createdAt: typeof c.createdAt === 'string' ? c.createdAt : new Date().toISOString(),
        }))
    : [];

  const profilePair = sanitizePercentagePair(
    rawProfile.margemLucroPadrao,
    rawProfile.impostosTaxasPadrao,
    DEFAULT_PROFILE.margemLucroPadrao,
    DEFAULT_PROFILE.impostosTaxasPadrao
  );

  const services: ServiceItem[] = Array.isArray(raw.services)
    ? raw.services
        .filter((s) => isPlainObject(s) && typeof s.nome === 'string')
        .map((s) => {
          const srvPair = sanitizePercentagePair(
            s.margemLucro,
            s.impostosTaxas,
            profilePair.margin,
            profilePair.tax
          );
          return {
            id: typeof s.id === 'string' && s.id ? s.id : generateId('srv'),
            nome: String(s.nome).trim().slice(0, 140) || 'Serviço',
            categoria: sanitizeServiceCategory(s.categoria),
            descricao: typeof s.descricao === 'string' ? s.descricao.slice(0, 1000) : '',
            tempoEstimado: sanitizeNumber(s.tempoEstimado, 1, 0.1),
            custoAdicional: sanitizeNumber(s.custoAdicional, 0, 0),
            precoRecomendado: sanitizeNumber(s.precoRecomendado, 0, 0),
            margemLucro: srvPair.margin,
            impostosTaxas: srvPair.tax,
            isDemo: Boolean(s.isDemo),
            createdAt: typeof s.createdAt === 'string' ? s.createdAt : new Date().toISOString(),
            updatedAt: typeof s.updatedAt === 'string' ? s.updatedAt : new Date().toISOString(),
          };
        })
    : [];

  const history: CalculationHistoryItem[] = [];
  if (Array.isArray(raw.history)) {
    for (const h of raw.history) {
      if (!isPlainObject(h) || typeof h.serviceName !== 'string') continue;
      const safeInputs = sanitizeHistoryInputs(h.inputs);
      const safeResult = sanitizeHistoryResult(h.result);
      if (!safeInputs || !safeResult) continue;
      history.push({
        id: typeof h.id === 'string' && h.id ? h.id : generateId('calc'),
        data: typeof h.data === 'string' ? h.data : new Date().toISOString(),
        serviceName: String(h.serviceName).trim().slice(0, 140) || 'Cálculo',
        categoria: sanitizeServiceCategory(h.categoria),
        descricao: typeof h.descricao === 'string' ? h.descricao.slice(0, 1000) : '',
        inputs: safeInputs,
        result: safeResult,
        isDemo: Boolean(h.isDemo),
      });
    }
  }

  const mixQuantidades: Record<string, number> = {};
  if (isPlainObject(rawGoal.mixQuantidades)) {
    const validServiceIds = new Set(services.map((s) => s.id));
    for (const [key, qty] of Object.entries(rawGoal.mixQuantidades)) {
      const safeQty = Math.floor(sanitizeNumber(qty, 0, 0, 9999));
      if (safeQty > 0 && (validServiceIds.size === 0 || validServiceIds.has(key))) {
        mixQuantidades[key] = safeQty;
      }
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
      remuneracaoMensal: sanitizeNumber(
        rawProfile.remuneracaoMensal,
        DEFAULT_PROFILE.remuneracaoMensal,
        0
      ),
      usarCustosMensaisAutomaticos:
        typeof rawProfile.usarCustosMensaisAutomaticos === 'boolean'
          ? rawProfile.usarCustosMensaisAutomaticos
          : DEFAULT_PROFILE.usarCustosMensaisAutomaticos,
      custosFixosManuais: sanitizeNumber(
        rawProfile.custosFixosManuais,
        DEFAULT_PROFILE.custosFixosManuais,
        0
      ),
      diasTrabalhadosMes: sanitizeNumber(
        rawProfile.diasTrabalhadosMes,
        DEFAULT_PROFILE.diasTrabalhadosMes,
        1,
        31
      ),
      horasProdutivasDia: sanitizeNumber(
        rawProfile.horasProdutivasDia,
        DEFAULT_PROFILE.horasProdutivasDia,
        0.5,
        24
      ),
      percentualFaturavel: sanitizeNumber(
        rawProfile.percentualFaturavel,
        DEFAULT_PROFILE.percentualFaturavel,
        1,
        100
      ),
      margemLucroPadrao: profilePair.margin,
      impostosTaxasPadrao: profilePair.tax,
    },
    costs,
    services,
    history,
    professional: {
      nomeProfissional:
        typeof rawProfessional.nomeProfissional === 'string'
          ? rawProfessional.nomeProfissional.slice(0, 140)
          : DEFAULT_PROFESSIONAL.nomeProfissional,
      especialidade:
        typeof rawProfessional.especialidade === 'string'
          ? rawProfessional.especialidade.slice(0, 140)
          : DEFAULT_PROFESSIONAL.especialidade,
      email:
        typeof rawProfessional.email === 'string'
          ? rawProfessional.email.slice(0, 140)
          : DEFAULT_PROFESSIONAL.email,
      telefone:
        typeof rawProfessional.telefone === 'string'
          ? rawProfessional.telefone.slice(0, 60)
          : DEFAULT_PROFESSIONAL.telefone,
      documento:
        typeof rawProfessional.documento === 'string'
          ? rawProfessional.documento.slice(0, 60)
          : DEFAULT_PROFESSIONAL.documento,
      cidade:
        typeof rawProfessional.cidade === 'string'
          ? rawProfessional.cidade.slice(0, 100)
          : DEFAULT_PROFESSIONAL.cidade,
      validadePadraoDias: Math.round(
        sanitizeNumber(
          rawProfessional.validadePadraoDias,
          DEFAULT_PROFESSIONAL.validadePadraoDias,
          1,
          365
        )
      ),
      observacoesPadrao:
        typeof rawProfessional.observacoesPadrao === 'string'
          ? rawProfessional.observacoesPadrao.slice(0, 1500)
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

export function parseAndValidateBackup(
  json: string,
  fallbackTheme: ThemeMode = 'light'
): BackupParseResult {
  if (!json || !json.trim()) {
    return { ok: false, error: 'O arquivo selecionado está vazio.' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return {
      ok: false,
      error: 'O arquivo não contém um JSON válido. Verifique se você selecionou o arquivo correto.',
    };
  }

  if (!isPlainObject(parsed)) {
    return {
      ok: false,
      error: 'Estrutura de backup inválida: o conteúdo raiz deve ser um objeto JSON.',
    };
  }

  if ('app' in parsed && parsed.app !== 'preco-justo') {
    return {
      ok: false,
      error: 'Este arquivo JSON não pertence ao aplicativo Preço Justo.',
    };
  }

  let candidate: Record<string, unknown>;
  let exportedAt: string | undefined;

  if ('data' in parsed) {
    if (!isPlainObject(parsed.data)) {
      return {
        ok: false,
        error: 'O campo "data" do arquivo de backup está ausente ou corrompido.',
      };
    }
    candidate = parsed.data;
    if (typeof parsed.exportedAt === 'string') {
      exportedAt = parsed.exportedAt;
    }
  } else {
    candidate = parsed;
  }

  const recognizedKeys = ['profile', 'costs', 'services', 'history', 'professional', 'goal'];
  const presentKeys = recognizedKeys.filter((k) => k in candidate);

  if (presentKeys.length === 0) {
    return {
      ok: false,
      error: 'Estrutura de backup do Preço Justo não reconhecida neste arquivo.',
    };
  }

  // Strict structural type checks before accepting the payload
  if ('profile' in candidate && !isPlainObject(candidate.profile)) {
    return { ok: false, error: 'O bloco "profile" do backup possui formato inválido.' };
  }
  if ('professional' in candidate && !isPlainObject(candidate.professional)) {
    return { ok: false, error: 'O bloco "professional" do backup possui formato inválido.' };
  }
  if ('goal' in candidate && !isPlainObject(candidate.goal)) {
    return { ok: false, error: 'O bloco "goal" do backup possui formato inválido.' };
  }
  if ('costs' in candidate && !Array.isArray(candidate.costs)) {
    return { ok: false, error: 'A lista de despesas ("costs") do backup possui formato inválido.' };
  }
  if ('services' in candidate && !Array.isArray(candidate.services)) {
    return {
      ok: false,
      error: 'A lista de serviços ("services") do backup possui formato inválido.',
    };
  }
  if ('history' in candidate && !Array.isArray(candidate.history)) {
    return {
      ok: false,
      error: 'A lista de histórico ("history") do backup possui formato inválido.',
    };
  }

  // Require at least 2 domain keys OR explicit app === 'preco-justo' to avoid foreign JSONs overwriting data
  if (parsed.app !== 'preco-justo' && presentKeys.length < 2) {
    return {
      ok: false,
      error:
        'Arquivo incompatível: use um backup exportado pelo Preço Justo para evitar perda de dados.',
    };
  }

  const restored = sanitizeStatePayload(candidate as Partial<AppState>, fallbackTheme);

  return {
    ok: true,
    state: { ...restored, onboardingCompleted: true },
    summary: {
      costsCount: restored.costs.length,
      servicesCount: restored.services.length,
      historyCount: restored.history.length,
      hasProfile: restored.profile.remuneracaoMensal > 0,
      exportedAt,
    },
  };
}
