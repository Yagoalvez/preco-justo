# AGENTS.md — Instruções Permanentes para Agentes de IA

Qualquer agente de inteligência artificial que trabalhe no repositório **Preço Justo** deve seguir rigorosamente estas diretrizes.

## 1. Leitura Obrigatória Antes de Qualquer Ação

Antes de propor ou executar alterações no projeto, leia sempre:
1. `PROJECT_CONTEXT.md` — visão do produto, requisitos acadêmicos (AT2-N2), stack, arquitetura, regras financeiras e identidade visual.
2. `PROJECT_STATUS.md` — estado atual, bugs conhecidos, resultados de testes/build e fase do roadmap.

## 2. Preservação da Arquitetura e do Escopo

- **Nunca recrie o projeto do zero.** Evolua a partir da base existente.
- **Nunca remova funcionalidades existentes** sem autorização explícita do usuário.
- **Preserve a stack:** React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts, LocalStorage e Vitest.
- **Não adicione dependências desnecessárias** e não introduza banco de dados externo, autenticação, pagamentos ou APIs externas de IA no MVP atual.
- **Preserve compatibilidade** com Windows e publicação estática na Vercel (`vercel.json` + `npm run build` -> `dist/`).

## 3. Regras Financeiras Invioláveis

- A margem de lucro e os impostos/taxas devem incidir **sobre o preço de venda**, nunca como simples acréscimo sobre o custo:
  - `horasFaturaveis = diasTrabalhados × horasDia × (percentualFaturavel / 100)`
  - `custoHora = (remuneracaoMensal + custosFixosMensais) / horasFaturaveis`
  - `custoServico = (custoHora × horasNecessarias) + custosAdicionais`
  - `precoMinimo = custoServico / (1 - impostos)`
  - `precoRecomendado = custoServico / (1 - margem - impostos)`
- Sempre validar valores negativos, vazios, não numéricos (`NaN`/`Infinity`), divisão por zero, `margem + impostos >= 100%` e `desconto >= 100%`.
- Diferenciar sempre **preço abaixo do recomendado (com lucro reduzido)** de **prejuízo operacional real (abaixo do preço mínimo)**.
- Diferenciar claramente faturamento bruto, remuneração (pró-labore), custos/despesas, lucro líquido, margem efetiva, preço mínimo e preço recomendado.
- **Orçamentos comerciais** (texto e PDF) nunca podem exibir custos internos, valor da hora ou margem de lucro ao cliente, nem textos auxiliares de formulário na folha impressa.
- **Backups JSON** devem passar sempre por validação estrutural e sanitização profunda (`src/utils/backup.ts`) e exigir confirmação explícita antes de substituir os dados atuais do usuário.
- Nunca invente dados financeiros nem apresente dados demonstrativos como se fossem dados reais do usuário.

## 4. Identidade Visual e Qualidade de Interface

- Preserve a paleta oficial (`#14532D`, `#16A34A`, `#111827`, `#F3F4F6`, `#FFFFFF`), tipografia (`Manrope` e `Inter`) e estética limpa de SaaS financeiro nos modos claro e escuro.
- Evite gradientes excessivos, sombras exageradas, poluição visual e botões sem ação.
- Não execute redesign completo sem autorização.

## 5. Validação Obrigatória Após Alterações

Após qualquer alteração de código:
1. Execute os testes unitários (`npm test` — no Windows PowerShell com política de script restrita, utilize `npm.cmd test`).
2. Execute a verificação de tipos (`npm run lint` / `npm.cmd run lint`).
3. Execute o build de produção após alterações relevantes (`npm run build` / `npm.cmd run build`).
4. Valide o funcionamento real no navegador quando houver mudança de UI ou fluxo.
5. Nunca declare funcionalidades ou testes como aprovados sem executá-los de fato.

## 6. Atualização de Documentação e Segurança

- Atualize `PROJECT_STATUS.md` ao concluir cada etapa relevante (e `PROJECT_CONTEXT.md` se houver mudanças de arquitetura ou decisões técnicas).
- **Nunca inclua** dados pessoais, credenciais, tokens, chaves ou caminhos locais privados de máquina em arquivos versionáveis.

## 7. Operações que Exigem Autorização Explícita

Solicite autorização expressa do usuário antes de executar:
- Operações destrutivas ou exclusão de dados;
- Alterações fora da pasta do projeto;
- Mudanças significativas na identidade visual ou arquitetura;
- Comandos Git destrutivos (`git push --force`, `git reset --hard`) ou envio ao GitHub (`git push`);
- Publicação/deploy na Vercel.
