import {
  CalculationHistoryItem,
  FinancialProfile,
  GoalSettings,
  MonthlyCost,
  ProfessionalSettings,
  ServiceItem,
} from '../types';
import { calculatePricing } from '../utils/pricing';

export const DEMO_PROFILE: FinancialProfile = {
  remuneracaoMensal: 5500,
  usarCustosMensaisAutomaticos: true,
  custosFixosManuais: 1578.9,
  diasTrabalhadosMes: 20,
  horasProdutivasDia: 6,
  percentualFaturavel: 75,
  margemLucroPadrao: 25,
  impostosTaxasPadrao: 6,
};

export const DEMO_GOAL: GoalSettings = {
  metaFaturamentoMensal: 10300,
  mixQuantidades: {},
};

export const DEMO_PROFESSIONAL: ProfessionalSettings = {
  nomeProfissional: 'Studio Clara Mendes',
  especialidade: 'Design Digital e Soluções Criativas',
  email: 'contato@studioclaramendes.com.br',
  telefone: '(11) 98765-4321',
  documento: 'CNPJ 45.821.390/0001-12',
  cidade: 'São Paulo — SP',
  validadePadraoDias: 15,
  observacoesPadrao:
    'Condições de pagamento: 50% na aprovação da proposta e 50% na entrega final. Inclui até duas rodadas de ajustes dentro do escopo acordado.',
};

export const DEMO_COSTS: MonthlyCost[] = [
  {
    id: 'demo_cost_1',
    nome: 'Internet fibra óptica 500MB',
    categoria: 'Internet',
    valor: 139.9,
    observacao: 'Link dedicado home office',
    isDemo: true,
    createdAt: '2026-10-01T10:00:00.000Z',
  },
  {
    id: 'demo_cost_2',
    nome: 'Energia elétrica (rateio escritório)',
    categoria: 'Energia elétrica',
    valor: 180.0,
    observacao: 'Estimativa proporcional ao uso comercial',
    isDemo: true,
    createdAt: '2026-10-01T10:05:00.000Z',
  },
  {
    id: 'demo_cost_3',
    nome: 'Adobe Creative Cloud + Figma Pro',
    categoria: 'Softwares e assinaturas',
    valor: 345.0,
    observacao: 'Pacote criativo e prototipação',
    isDemo: true,
    createdAt: '2026-10-01T10:10:00.000Z',
  },
  {
    id: 'demo_cost_4',
    nome: 'Reserva para depreciação de notebook e monitor',
    categoria: 'Equipamentos',
    valor: 260.0,
    observacao: 'Fundo de reposição de hardware',
    isDemo: true,
    createdAt: '2026-10-01T10:15:00.000Z',
  },
  {
    id: 'demo_cost_5',
    nome: 'Deslocamento e reuniões com clientes',
    categoria: 'Transporte',
    valor: 165.0,
    observacao: 'Transporte por aplicativo e estacionamento',
    isDemo: true,
    createdAt: '2026-10-01T10:20:00.000Z',
  },
  {
    id: 'demo_cost_6',
    nome: 'Estação de trabalho em coworking (plano flex)',
    categoria: 'Aluguel',
    valor: 290.0,
    observacao: 'Uso semanal para reuniões e gravações',
    isDemo: true,
    createdAt: '2026-10-01T10:25:00.000Z',
  },
  {
    id: 'demo_cost_7',
    nome: 'Assessoria contábil mensal',
    categoria: 'Contabilidade',
    valor: 199.0,
    observacao: 'Emissão de notas fiscais e obrigações',
    isDemo: true,
    createdAt: '2026-10-01T10:30:00.000Z',
  },
];

const DEMO_TOTAL_COSTS = DEMO_COSTS.reduce((acc, item) => acc + item.valor, 0);

interface DemoServiceSeed {
  id: string;
  historyId: string;
  nome: string;
  categoria: ServiceItem['categoria'];
  descricao: string;
  tempoEstimado: number;
  custoAdicional: number;
  margemLucro: number;
  impostosTaxas: number;
  dateISO: string;
}

