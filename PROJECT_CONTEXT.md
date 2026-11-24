# PROJECT_CONTEXT.md — Preço Justo

## 1. Identificação do Projeto

- **Nome:** Preço Justo
- **Slogan:** *Seu trabalho tem valor. Saiba quanto cobrar.*
- **Idioma:** Português do Brasil (`pt-BR`)
- **Moeda:** Real brasileiro (`BRL`)
- **Categoria:** SaaS de gestão financeira e precificação inteligente de serviços
- **Repositório oficial:** `https://github.com/Yagoalvez/preco-justo`
- **URL pública de produção:** `https://preco-justo-tau.vercel.app`
- **Versão publicada:** `v1.0.0`

## 2. Objetivos

Entregar um MVP estável, leve, funcional, financeiramente preciso e visualmente profissional, capaz de resolver um problema real enfrentado por profissionais autônomos. Embora desenvolvido inicialmente para a atividade acadêmica **AT2-N2**, o produto é concebido com padrão de SaaS comercial real e potencial de evolução futura.

## 3. Problema e Solução

### Problema
Muitos profissionais autônomos e pequenos prestadores de serviço definem seus preços de forma intuitiva ou apenas copiando concorrentes, desconsiderando despesas operacionais fixas, custos variáveis diretos, horas efetivamente faturáveis, impostos/taxas, remuneração pessoal (pró-labore), margem de lucro real e capacidade produtiva. Isso leva a subprecificação, baixa rentabilidade e prejuízo silencioso.

### Solução
O **Preço Justo** automatiza os cálculos financeiros essenciais em um fluxo guiado e 100% local no navegador:
- Integra despesas fixas mensais diretamente ao custo da hora produtiva, sem duplicação;
- Calcula preço mínimo (empate) e preço recomendado com margem real sobre o preço de venda;
- Diagnostica o preço atualmente cobrado, diferenciando prejuízo operacional de lucro reduzido;
- Simula descontos em negociações com cálculo do teto máximo sem prejuízo;
- Planeja metas de faturamento frente à capacidade mensal de horas faturáveis;
- Emite orçamentos comerciais limpos para o cliente (texto e impressão/PDF), ocultando custos internos e margens.

## 4. Público-Alvo

- Freelancers (designers, desenvolvedores, fotógrafos, editores de vídeo, social medias, redatores);
- Profissionais autônomos e consultores independentes;
- MEIs e pequenos estúdios ou empreendedores prestadores de serviço.

## 5. Contexto e Requisitos Acadêmicos (AT2-N2)

- **Tecnologia obrigatória:** sistema web desenvolvido em **React JS**.
- **Proposta:** resolver um problema real, atender a uma necessidade existente ou apresentar potencial comercial.
- **Uso de IA:** permitido e incentivado.
- **Critérios de avaliação:**
  1. Resolução de um problema real (propósito, necessidade e utilidade);
  2. UI/UX (qualidade visual, organização, intuitividade e facilidade de navegação);
  3. Funcionamento (funcionalidades implementadas e operacionais).
- **Entrega:** vídeo demonstrativo de aproximadamente 30 segundos enviado pelo AVA (não é necessário entregar código-fonte).
- **Apresentação:** apresentação presencial em sala de aula como parte da avaliação.

## 6. Stack Tecnológica

Preservar a arquitetura atual sem migrações ou dependências desnecessárias:
- **React 18.3** + **TypeScript 5.7**
- **Vite 6** (build, dev server e preview)
- **Tailwind CSS 3.4** (`darkMode: 'class'`)
- **Lucide React** (iconografia)
- **Recharts 2.15** (gráficos de distribuição de custos e composição do preço)
- **LocalStorage** (persistência local no navegador, chave `preco_justo_app_state_v1`)
- **Vitest 3** (testes unitários das regras financeiras)
- **Git / GitHub** e **Vercel** (hospedagem estática SPA)

**Fora de escopo no MVP atual:** banco de dados externo, autenticação/login, pagamentos/assinaturas e APIs externas de IA.

## 7. Arquitetura da Aplicação

