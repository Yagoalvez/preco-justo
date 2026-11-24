# Preço Justo

> **Seu trabalho tem valor. Saiba quanto cobrar.**

Aplicação web completa de precificação inteligente voltada para profissionais autônomos, freelancers e pequenos empreendedores.

---

## O problema identificado

Grande parte dos profissionais autônomos e pequenos prestadores de serviço define preços com base em estimativas informais ou comparando valores da concorrência, sem considerar:

- Custos fixos operacionais mensais (internet, energia, softwares, equipamentos, aluguel, contabilidade);
- Horas efetivamente faturáveis (descontando o tempo dedicado a prospecção, reuniões e gestão);
- Impostos e taxas sobre o preço de venda;
- Margem de lucro real sobre o preço final (e não apenas acréscimo simples sobre o custo).

O resultado recorrente são serviços subprecificados, baixa sustentabilidade financeira e trabalho excessivo sem retorno compatível.

---

## A solução desenvolvida

O **Preço Justo** transforma o cálculo de precificação em um fluxo guiado, transparente e prático:

1. **Estrutura financeira real**: integra os custos fixos mensais cadastrados diretamente à calculadora, sem duplicação de despesas.
2. **Cálculo rigoroso**: aplica fórmulas financeiras corretas de precificação por margem sobre o preço de venda, bloqueando divisões por zero, valores negativos e somas de margem + impostos iguais ou superiores a 100%.
3. **Gestão contínua**: reúne catálogo de serviços, despesas mensais, histórico completo de cálculos e geração de orçamento profissional pronto para envio ou exportação em PDF — sem expor custos internos ou margem de lucro ao cliente.
4. **Privacidade e operação 100% local**: funciona inteiramente no navegador com persistência em `LocalStorage`, sem depender de APIs externas, login obrigatório ou bancos remotos.

---

## Público-alvo

- Freelancers (designers, desenvolvedores, editores de vídeo, social media, redatores, fotógrafos);
- Profissionais autônomos e consultores independentes;
- Microempreendedores individuais (MEI) e pequenos estúdios de serviços.

---

## Tecnologias utilizadas

- **React 18** + **TypeScript**
- **Vite** (build rápido e pronto para deploy na Vercel)
- **Tailwind CSS** (interface responsiva com suporte a modo claro e escuro)
- **Lucide React** (ícones minimalistas)
- **Recharts** (gráficos de distribuição de custos e composição do preço)
- **LocalStorage** (persistência local automática + exportação/importação de backup em JSON)
- **Vitest** (testes unitários das fórmulas matemáticas)

---

## Principais funcionalidades

- **Visão geral (Dashboard)**: valor recomendado da hora de trabalho, custos operacionais mensais, total de serviços cadastrados, faturamento mensal desejado, **recomendações inteligentes** baseadas em regras matemáticas locais, gráfico de distribuição de custos, últimas precificações e atalho rápido *"Calcular novo serviço"*.
- **Calculadora de preços em 3 etapas**:
  - *Etapa 1 — Perfil financeiro*: remuneração mensal desejada, custos fixos mensais (sincronizados automaticamente com *Custos mensais*), dias trabalhados/mês, horas produtivas/dia e percentual de horas faturáveis.
  - *Etapa 2 — Informações do serviço*: nome, categoria, descrição, horas necessárias, custos adicionais, margem de lucro desejada (% sobre venda) e impostos/taxas (% sobre venda).
  - *Etapa 3 — Resultado, Diagnóstico e Negociação*: preço recomendado em destaque, custo da hora, custo total do serviço, preço mínimo sem lucro, lucro líquido estimado, impostos e taxas, margem efetiva, gráfico de composição do preço, **Diagnóstico de precificação** (compara preço atual vs. recomendado e diferencia lucro reduzido de prejuízo real), **Simulador de negociação** (simulação de descontos em tempo real com cálculo do desconto máximo permitido sem prejuízo) e ações (*Salvar cálculo*, *Copiar orçamento*, *Gerar orçamento em PDF*, *Salvar em Meus serviços* e *Realizar novo cálculo*).
- **Planejamento de metas**: definição da meta de faturamento mensal, cálculo de vendas necessárias por serviço, análise de ocupação da capacidade de horas faturáveis, simulador de mix mensal de serviços e simulador rápido de ticket.
- **Onboarding guiado**: introdução curta em 3 passos para novos usuários configurarem o perfil financeiro e realizarem o primeiro cálculo (reacessível em Configurações).
- **Custos mensais**: cadastro, edição, exclusão e filtragem de despesas por categoria (*Internet, Energia elétrica, Softwares e assinaturas, Equipamentos, Transporte, Aluguel, Contabilidade e Outros*) com soma automática integrada à calculadora.
- **Meus serviços**: cadastro completo com pesquisa, filtro por categoria, ordenação, edição, exclusão, recálculo na calculadora e geração direta de orçamento.
- **Histórico de cálculos**: consulta detalhada, duplicação e exclusão de cálculos anteriores.
- **Gerador de orçamento profissional em PDF**: pré-visualização em folha A4 e impressão/exportação em PDF com dados do profissional, cliente, serviço, escopo, valor final, emissão, validade e observações — ocultando custos internos e margem de lucro.
- **Dados demonstrativos**: carregamento com um clique de despesas, serviços de exemplo (*Design de post para Instagram, Criação de identidade visual, Edição de vídeo, Desenvolvimento de landing page e Gestão de redes sociais*) e histórico, todos identificados como demonstrativos e removíveis a qualquer momento.
- **Configurações**: dados do profissional para orçamentos, padrões da calculadora, modo claro/escuro e backup/restauração em JSON.

---

## Fórmulas matemáticas implementadas

- **Horas faturáveis mensais** = `dias trabalhados × horas produtivas diárias × (percentual faturável / 100)`
- **Custo da hora** = `(remuneração mensal desejada + custos fixos mensais) ÷ horas faturáveis mensais`
- **Custo do serviço** = `(custo da hora × horas necessárias) + custos adicionais`
- **Preço mínimo (sem lucro)** = `custo do serviço ÷ (1 − impostos)`
- **Preço recomendado** = `custo do serviço ÷ (1 − margem de lucro − impostos)`
- **Impostos e taxas** = `preço recomendado × impostos`
- **Lucro líquido estimado** = `preço recomendado − custo do serviço − impostos e taxas`

---

## Como executar o projeto

### Pré-requisitos

- [Node.js](https://nodejs.org/) versão 18 ou superior
- `npm` (instalado junto com o Node.js)

### Passo a passo

```bash
# 1. Acesse a pasta do projeto
cd preco-justo

# 2. Instale as dependências
npm install

# 3. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse o endereço exibido no terminal (normalmente `http://localhost:5173`).

### Testes e build de produção

```bash
# Executar testes unitários das fórmulas matemáticas
npm test

# Gerar build de produção otimizado (pasta dist/)
npm run build

# Visualizar localmente o build de produção
npm run preview
```

### Publicação na Vercel

O projeto já inclui `vercel.json` configurado para SPA. Basta importar o repositório na Vercel usando o preset padrão do **Vite** (`npm run build`, saída em `dist`).
