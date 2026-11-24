export type PageId =
  | 'overview'
  | 'calculator'
  | 'goals'
  | 'services'
  | 'costs'
  | 'history'
  | 'settings';

export type ThemeMode = 'light' | 'dark';

export const COST_CATEGORIES = [
  'Internet',
  'Energia elétrica',
  'Softwares e assinaturas',
  'Equipamentos',
  'Transporte',
  'Aluguel',
  'Contabilidade',
  'Outros',
] as const;

export type CostCategory = (typeof COST_CATEGORIES)[number];

export const SERVICE_CATEGORIES = [
  'Design',
  'Desenvolvimento',
  'Vídeo e Áudio',
  'Redes Sociais',
  'Marketing',
  'Consultoria',
  'Redação',
  'Fotografia',
  'Outros',
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

export interface FinancialProfile {
  remuneracaoMensal: number;
  usarCustosMensaisAutomaticos: boolean;
  custosFixosManuais: number;
  diasTrabalhadosMes: number;
  horasProdutivasDia: number;
  percentualFaturavel: number;
  margemLucroPadrao: number;
  impostosTaxasPadrao: number;
}

export interface ServiceFormInput {
  nome: string;
  categoria: ServiceCategory;
  descricao: string;
  horasNecessarias: number;
  custosAdicionais: number;
  margemLucro: number;
  impostosTaxas: number;
}

export interface PricingCalculationInput {
  remuneracaoMensal: number;
  custosFixosMensais: number;
  diasTrabalhadosMes: number;
  horasProdutivasDia: number;
  percentualFaturavel: number;
  horasNecessarias: number;
  custosAdicionais: number;
  margemLucro: number;
  impostosTaxas: number;
}

export interface PricingCalculationResult {
  horasFaturaveisMensais: number;
  custoHora: number;
  custoMaoDeObra: number;
  custoServico: number;
  precoMinimo: number;
  precoRecomendado: number;
  valorImpostosTaxas: number;
  lucroLiquidoEstimado: number;
  margemEfetiva: number;
  faturamentoMensalAlvo: number;
}

export type PriceDiagnosisStatus = 'loss' | 'breakeven' | 'below_recommended' | 'healthy';

export interface PriceDiagnosisResult {
  precoAtual: number;
  diferencaMonetaria: number;
  diferencaPercentual: number;
  impostosAtuais: number;
  lucroLiquidoAtual: number;
  margemRealAtual: number;
  faltaParaEmpate: number;
  faltaParaRecomendado: number;
  status: PriceDiagnosisStatus;
}

export interface NegotiationSimulationResult {
  descontoPercentual: number;
  valorDesconto: number;
  precoComDesconto: number;
  impostosComDesconto: number;
  lucroLiquidoComDesconto: number;
  margemEfetivaComDesconto: number;
  descontoMaximoSemPrejuizoPercent: number;
  descontoMaximoSemPrejuizoReais: number;
  geraPrejuizo: boolean;
  noLimiteSemLucro: boolean;
}

export interface GoalSettings {
  metaFaturamentoMensal: number;
  mixQuantidades: Record<string, number>;
}

export interface MonthlyCost {
  id: string;
  nome: string;
  categoria: CostCategory;
  valor: number;
  observacao?: string;
  isDemo?: boolean;
  createdAt: string;
}

export interface ServiceItem {
  id: string;
  nome: string;
  categoria: ServiceCategory;
  descricao: string;
  tempoEstimado: number;
  custoAdicional: number;
  precoRecomendado: number;
  margemLucro: number;
  impostosTaxas: number;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CalculationHistoryItem {
  id: string;
  data: string;
  serviceName: string;
  categoria: ServiceCategory;
  descricao: string;
  inputs: PricingCalculationInput;
  result: PricingCalculationResult;
  isDemo?: boolean;
}

export interface ProfessionalSettings {
  nomeProfissional: string;
  especialidade: string;
  email: string;
  telefone: string;
  documento: string;
  cidade: string;
  validadePadraoDias: number;
  observacoesPadrao: string;
}

export interface QuoteDraft {
  nomeServico: string;
  descricao: string;
  valorFinal: number;
  nomeCliente?: string;
  prazoEntrega?: string;
  observacoes?: string;
}

export type RecommendationSeverity = 'critical' | 'warning' | 'opportunity' | 'healthy';

export interface SmartRecommendation {
  id: string;
  severity: RecommendationSeverity;
  title: string;
  description: string;
  metricLabel?: string;
  actionLabel?: string;
  actionPage?: PageId;
}

export interface AppState {
  theme: ThemeMode;
  profile: FinancialProfile;
  costs: MonthlyCost[];
  services: ServiceItem[];
  history: CalculationHistoryItem[];
  professional: ProfessionalSettings;
  goal: GoalSettings;
  onboardingCompleted: boolean;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}