```text
public/
  favicon.svg                 # Favicon oficial da marca Preço Justo
  brand/
    logo-preco-justo.svg      # Logotipo horizontal oficial (modo claro e PDF)
    logo-preco-justo-escuro.svg # Logotipo horizontal oficial (modo escuro)
    simbolo-preco-justo.svg   # Símbolo oficial PJ (cabeçalho de orçamento e usos quadrados)
    favicon.svg               # Favicon vetorial oficial
    favicon.png               # Fallback PNG para navegadores / Apple Touch Icon
src/
  App.tsx                     # AppProvider + roteamento por estado (PageId) + modais globais
  main.tsx                    # Entry point React StrictMode
  index.css                   # Tailwind, tipografia base, focus-visible, @media print
  types/index.ts              # Contratos TypeScript de domínio e estado global
  context/AppContext.tsx      # Estado global, CRUD, LocalStorage, demo data, backup JSON e toasts
  data/demoData.ts            # Pacote demonstrativo (perfil, custos, serviços, histórico)
  utils/
    pricing.ts                # Fórmulas financeiras, validações, truncamento seguro, diagnóstico e simulador
    planning.ts               # Projeção de metas mensais e simulador de mix de serviços
    recommendations.ts        # Motor determinístico local de recomendações inteligentes
    backup.ts                 # Validação estrutural estrita e sanitização profunda de backups JSON (v2)
    format.ts                 # Formatação BRL, percentuais, horas, datas, parsing numérico e IDs
    pricing.test.ts           # Suíte Vitest (26 testes unitários)
  components/
    BrandLogo.tsx             # Componente oficial da identidade visual (horizontal claro/escuro, símbolo e badge)
    Layout.tsx                # Sidebar desktop, header/drawer mobile, toggle de tema e controle demo
    OnboardingModal.tsx       # Guia inicial em 3 etapas
    PricingAnalysisPanel.tsx  # Diagnóstico de precificação + simulador de negociação
    QuoteModal.tsx            # Gerador de orçamento comercial com prévia A4 e impressão/PDF
    RecommendationsSection.tsx# Cards de recomendações financeiras no dashboard
    ConfirmModal.tsx          # Modal de confirmação para ações destrutivas
    EmptyState.tsx            # Estados vazios e badge "Demonstrativo"
    ToastContainer.tsx        # Feedback visual de ações
  pages/
    OverviewPage.tsx          # Dashboard financeiro
    CalculatorPage.tsx        # Calculadora em 3 etapas
    GoalsPage.tsx             # Planejamento de metas e mix mensal
    ServicesPage.tsx          # Catálogo de serviços
    CostsPage.tsx             # Gestão de despesas fixas mensais
    HistoryPage.tsx           # Histórico de precificações
    SettingsPage.tsx          # Perfil profissional, tema, demo, backup JSON e reset
```

## 8. Funcionalidades Principais

1. **Dashboard financeiro (`OverviewPage`)**: KPIs principais, recomendações inteligentes determinísticas, gráfico de distribuição de custos por categoria, últimas precificações e atalho para a calculadora.
2. **Calculadora em 3 etapas (`CalculatorPage`)**:
   - Etapa 1: Perfil financeiro (pró-labore, custos fixos automáticos ou manuais, dias/mês, horas/dia, % faturável).
   - Etapa 2: Informações do serviço (nome, categoria, descrição, horas, custos adicionais, margem e impostos sobre venda).
   - Etapa 3: Resultado detalhado, gráfico de composição do preço, diagnóstico de precificação, simulador de descontos e ações (salvar histórico, salvar no catálogo, copiar orçamento, gerar PDF).
3. **Planejamento de metas (`GoalsPage`)**: meta mensal, sugestão baseada no perfil, volume e ocupação de agenda por serviço, montador de mix mensal e simulador rápido de ticket.
4. **Meus serviços (`ServicesPage`)**: CRUD completo, busca, filtro por categoria, ordenação, sugestão automática de preço, recálculo na calculadora e geração de orçamento.
5. **Custos mensais (`CostsPage`)**: CRUD de despesas por categoria, busca, filtro, participação percentual, impacto por hora faturável e sincronização automática com a calculadora.
6. **Histórico de cálculos (`HistoryPage`)**: listagem, busca, filtro, consulta detalhada em modal, duplicação, reabertura na calculadora, orçamento em PDF e exclusão.
7. **Orçamentos comerciais (`QuoteModal`)**: edição de dados comerciais, prévia A4, cópia em texto e exportação via impressão/PDF do navegador sem expor custos internos, valor/hora ou margem.
8. **Configurações e recursos transversais (`SettingsPage`, `Layout`, `OnboardingModal`)**: dados do profissional, padrões da calculadora, modo claro/escuro, onboarding em 3 passos, dados demonstrativos removíveis e backup/restauração em JSON.

