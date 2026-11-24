import React, { useEffect, useState } from 'react';
import { X, Printer, Copy, Scale, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  addDaysISO,
  formatCurrencyBRL,
  formatDateBR,
  generateQuoteNumber,
  todayISO,
} from '../utils/format';

export const QuoteModal: React.FC = () => {
  const { state, quoteModalDraft, closeQuoteModal, notify } = useApp();

  const [nomeProfissional, setNomeProfissional] = useState('');
  const [nomeCliente, setNomeCliente] = useState('');
  const [empresaCliente, setEmpresaCliente] = useState('');
  const [nomeServico, setNomeServico] = useState('');
  const [descricao, setDescricao] = useState('');
  const [prazoEntrega, setPrazoEntrega] = useState('A combinar após aprovação');
  const [valorFinalStr, setValorFinalStr] = useState('');
  const [dataEmissao, setDataEmissao] = useState(todayISO());
  const [prazoValidade, setPrazoValidade] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [incluirAssinatura, setIncluirAssinatura] = useState(true);
  const [numeroOrcamento, setNumeroOrcamento] = useState('');

  useEffect(() => {
    if (!quoteModalDraft) return;
    const hoje = todayISO();
    const validDays = state.professional.validadePadraoDias || 15;
    setNomeProfissional(state.professional.nomeProfissional || '');
    setNomeCliente(quoteModalDraft.nomeCliente || '');
    setEmpresaCliente('');
    setNomeServico(quoteModalDraft.nomeServico);
    setDescricao(quoteModalDraft.descricao || '');
    setPrazoEntrega(quoteModalDraft.prazoEntrega || 'A combinar após aprovação');
    setValorFinalStr(quoteModalDraft.valorFinal.toFixed(2));
    setDataEmissao(hoje);
    setPrazoValidade(addDaysISO(hoje, validDays));
    setObservacoes(quoteModalDraft.observacoes ?? state.professional.observacoesPadrao ?? '');
    setNumeroOrcamento(generateQuoteNumber());
  }, [quoteModalDraft, state.professional]);

  useEffect(() => {
    if (!quoteModalDraft) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeQuoteModal();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [quoteModalDraft, closeQuoteModal]);

  if (!quoteModalDraft) return null;

  const parsedValor = Number(valorFinalStr.replace(',', '.'));
  const safeValor = Number.isFinite(parsedValor) && parsedValor >= 0 ? parsedValor : 0;

  const handlePrintPdf = () => {
    window.print();
  };

  const handleCopyText = async () => {
    const lines = [
      `PROPOSTA COMERCIAL / ORÇAMENTO (#${numeroOrcamento})`,
      `Profissional: ${nomeProfissional.trim() || 'Não informado'}`,
      nomeCliente.trim()
        ? `Cliente: ${nomeCliente.trim()}${empresaCliente.trim() ? ` (${empresaCliente.trim()})` : ''}`
        : null,
      `Serviço: ${nomeServico.trim()}`,
      descricao.trim() ? `Escopo: ${descricao.trim()}` : null,
      prazoEntrega.trim() ? `Prazo de entrega: ${prazoEntrega.trim()}` : null,
      `Investimento total: ${formatCurrencyBRL(safeValor)}`,
      `Data de emissão: ${formatDateBR(dataEmissao)}`,
      `Validade da proposta: ${formatDateBR(prazoValidade)}`,
      observacoes.trim() ? `Condições e observações: ${observacoes.trim()}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await navigator.clipboard.writeText(lines);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = lines;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }

    notify({
      type: 'success',
      title: 'Orçamento copiado',
      description: 'Proposta pronta para enviar por WhatsApp ou e-mail ao cliente.',
    });
  };

  return (
    <div
      className="print-only-container fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quote-modal-title"
    >
      <div className="my-auto flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#111827] print:max-h-none print:max-w-none print:rounded-none print:border-0 print:shadow-none">
        {/* Top bar (hidden on print) */}
        <div className="no-print flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-slate-800">
          <div>
            <h2
              id="quote-modal-title"
              className="font-display text-lg font-bold text-[#111827] dark:text-white"
            >
              Gerar orçamento profissional (PDF)
            </h2>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-[#16A34A]" />
              Documento comercial limpo: custos internos, valor/hora e margem nunca são exibidos ao
              cliente.
            </p>
          </div>
          <button
            type="button"
            onClick={closeQuoteModal}
            aria-label="Fechar gerador de orçamento"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body: Form + Print Preview */}
        <div className="grid flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-12 print:block print:overflow-visible">
          {/* Left editor (hidden on print) */}
          <div className="no-print space-y-4 border-b border-gray-200 bg-gray-50/70 p-6 dark:border-slate-800 dark:bg-slate-900/50 lg:col-span-5 lg:border-b-0 lg:border-r">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
              Dados da proposta comercial
            </p>

            <div>
              <label
                htmlFor="quote-prof"
                className="block text-xs font-semibold text-gray-700 dark:text-slate-300"
              >
                Nome do profissional / empresa
              </label>
              <input
                id="quote-prof"
                type="text"
                placeholder="Seu nome ou nome do estúdio"
                value={nomeProfissional}
                onChange={(e) => setNomeProfissional(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#16A34A] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="quote-client"
                  className="block text-xs font-semibold text-gray-700 dark:text-slate-300"
                >
                  Nome do cliente
                </label>
                <input
                  id="quote-client"
                  type="text"
                  placeholder="Ex.: Mariana Silva"
                  value={nomeCliente}
                  onChange={(e) => setNomeCliente(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#16A34A] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="quote-client-org"
                  className="block text-xs font-semibold text-gray-700 dark:text-slate-300"
                >
                  Empresa / Contato <span className="font-normal text-gray-400">(opcional)</span>
                </label>
                <input
                  id="quote-client-org"
                  type="text"
                  placeholder="Ex.: Horizonte Ltda."
                  value={empresaCliente}
                  onChange={(e) => setEmpresaCliente(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#16A34A] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="quote-service"
                className="block text-xs font-semibold text-gray-700 dark:text-slate-300"
              >
                Nome do serviço
              </label>
              <input
                id="quote-service"
                type="text"
                value={nomeServico}
                onChange={(e) => setNomeServico(e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#16A34A] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="quote-desc"
                className="block text-xs font-semibold text-gray-700 dark:text-slate-300"
              >
                Descrição e entregáveis
              </label>
              <textarea
                id="quote-desc"
                rows={3}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="mt-1 w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#16A34A] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="quote-delivery"
                  className="block text-xs font-semibold text-gray-700 dark:text-slate-300"
                >
                  Prazo de entrega estimado
                </label>
                <input
                  id="quote-delivery"
                  type="text"
                  placeholder="Ex.: 10 dias úteis"
                  value={prazoEntrega}
                  onChange={(e) => setPrazoEntrega(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#16A34A] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="quote-value"
                  className="block text-xs font-semibold text-gray-700 dark:text-slate-300"
                >
                  Valor final (R$)
                </label>
                <input
                  id="quote-value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={valorFinalStr}
                  onChange={(e) => setValorFinalStr(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-[#111827] outline-none tabular-nums focus:border-[#16A34A] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="quote-issue"
                  className="block text-xs font-semibold text-gray-700 dark:text-slate-300"
                >
                  Data de emissão
                </label>
                <input
                  id="quote-issue"
                  type="date"
                  value={dataEmissao}
                  onChange={(e) => setDataEmissao(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-2.5 py-2 text-xs text-[#111827] outline-none focus:border-[#16A34A] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="quote-valid"
                  className="block text-xs font-semibold text-gray-700 dark:text-slate-300"
                >
                  Validade até
                </label>
                <input
                  id="quote-valid"
                  type="date"
                  value={prazoValidade}
                  onChange={(e) => setPrazoValidade(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-2.5 py-2 text-xs text-[#111827] outline-none focus:border-[#16A34A] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="quote-notes"
                className="block text-xs font-semibold text-gray-700 dark:text-slate-300"
              >
                Observações e condições comerciais
              </label>
              <textarea
                id="quote-notes"
                rows={3}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="mt-1 w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#16A34A] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={incluirAssinatura}
                onChange={(e) => setIncluirAssinatura(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#16A34A] focus:ring-[#16A34A]"
              />
              Incluir bloco de aprovação / aceite do cliente no rodapé
            </label>

            <div className="flex flex-wrap gap-2.5 pt-2">
              <button
                type="button"
                onClick={handlePrintPdf}
                className="inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#16A34A] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#15803D]"
              >
                <Printer className="h-4 w-4" />
                Imprimir / Salvar em PDF
              </button>
              <button
                type="button"
                onClick={handleCopyText}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#111827] hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
              >
                <Copy className="h-4 w-4" />
                Copiar
              </button>
            </div>
          </div>

          {/* Right: Printable A4 Document Sheet (ALWAYS crisp editorial white paper) */}
          <div className="bg-[#E5E7EB]/60 p-5 dark:bg-slate-950/70 lg:col-span-7 print:bg-white print:p-0">
            <div className="quote-print-sheet mx-auto overflow-hidden rounded-xl border border-gray-200 bg-white text-[#111827] shadow-sm print:rounded-none print:border-0 print:shadow-none">
              {/* Accent top bar */}
              <div className="h-1.5 w-full bg-[#14532D]" />

              <div className="p-8 sm:p-10 print:p-0 print:pt-4">
                {/* Document Header */}
                <div className="flex flex-wrap items-start justify-between gap-6 border-b border-gray-200 pb-6">
                  <div className="max-w-sm">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#14532D] text-white">
                        <Scale className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="block font-display text-lg font-extrabold leading-tight tracking-tight text-[#111827]">
                          {nomeProfissional.trim() || 'Proposta Comercial'}
                        </span>
                        {state.professional.especialidade && (
                          <span className="block text-xs font-medium text-gray-500">
                            {state.professional.especialidade}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 space-y-0.5 text-[11px] text-gray-500">
                      {state.professional.documento && <p>{state.professional.documento}</p>}
                      {(state.professional.email || state.professional.telefone) && (
                        <p>
                          {[state.professional.email, state.professional.telefone]
                            .filter(Boolean)
                            .join('  ·  ')}
                        </p>
                      )}
                      {state.professional.cidade && <p>{state.professional.cidade}</p>}
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="inline-block rounded-md bg-[#F0FDF4] px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-[#14532D]">
                      Proposta Comercial
                    </span>
                    <p className="mt-2 font-display text-lg font-extrabold text-[#111827] tabular-nums">
                      #{numeroOrcamento}
                    </p>
                    <dl className="mt-2 space-y-1 text-xs text-gray-600 tabular-nums">
                      <div>
                        <span className="text-gray-400">Emissão: </span>
                        <span className="font-medium text-[#111827]">{formatDateBR(dataEmissao)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Válida até: </span>
                        <span className="font-medium text-[#111827]">
                          {formatDateBR(prazoValidade)}
                        </span>
                      </div>
                    </dl>
                  </div>
                </div>

                {/* Client & Proposal Metadata */}
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-gray-200 bg-[#F9FAFB] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Preparado para
                    </p>
                    <p className="mt-1 text-sm font-bold text-[#111827]">
                      {nomeCliente.trim() || 'Cliente (informe o nome ao lado)'}
                    </p>
                    {empresaCliente.trim() && (
                      <p className="mt-0.5 text-xs text-gray-600">{empresaCliente.trim()}</p>
                    )}
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-[#F9FAFB] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Prazo estimado de entrega
                    </p>
                    <p className="mt-1 text-sm font-bold text-[#111827]">
                      {prazoEntrega.trim() || 'A combinar após aprovação'}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Início imediato mediante confirmação da proposta
                    </p>
                  </div>
                </div>

                {/* Scope Table */}
                <div className="mt-6">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Escopo e investimento
                  </p>
                  <div className="mt-2 overflow-hidden rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between border-b border-gray-200 bg-[#F3F4F6] px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-600">
                      <span>Descrição do serviço</span>
                      <span>Investimento</span>
                    </div>
                    <div className="flex items-start justify-between gap-6 px-4 py-5">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[#111827]">
                          {nomeServico.trim() || 'Serviço'}
                        </p>
                        {descricao.trim() && (
                          <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-gray-600">
                            {descricao.trim()}
                          </p>
                        )}
                      </div>
                      <p className="shrink-0 text-sm font-bold text-[#111827] tabular-nums">
                        {formatCurrencyBRL(safeValor)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Highlighted Total */}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-[#14532D] px-6 py-5 text-white">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-200">
                      Investimento total
                    </p>
                    <p className="mt-0.5 text-[11px] text-emerald-100/80">
                      Valor garantido para aprovação até {formatDateBR(prazoValidade)}
                    </p>
                  </div>
                  <p className="font-display text-3xl font-extrabold tracking-tight tabular-nums">
                    {formatCurrencyBRL(safeValor)}
                  </p>
                </div>

                {/* Commercial Notes */}
                {observacoes.trim() && (
                  <div className="mt-6 rounded-xl border border-gray-200 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Condições comerciais e observações
                    </p>
                    <p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-gray-600">
                      {observacoes.trim()}
                    </p>
                  </div>
                )}

                {/* Approval / Acceptance Block */}
                {incluirAssinatura && (
                  <div className="mt-8 grid grid-cols-1 gap-6 border-t border-gray-200 pt-6 sm:grid-cols-2">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Responsável pela proposta
                      </p>
                      <div className="mt-7 border-b border-gray-300" />
                      <p className="mt-1.5 text-xs font-semibold text-gray-700">
                        {nomeProfissional.trim() || 'Profissional Responsável'}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        Emitido em {formatDateBR(dataEmissao)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        De acordo do cliente
                      </p>
                      <div className="mt-7 border-b border-gray-300" />
                      <p className="mt-1.5 text-xs font-semibold text-gray-700">
                        {nomeCliente.trim() || 'Assinatura / Aprovação'}
                      </p>
                      <p className="text-[11px] text-gray-400">Data: ____ / ____ / ________</p>
                    </div>
                  </div>
                )}

                {/* Minimal Footer */}
                <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-4 text-[10px] text-gray-400">
                  <span>Proposta #{numeroOrcamento}</span>
                  <span>Gerado com Preço Justo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
