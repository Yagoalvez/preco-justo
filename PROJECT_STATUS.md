# PROJECT_STATUS.md — Preço Justo

**Última atualização:** 2026-11-24  
**Fase atual:** Fases 1 a 6 concluídas (incluindo Refinamento de UI/UX — Fase 4 e Identidade Visual Oficial — Fase 5) — MVP estável, com marca oficial integrada e validada no navegador (7 páginas, 4 resoluções, modo claro/escuro, PDF, 0 erros no console). Pronto para Fases 7–11 (GitHub, Vercel, roteiro do vídeo de 30s e apresentação acadêmica AT2-N2).

---

## 1. Estado Atual

- Todos os **15 problemas identificados na auditoria inicial** (5 críticos + 10 médios) foram corrigidos, junto com as melhorias complementares autorizadas (otimização de chunks Vite, tooltips Recharts em modo escuro e meta mensal inicial nos dados demonstrativos).
- **Vínculo Git local:** pendente de sincronização (aguardando etapa dedicada de Git/GitHub mediante autorização).
- **Vínculo Vercel:** CLI `66.6.0` autenticado e plugin/MCP oficial instalados e ativos; projeto **ainda não vinculado nem publicado** na Vercel (aguardando autorização na Fase 8).
- **Ambiente Windows:** Node.js `v26.13.1`, npm `11.20.0` (execução via `npm.cmd` quando PowerShell bloqueia `npm.ps1`).

---

## 2. Resultados da Validação Final

| Verificação | Comando / Método | Resultado | Observações |
| --- | --- | --- | --- |
| Testes unitários | `npm.cmd test` (`vitest run`) | **26 / 26 aprovados** | 20 originais + 6 novos testes de regressão (backup JSON, teto de desconto truncado, parsing numérico, custos manuais) |
| Verificação de tipos | `npm.cmd run lint` (`tsc --noEmit`) | **Aprovado (0 erros)** | Strict mode ativo |
| Build de produção | `npm.cmd run build` (`tsc -b && vite build`) | **Aprovado (0 avisos)** | Chunks otimizados (`icons`, `d3-vendor`, `react-vendor`, `index`, `recharts` — todos < 310 kB) |
| Preview de produção | `npm.cmd run preview` | **Operacional** | Validado diretamente no build `dist/` |
| QA E2E no navegador | Todas as 7 páginas + modais + fluxos | **Aprovado (100%)** | Onboarding, Demo, CRUD Custos/Serviços, Calculadora, Diagnóstico, Simulador, Metas, Histórico, Orçamento PDF, Backup JSON, Tema, Persistência |
| Responsividade | `1920×1080`, `1440×900`, `768×1024`, `390×844` | **Aprovado (0 overflow)** | Zero rolagem horizontal indevida em todas as 7 páginas nos 4 viewports |
| Erros no console | Monitoramento ao vivo | **0 erros** | Zero erros de console e zero exceções não tratadas |
| Segurança (`npm audit`) | `npm.cmd audit` | **0 vulns em produção** | 3 vulnerabilidades restritas a `devDependencies` (`vitest` / `tinypool`) |

---

## 3. Correções Realizadas (Fases 3A e 3B)

### Críticas (5/5 corrigidas)
1. **Botão "Limite" do Simulador de negociação** (`src/utils/pricing.ts`, `src/components/PricingAnalysisPanel.tsx`, `src/utils/recommendations.ts`): introduzido `floorToDecimals` para truncar para baixo o teto de desconto seguro (ex.: `25%` margem + `6%` impostos = `26,5%`, garantindo lucro `>= 0` e zero falso alerta de prejuízo).
2. **Validação estrita e confirmação de Backup JSON** (`src/utils/backup.ts`, `src/context/AppContext.tsx`, `src/pages/SettingsPage.tsx`): validação de assinatura/tipos, rejeição de JSON de terceiros, sanitização profunda de `history[i].inputs`/`result`, bloqueio de `margem + impostos >= 100%` e `ConfirmModal` com resumo de registros antes de sobrescrever dados.
3. **Tratamento de falhas no `LocalStorage`** (`src/context/AppContext.tsx`, `src/components/Layout.tsx`): detecção de erros de leitura/corrupção e escrita (`QuotaExceededError` / armazenamento bloqueado) com banner persistente e toast orientando exportação de backup JSON.
4. **Paginação PDF, textos longos e remoção de placeholder impresso** (`src/components/QuoteModal.tsx`, `src/index.css`): `print:overflow-visible`, `print:break-inside-avoid` em blocos-chave, `break-words` / `[overflow-wrap:anywhere]` em descrições e observações, e fallback `"A/C do Cliente"` exclusivo para impressão quando o nome do cliente fica vazio.
5. **Clareza financeira no Dashboard** (`src/pages/OverviewPage.tsx`): 4º card atualizado para **Faturamento mensal alvo** (bruto, considerando margem e impostos) com subtítulo diferenciando explicitamente a **Cobertura base (pró-labore + custos fixos)**.