## 9. Regras Financeiras Fundamentais

Todas as fórmulas abaixo são invariantes do sistema e devem ser rigorosamente preservadas:

- **Horas faturáveis mensais** = `dias trabalhados × horas produtivas diárias × (percentual faturável / 100)`
- **Custo da hora** = `(remuneração mensal desejada + despesas fixas mensais) ÷ horas faturáveis mensais`
- **Custo do serviço** = `(custo da hora × horas necessárias) + custos adicionais`
- **Preço mínimo (sem lucro)** = `custo do serviço ÷ (1 − impostos)`
- **Preço recomendado** = `custo do serviço ÷ (1 − margem de lucro − impostos)`
- **Impostos e taxas** = `preço de venda × impostos`
- **Lucro líquido estimado** = `preço de venda − custo do serviço − impostos e taxas`
- **Margem efetiva** = `(lucro líquido estimado ÷ preço de venda) × 100`
- **Desconto máximo sem prejuízo (%)** = `(1 − preço mínimo ÷ preço original) × 100`

### Diretrizes financeiras obrigatórias
- Margem de lucro e impostos incidem sempre **sobre o preço de venda** (nunca simples markup sobre custo).
- Bloquear valores negativos, campos vazios inválidos, divisões por zero, valores não numéricos (`NaN`/`Infinity`), descontos `>= 100%`, soma de margem + impostos `>= 100%` e duplicação de despesas fixas.
- Diferenciar com clareza: **faturamento bruto**, **remuneração (pró-labore)**, **custos fixos/operacionais**, **custos adicionais**, **lucro líquido**, **margem efetiva**, **preço mínimo** e **preço recomendado**.
- Distinguir claramente **preço abaixo do recomendado com lucro reduzido** de **prejuízo operacional real** (abaixo do preço mínimo).

## 10. Identidade Visual e UI/UX

### Paleta oficial
- **Verde escuro:** `#14532D`
- **Verde principal:** `#16A34A`
- **Chumbo:** `#111827`
- **Cinza claro:** `#F3F4F6`
- **Branco:** `#FFFFFF`

### Tipografia
- **Títulos:** `Manrope`
- **Textos e interface:** `Inter` (com `tabular-nums` em valores financeiros)

### Diretrizes
Estética de SaaS financeiro limpo, moderno e sóbrio, com contraste adequado em modo claro e escuro, responsividade mobile/desktop, feedback imediato e ausência de poluição visual, gradientes excessivos ou elementos decorativos gratuitos. Não realizar redesign completo sem autorização.

## 11. Estratégia de Publicação (Vercel)

- **URL pública definitiva:** `https://preco-justo-tau.vercel.app` (alias alternativo: `https://preco-justo-titanium-blaze.vercel.app`)
- **Projeto Vercel:** `preco-justo` (plano gratuito Hobby, sem serviços pagos)
- **Framework preset:** Vite (`Node.js 26.x`)
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install` (compatível com `package-lock.json`)
- **Root Directory:** raiz do projeto (`.`)
- **SPA Rewrite:** `vercel.json` redireciona `/(.*)` para `/index.html`.
- **Fluxo de atualizações futuras:** validar localmente (`npm test && npm run lint && npm run build`), enviar à branch `main` no GitHub (`git push origin main`) e publicar com `vercel deploy --prod` (ou habilitar deploy automático conectando o Vercel GitHub App em *Settings → Git* do projeto na Vercel).
- **Observação de persistência:** dados salvos em `LocalStorage` são locais por dispositivo/navegador e não sincronizam automaticamente entre aparelhos (usuário pode transferir via backup JSON).

## 12. Roadmap de Finalização

1. **Fase 1** — Recuperação do contexto e documentação.
2. **Fase 2** — Auditoria técnica e funcional.
3. **Fase 3** — Correção de bugs e inconsistências financeiras.
4. **Fase 4** — Refinamento da interface e experiência do usuário.
5. **Fase 5** — Refinamento da identidade visual.
6. **Fase 6** — Testes finais e validação do build.
7. **Fase 7** — Atualização do GitHub mediante autorização.
8. **Fase 8** — Publicação na Vercel mediante autorização.
9. **Fase 9** — Preparação de dados demonstrativos.
10. **Fase 10** — Preparação para gravação do vídeo de 30 segundos.
11. **Fase 11** — Preparação para apresentação acadêmica.
