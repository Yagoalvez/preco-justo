import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Eye,
  CopyPlus,
  Trash2,
  History,
  FileDown,
  Calculator,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CalculationHistoryItem, SERVICE_CATEGORIES } from '../types';
import {
  formatCurrencyBRL,
  formatDateBR,
  formatDateTimeBR,
  formatHours,
  formatPercent,
} from '../utils/format';
import { ConfirmModal } from '../components/ConfirmModal';
import { DemoBadge, EmptyState } from '../components/EmptyState';

export const HistoryPage: React.FC = () => {
  const {
    state,
    duplicateHistoryItem,
    deleteHistoryItem,
    setActivePage,
    loadDemoData,
    openQuoteModal,
    openCalculatorWithPrefill,
  } = useApp();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [selectedItem, setSelectedItem] = useState<CalculationHistoryItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CalculationHistoryItem | null>(null);

  useEffect(() => {
    if (!selectedItem) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedItem(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedItem]);

  const filteredHistory = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.history.filter((item) => {
      const matchCat = categoryFilter === 'ALL' || item.categoria === categoryFilter;
      const matchText =
        !q ||
        item.serviceName.toLowerCase().includes(q) ||
        item.categoria.toLowerCase().includes(q) ||
        item.descricao.toLowerCase().includes(q);
      return matchCat && matchText;
    });
  }, [state.history, search, categoryFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-[#111827] dark:text-white sm:text-3xl">
            Histórico de cálculos
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
            Consulte, duplique ou gere orçamentos a partir de qualquer precificação salva.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setActivePage('calculator')}
          className="inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#16A34A] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#15803D]"
        >
          <Calculator className="h-4 w-4" />
          Novo cálculo
        </button>
      </div>

      {/* Filters */}
      {state.history.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar cálculo pelo nome do serviço..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-[#111827] outline-none focus:border-[#16A34A] dark:border-slate-800 dark:bg-[#111827] dark:text-white"
            />
          </div>
          <select
            aria-label="Filtrar histórico por categoria"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-[#111827] outline-none focus:border-[#16A34A] dark:border-slate-800 dark:bg-[#111827] dark:text-white sm:w-52"
          >
            <option value="ALL">Todas as categorias</option>
            {SERVICE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* List or Empty */}
      {state.history.length === 0 ? (
        <EmptyState
          icon={History}
          title="Nenhum cálculo salvo no histórico"
          description="Ao concluir uma precificação na calculadora, clique em 'Salvar cálculo' para registrar aqui e consultar sempre que precisar."
          primaryAction={{
            label: 'Abrir calculadora de preços',
            onClick: () => setActivePage('calculator'),
          }}
          secondaryAction={{ label: 'Carregar dados demonstrativos', onClick: loadDemoData }}
        />
      ) : filteredHistory.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-[#111827]">
          <p className="text-sm font-semibold text-[#111827] dark:text-white">
            Nenhum registro corresponde à busca
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setCategoryFilter('ALL');
            }}
            className="mt-3 text-xs font-semibold text-[#16A34A] hover:underline"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-slate-700/80 dark:bg-[#111827]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
              <thead>
                <tr className="border-b border-gray-200/80 bg-gray-50/80 text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:border-slate-700/80 dark:bg-[#161F2E] dark:text-slate-300">
                  <th className="whitespace-nowrap px-5 py-3.5">Data</th>
                  <th className="whitespace-nowrap px-4 py-3.5">Serviço</th>
                  <th className="whitespace-nowrap px-4 py-3.5 text-right">Custo</th>
                  <th className="whitespace-nowrap px-4 py-3.5 text-right">Preço recomendado</th>
                  <th className="whitespace-nowrap px-4 py-3.5 text-right">Margem de lucro</th>
                  <th className="whitespace-nowrap px-5 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm dark:divide-slate-800">
                {filteredHistory.map((item) => (
                  <tr
                    key={item.id}
                    className="transition-colors hover:bg-gray-50/80 dark:hover:bg-slate-800/50"
                  >
                    <td className="whitespace-nowrap px-5 py-3.5 text-xs text-gray-600 tabular-nums dark:text-slate-300">
                      {formatDateBR(item.data)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-[#111827] dark:text-white">
                          {item.serviceName}
                        </span>
                        {item.isDemo && <DemoBadge />}
                      </div>
                      <span className="text-xs text-gray-600 dark:text-slate-400">
                        {item.categoria} · {formatHours(item.inputs.horasNecessarias)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right text-xs font-medium text-gray-700 tabular-nums dark:text-slate-200">
                      {formatCurrencyBRL(item.result.custoServico)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right font-bold text-[#14532D] tabular-nums dark:text-emerald-400">
                      {formatCurrencyBRL(item.result.precoRecomendado)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right">
                      <span className="inline-flex rounded-lg bg-[#F0FDF4] px-2.5 py-0.5 text-xs font-semibold text-[#14532D] tabular-nums dark:bg-emerald-950/70 dark:text-emerald-300">
                        {formatPercent(item.result.margemEfetiva, 1)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedItem(item)}
                          title="Consultar detalhes"
                          aria-label={`Consultar ${item.serviceName}`}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-gray-500 transition-colors hover:border-gray-200 hover:bg-gray-100 hover:text-[#111827] dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => duplicateHistoryItem(item.id)}
                          title="Duplicar cálculo"
                          aria-label={`Duplicar ${item.serviceName}`}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-gray-500 transition-colors hover:border-[#16A34A]/30 hover:bg-[#F0FDF4] hover:text-[#16A34A] dark:text-slate-300 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-400"
                        >
                          <CopyPlus className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(item)}
                          title="Excluir cálculo"
                          aria-label={`Excluir ${item.serviceName}`}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-gray-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:text-slate-300 dark:hover:border-red-900/60 dark:hover:bg-red-950/50 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <div
          className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[1px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="history-detail-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedItem(null);
          }}
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-[#111827]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-lg bg-[#F0FDF4] px-2.5 py-0.5 text-xs font-semibold text-[#14532D] dark:bg-emerald-950/70 dark:text-emerald-300">
                    {selectedItem.categoria}
                  </span>
                  {selectedItem.isDemo && <DemoBadge />}
                  <span className="text-xs text-gray-400">
                    {formatDateTimeBR(selectedItem.data)}
                  </span>
                </div>
                <h2
                  id="history-detail-title"
                  className="mt-2 font-display text-xl font-bold text-[#111827] dark:text-white"
                >
                  {selectedItem.serviceName}
                </h2>
                {selectedItem.descricao && (
                  <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-slate-400">
                    {selectedItem.descricao}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                aria-label="Fechar detalhes"
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 rounded-xl bg-[#14532D] px-5 py-4 text-white dark:bg-emerald-950">
              <p className="text-xs font-medium text-emerald-200">Preço recomendado</p>
              <p className="mt-1 font-display text-3xl font-extrabold tabular-nums">
                {formatCurrencyBRL(selectedItem.result.precoRecomendado)}
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-200 p-3 dark:border-slate-800">
                <p className="text-[11px] text-gray-500 dark:text-slate-400">Custo da hora</p>
                <p className="mt-1 text-sm font-bold text-[#111827] tabular-nums dark:text-white">
                  {formatCurrencyBRL(selectedItem.result.custoHora)}
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 p-3 dark:border-slate-800">
                <p className="text-[11px] text-gray-500 dark:text-slate-400">Custo do serviço</p>
                <p className="mt-1 text-sm font-bold text-[#111827] tabular-nums dark:text-white">
                  {formatCurrencyBRL(selectedItem.result.custoServico)}
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 p-3 dark:border-slate-800">
                <p className="text-[11px] text-gray-500 dark:text-slate-400">Preço mínimo</p>
                <p className="mt-1 text-sm font-bold text-[#111827] tabular-nums dark:text-white">
                  {formatCurrencyBRL(selectedItem.result.precoMinimo)}
                </p>
              </div>
              <div className="rounded-xl border border-[#16A34A]/30 bg-[#F0FDF4]/50 p-3 dark:border-emerald-900/60 dark:bg-emerald-950/30">
                <p className="text-[11px] text-[#14532D] dark:text-emerald-300">Lucro líquido</p>
                <p className="mt-1 text-sm font-bold text-[#16A34A] tabular-nums dark:text-emerald-400">
                  {formatCurrencyBRL(selectedItem.result.lucroLiquidoEstimado)}
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 p-3 dark:border-slate-800">
                <p className="text-[11px] text-gray-500 dark:text-slate-400">Impostos e taxas</p>
                <p className="mt-1 text-sm font-bold text-[#111827] tabular-nums dark:text-white">
                  {formatCurrencyBRL(selectedItem.result.valorImpostosTaxas)}
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 p-3 dark:border-slate-800">
                <p className="text-[11px] text-gray-500 dark:text-slate-400">Margem efetiva</p>
                <p className="mt-1 text-sm font-bold text-[#111827] tabular-nums dark:text-white">
                  {formatPercent(selectedItem.result.margemEfetiva, 1)}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50/70 p-4 text-xs text-gray-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
              <p className="font-semibold text-[#111827] dark:text-white">Parâmetros utilizados</p>
              <div className="mt-2 grid grid-cols-2 gap-y-1.5 sm:grid-cols-3">
                <span>Remuneração: {formatCurrencyBRL(selectedItem.inputs.remuneracaoMensal)}</span>
                <span>Custos fixos: {formatCurrencyBRL(selectedItem.inputs.custosFixosMensais)}</span>
                <span>Horas faturáveis: {formatHours(selectedItem.result.horasFaturaveisMensais)}/mês</span>
                <span>Horas do serviço: {formatHours(selectedItem.inputs.horasNecessarias)}</span>
                <span>Custos adicionais: {formatCurrencyBRL(selectedItem.inputs.custosAdicionais)}</span>
                <span>Impostos: {formatPercent(selectedItem.inputs.impostosTaxas, 1)}</span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  const item = selectedItem;
                  setSelectedItem(null);
                  openCalculatorWithPrefill({
                    step: 2,
                    service: {
                      nome: item.serviceName,
                      categoria: item.categoria,
                      descricao: item.descricao,
                      horasNecessarias: item.inputs.horasNecessarias,
                      custosAdicionais: item.inputs.custosAdicionais,
                      margemLucro: item.inputs.margemLucro,
                      impostosTaxas: item.inputs.impostosTaxas,
                    },
                    profileOverride: {
                      remuneracaoMensal: item.inputs.remuneracaoMensal,
                      usarCustosMensaisAutomaticos: false,
                      custosFixosManuais: item.inputs.custosFixosMensais,
                      diasTrabalhadosMes: item.inputs.diasTrabalhadosMes,
                      horasProdutivasDia: item.inputs.horasProdutivasDia,
                      percentualFaturavel: item.inputs.percentualFaturavel,
                    },
                  });
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Calculator className="h-3.5 w-3.5" />
                Abrir na calculadora
              </button>
              <button
                type="button"
                onClick={() => {
                  const item = selectedItem;
                  setSelectedItem(null);
                  openQuoteModal({
                    nomeServico: item.serviceName,
                    descricao: item.descricao,
                    valorFinal: item.result.precoRecomendado,
                  });
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#16A34A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#15803D]"
              >
                <FileDown className="h-3.5 w-3.5" />
                Gerar orçamento em PDF
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Excluir cálculo do histórico?"
        description={
          deleteTarget
            ? `O registro de "${deleteTarget.serviceName}" será removido permanentemente do histórico.`
            : ''
        }
        confirmLabel="Excluir registro"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteHistoryItem(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
};