const DEMO_SEEDS: DemoServiceSeed[] = [
  {
    id: 'demo_srv_1',
    historyId: 'demo_hist_1',
    nome: 'Design de post para Instagram',
    categoria: 'Design',
    descricao:
      'Criação de carrossel estratégico com até 6 lâminas, adaptação para feed e stories, copy visual e arquivos editáveis.',
    tempoEstimado: 3,
    custoAdicional: 25,
    margemLucro: 25,
    impostosTaxas: 6,
    dateISO: '2026-11-18T14:20:00.000Z',
  },
  {
    id: 'demo_srv_2',
    historyId: 'demo_hist_2',
    nome: 'Criação de identidade visual',
    categoria: 'Design',
    descricao:
      'Desenvolvimento completo de marca: logotipo principal e variações, paleta cromática, tipografia, aplicações e manual da marca em PDF.',
    tempoEstimado: 28,
    custoAdicional: 180,
    margemLucro: 30,
    impostosTaxas: 6,
    dateISO: '2026-11-19T16:45:00.000Z',
  },
  {
    id: 'demo_srv_3',
    historyId: 'demo_hist_3',
    nome: 'Edição de vídeo',
    categoria: 'Vídeo e Áudio',
    descricao:
      'Edição dinâmica de vídeo institucional ou Reels/YouTube (até 10 minutos) com tratamento de cor, legendas, trilha sonora licenciada e motion leve.',
    tempoEstimado: 8,
    custoAdicional: 90,
    margemLucro: 25,
    impostosTaxas: 6,
    dateISO: '2026-11-20T11:10:00.000Z',
  },
  {
    id: 'demo_srv_4',
    historyId: 'demo_hist_4',
    nome: 'Desenvolvimento de landing page',
    categoria: 'Desenvolvimento',
    descricao:
      'Projeto completo de página de conversão responsiva, otimizada para SEO e velocidade, integração com formulário/WhatsApp e publicação.',
    tempoEstimado: 24,
    custoAdicional: 150,
    margemLucro: 28,
    impostosTaxas: 6,
    dateISO: '2026-11-21T18:30:00.000Z',
  },
  {
    id: 'demo_srv_5',
    historyId: 'demo_hist_5',
    nome: 'Gestão de redes sociais',
    categoria: 'Redes Sociais',
    descricao:
      'Planejamento mensal de conteúdo (12 publicações), calendário editorial, redação de legendas, agendamento e relatório mensal de desempenho.',
    tempoEstimado: 20,
    custoAdicional: 120,
    margemLucro: 25,
    impostosTaxas: 6,
    dateISO: '2026-11-22T09:50:00.000Z',
  },
];

export function buildDemoBundle(): {
  profile: FinancialProfile;
  professional: ProfessionalSettings;
  goal: GoalSettings;
  costs: MonthlyCost[];
  services: ServiceItem[];
  history: CalculationHistoryItem[];
} {
  const services: ServiceItem[] = [];
  const history: CalculationHistoryItem[] = [];

  for (const seed of DEMO_SEEDS) {
    const inputs = {
      remuneracaoMensal: DEMO_PROFILE.remuneracaoMensal,
      custosFixosMensais: DEMO_TOTAL_COSTS,
      diasTrabalhadosMes: DEMO_PROFILE.diasTrabalhadosMes,
      horasProdutivasDia: DEMO_PROFILE.horasProdutivasDia,
      percentualFaturavel: DEMO_PROFILE.percentualFaturavel,
      horasNecessarias: seed.tempoEstimado,
      custosAdicionais: seed.custoAdicional,
      margemLucro: seed.margemLucro,
      impostosTaxas: seed.impostosTaxas,
    };

    const calc = calculatePricing(inputs);
    if (!calc.ok) continue;

    services.push({
      id: seed.id,
      nome: seed.nome,
      categoria: seed.categoria,
      descricao: seed.descricao,
      tempoEstimado: seed.tempoEstimado,
      custoAdicional: seed.custoAdicional,
      precoRecomendado: Number(calc.data.precoRecomendado.toFixed(2)),
      margemLucro: seed.margemLucro,
      impostosTaxas: seed.impostosTaxas,
      isDemo: true,
      createdAt: seed.dateISO,
      updatedAt: seed.dateISO,
    });

    history.push({
      id: seed.historyId,
      data: seed.dateISO,
      serviceName: seed.nome,
      categoria: seed.categoria,
      descricao: seed.descricao,
      inputs,
      result: calc.data,
      isDemo: true,
    });
  }

  return {
    profile: { ...DEMO_PROFILE },
    professional: { ...DEMO_PROFESSIONAL },
    goal: { ...DEMO_GOAL, mixQuantidades: {} },
    costs: DEMO_COSTS.map((c) => ({ ...c })),
    services,
    history: history.reverse(),
  };
}
