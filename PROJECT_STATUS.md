# PROJECT_STATUS.md — Preço Justo

**Última atualização:** 2026-11-24  
**Versão publicada:** `v1.0.0`  
**Fase atual:** **Fases 1 a 8 concluídas!** Aplicação sincronizada no GitHub (`main` + tag `v1.0.0`), publicada em produção na Vercel e validada integralmente na URL pública. Pronto para **Fases 9 a 11** (preparação final dos dados demonstrativos, gravação do vídeo de 30s para o AVA e apresentação presencial AT2-N2).

---

## 1. Endereços e Informações de Release

- **URL pública em produção:** https://preco-justo-tau.vercel.app
- **Alias alternativo Vercel:** https://preco-justo-titanium-blaze.vercel.app
- **Repositório oficial (GitHub):** https://github.com/Yagoalvez/preco-justo
- **Versão / Tag:** `v1.0.0`
- **Commit da release `v1.0.0`:** `5c6a27d` (`Release v1.0.0 - Preço Justo MVP`)
- **Deploy Vercel:** `dpl_9SoZUNBHYPvZNk1CC4UUbV5EY9Po` — status **`READY`** (`production`, duração de build `19s`, preset `Vite`, `Node.js 26.x`, plano gratuito Hobby)

---

## 2. Resultados da Validação (Local e Produção)

| Verificação | Ambiente | Resultado | Observações |
| --- | --- | --- | --- |
| Testes unitários (`npm test`) | Local | **26 / 26 aprovados** | Vitest `3.2.7` (`src/utils/pricing.test.ts`) |
| Verificação de tipos (`npm run lint`) | Local | **0 erros** | `tsc --noEmit` em modo `strict` |
| Build de produção (`npm run build`) | Local & Vercel | **Aprovado (0 avisos)** | Chunks otimizados (`< 310 kB`), `dist/brand/` incluído |
| Acesso público HTTP | Produção | **HTTP 200** | Sem tela de login da Vercel; acesso público imediato |
| 7 páginas, cálculos, diagnóstico, simulador, metas e PDF | Produção | **Aprovados (100%)** | Todos os números, gráficos Recharts e folha A4 validados |
| Backup JSON (exportação + rejeição inválido + confirmação válido) | Produção | **Aprovado** | Download, proteção contra JSON inválido e restauração validados |
| Persistência (`reload`) e rewrite SPA (`/teste-spa-rewrite`) | Produção | **Aprovados (HTTP 200)** | `LocalStorage` preservado; `vercel.json` sem 404 |
| Identidade visual oficial (logo claro/escuro + símbolo PDF + favicon) | Produção | **Aprovada** | Proporções fiéis (`4.275:1` / `1:1`) em claro, escuro e mobile |
| Responsividade (`1440×900` e `390×844` + drawer mobile) | Produção | **0 overflow** | Layout desktop e mobile sem rolagem horizontal |
| Console do navegador | Produção | **0 erros** | Nenhuma exceção ou erro em produção |
| Vercel Project Status (Doctor) | Produção | **Saudável** | Deploy `READY`, 0 env vars necessárias, 0 domínios customizados, `vercel.json` ativo |

---

## 3. Fluxo para Futuras Atualizações

1. Realizar alterações dentro do repositório e validar localmente:
   - `npm.cmd test` (`26/26` ou mais)
   - `npm.cmd run lint` (`0` erros)
   - `npm.cmd run build` (`dist/` sem erros)
2. Commitar e enviar para a branch `main`:
   - `git add <arquivos>`
   - `git commit -m "tipo: descrição"`
   - `git push origin main`
3. Publicar na Vercel:
   - Via CLI: `vercel.cmd deploy --prod`
   - Ou, para deploy automático a cada `git push`, autorizar o **Vercel GitHub App** para `Yagoalvez/preco-justo` em *Project Settings → Git* no painel da Vercel.

---

## 4. Pendências e Próximas Etapas

- **Opcional (Deploy automático via Git Push):** a conexão direta do repositório GitHub na Vercel requer autorização única do **Vercel GitHub App** no navegador (*Project Settings → Git* no painel da Vercel) para conceder acesso ao repositório `Yagoalvez/preco-justo`. Enquanto não conectada, o deploy em produção funciona normalmente via `vercel deploy --prod`.
- **Fases 9–11 (Entrega AT2-N2):** revisão final dos dados demonstrativos, gravação do vídeo demonstrativo de ~30 segundos para o AVA e preparação da apresentação presencial em sala.
- **Opcional futuro:** atualização de `vitest` (`devDependency`) para zerar alertas de `npm audit` (0 vulnerabilidades em dependências de produção).

---

## 5. Histórico Resumido

- **2026-11-24 (Etapa 1):** Recuperação de contexto, auditoria inicial e criação de `PROJECT_CONTEXT.md`, `PROJECT_STATUS.md` e `AGENTS.md`.
- **2026-11-24 (Etapa 2):** Configuração global da Vercel (plugin oficial + MCP + Vercel CLI `66.6.0`).
- **2026-11-24 (Etapa 3):** Correção dos 15 problemas da auditoria (Fases 3A/3B), melhorias complementares, expansão para 26 testes unitários e validação completa no navegador (4 resoluções).
- **2026-11-24 (Etapa 4):** Refinamento final de UI/UX (Fase 4) no Dashboard, Calculadora, Tabelas/Serviços, Mobile, Modo Escuro e Orçamento A4.
- **2026-11-24 (Etapa 5):** Integração da identidade visual oficial (`public/brand/*` + `BrandLogo.tsx`, Fase 5) e validação visual completa.
- **2026-11-24 (Etapa 6):** Fases 7 e 8 concluídas — instalação do Git (`2.56.1`) e GitHub CLI (`2.105.0`), commit `5c6a27d` + tag `v1.0.0` enviados ao GitHub, publicação em produção na Vercel (`https://preco-justo-tau.vercel.app`), validação integral na URL pública, execução do Vercel Doctor e sincronização da documentação final.
- **2026-11-24 (Etapa 7):** Adição do rodapé institucional de direitos autorais (`© 2026 Preço Justo. Todos os direitos reservados a Yago Alves.`) em `src/components/Layout.tsx`, sincronização com o GitHub e republicação em produção na Vercel.