### Média Prioridade (10/10 corrigidas)
6. Validação de **custo fixo manual negativo** na Etapa 1 da Calculadora (`CalculatorPage.tsx`).
7. Fim da **sobrescrita silenciosa** de margem/impostos padrão globais ao calcular um serviço pontual (`CalculatorPage.tsx`).
8. Correção da digitação suave no campo de **meta mensal** em `GoalsPage.tsx`.
9. Preservação dos **custos fixos históricos** ao reabrir um registro do histórico na calculadora (`HistoryPage.tsx`, `CalculatorPage.tsx`).
10. Reset automático do seletor **"Preencher de Meus serviços..."** (`CalculatorPage.tsx`).
11. Consistência de **custos fixos manuais** no Dashboard e nas Recomendações (`OverviewPage.tsx`, `recommendations.ts`).
12. Fechamento por tecla **`Escape`** e clique no backdrop nos modais de `CostsPage`, `ServicesPage` e `HistoryPage`.
13. Campos editáveis de **margem e impostos** por serviço no modal de `ServicesPage.tsx` (integrados ao botão *"Sugerir com meu perfil atual"*).
14. Unificação do parsing numérico brasileiro/padrão via `parseNumericInput` (`src/utils/format.ts`) em todo o app.
15. Eliminação da leitura duplicada de `loadInitialState()` na montagem de `AppProvider`.

### Melhorias Complementares
- **Chunks otimizados no Vite** (`vite.config.ts`): eliminado o aviso de bundle > 500 kB.
- **Tooltips Recharts em modo escuro** (`OverviewPage.tsx`, `CalculatorPage.tsx`): contraste explícito de texto e bordas.
- **Meta mensal inicial nos dados demonstrativos** (`demoData.ts`, `AppContext.tsx`): `R$ 10.300,00` e `custosFixosManuais` sincronizado (`R$ 1.578,90`).

### Refinamento Final de UI/UX (Fase 4)
- **Dashboard (`OverviewPage.tsx`, `RecommendationsSection.tsx`):** maior destaque visual no KPI principal (*Valor recomendado / hora*), compactação vertical da seção de recomendações inteligentes, renderização imediata e integral dos gráficos Recharts (`isAnimationActive={false}`) e paleta adaptada para contraste no modo escuro (`CHART_COLORS_DARK`).
- **Calculadora (`CalculatorPage.tsx`, `PricingAnalysisPanel.tsx`, `AppContext.tsx`):** limpeza automática de notificações antigas (`clearToasts`) ao avançar/calcular com sucesso, reorganização das ações da Etapa 3 em 2 níveis claros, maior legibilidade no diagnóstico/simulador, consistência de `26,5%` entre recomendações e simulador e stepper horizontal compacto no mobile.
- **Tabelas, Serviços, Metas e Orçamentos (`CostsPage.tsx`, `ServicesPage.tsx`, `HistoryPage.tsx`, `GoalsPage.tsx`, `SettingsPage.tsx`, `QuoteModal.tsx`):** áreas de toque `h-9 w-9` com `title` e `aria-label` em todos os botões de ícone, margem visível nos cards de serviços, grid mobile de 2 colunas para indicadores secundários, hierarquia de 3 níveis de superfície no modo escuro (`#090E17` / `#111827` / `#1A2333`) e refino tipográfico na folha A4 do orçamento.

### Identidade Visual Oficial (Fase 5)
- **Ativos importados em `public/brand/`:** `logo-preco-justo.svg` (modo claro), `logo-preco-justo-escuro.svg` (modo escuro), `simbolo-preco-justo.svg`, `favicon.svg` (também sincronizado em `public/favicon.svg`) e `favicon.png`.
- **Componente centralizado (`src/components/BrandLogo.tsx`):** renderiza as variantes oficiais preservando proporções originais (`object-contain`, sem distorção ou redesenho).
- **Aplicação completa (0 referências restantes ao antigo ícone `Scale`):** menu lateral desktop (claro/escuro), cabeçalho e drawer mobile, Onboarding (Slide 1), favicon do navegador (`index.html`) e folha A4 do orçamento comercial em PDF (símbolo oficial no cabeçalho e logotipo horizontal no rodapé).

---

## 4. Pendências e Próximas Etapas

- **Fase 7 (Git/GitHub):** instalar Git for Windows (se ainda não instalado), vincular repositório remoto sem sobrescrever arquivos locais e enviar commit mediante autorização.
- **Fase 8 (Vercel):** vincular e publicar o projeto na Vercel mediante autorização.
- **Fases 9–11 (Entrega AT2-N2):** revisão final dos dados demonstrativos, gravação do vídeo de ~30s para o AVA e preparação da apresentação presencial.
- **Opcional futuro:** atualização de `vitest` (`devDependency`) para zerar alertas de `npm audit`.

---

## 5. Histórico Resumido

- **2026-11-24 (Etapa 1):** Recuperação de contexto, auditoria inicial e criação de `PROJECT_CONTEXT.md`, `PROJECT_STATUS.md` e `AGENTS.md`.
- **2026-11-24 (Etapa 2):** Configuração global da Vercel (plugin oficial + MCP + Vercel CLI `66.6.0`).
- **2026-11-24 (Etapa 3):** Execução completa das Fases 3A, 3B e 6 — 15 bugs corrigidos, melhorias complementares aplicadas, suíte expandida para 26 testes, QA completo no navegador em 4 resoluções com 0 erros e documentação atualizada.
- **2026-11-24 (Etapa 4):** Refinamento final de UI/UX (Dashboard, Calculadora, Mobile, Modo Escuro, Tabelas/Serviços, Acessibilidade e Orçamento A4), revalidação completa de testes (`26/26`), lint (`0 erros`), build (`0 avisos`) e navegador (7 páginas, 4 resoluções, 0 erros no console).
- **2026-11-24 (Etapa 5):** Integração da identidade visual oficial (`public/brand/*` + `BrandLogo.tsx`) em toda a aplicação, favicon e PDF, validada ao vivo em modo claro, modo escuro, mobile e impressão, com `26/26` testes, `0` erros de lint e build limpo.
