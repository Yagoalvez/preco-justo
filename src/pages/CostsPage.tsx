import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Receipt,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { COST_CATEGORIES, CostCategory, MonthlyCost } from '../types';
import { formatCurrencyBRL, parseNumericInput } from '../utils/format';
import { calculateProfileSummary } from '../utils/pricing';
import { ConfirmModal } from '../components/ConfirmModal';
import { DemoBadge, EmptyState } from '../components/EmptyState';

export const CostsPage: React.FC = () => {
  const {
    state,
    totalMonthlyCosts,
    addCost,
    updateCost,
    deleteCost,
    loadDemoData,
    setActivePage,
  } = useApp();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState<CostCategory>('Internet');
  const [valorStr, setValorStr] = useState('');
  const [observacao, setObservacao] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<MonthlyCost | null>(null);

  useEffect(() => {
    if (!formOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFormOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [formOpen]);

  const profileSummary = useMemo(
    () => calculateProfileSummary(state.profile, totalMonthlyCosts),
    [state.profile, totalMonthlyCosts]
  );

  const hourlyCostImpact = useMemo(() => {
    if (!profileSummary || profileSummary.horasFaturaveisMensais <= 0) return null;
    return totalMonthlyCosts / profileSummary.horasFaturaveisMensais;
  }, [profileSummary, totalMonthlyCosts]);

  const filteredCosts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.costs.filter((c) => {
      const matchCat = categoryFilter === 'ALL' || c.categoria === categoryFilter;
      const matchText =
        !q ||
        c.nome.toLowerCase().includes(q) ||
        c.categoria.toLowerCase().includes(q) ||
        (c.observacao ?? '').toLowerCase().includes(q);
      return matchCat && matchText;
    });
  }, [state.costs, search, categoryFilter]);

  const openNewForm = () => {
    setEditingId(null);
    setNome('');
    setCategoria('Internet');
    setValorStr('');
    setObservacao('');
    setFormError(null);
    setFormOpen(true);
  };

  const openEditForm = (cost: MonthlyCost) => {
    setEditingId(cost.id);
    setNome(cost.nome);
    setCategoria(cost.categoria);
    setValorStr(String(cost.valor));
    setObservacao(cost.observacao ?? '');
    setFormError(null);
    setFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedValue = parseNumericInput(valorStr, NaN);
    if (!nome.trim()) {
      setFormError('Informe o nome ou descrição da despesa.');
      return;
    }
    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
      setFormError('Informe um valor mensal maior que zero.');
      return;
    }

    if (editingId) {
      updateCost(editingId, {
        nome: nome.trim(),
        categoria,
        valor: Number(parsedValue.toFixed(2)),
        observacao: observacao.trim() || undefined,
      });
    } else {
      addCost({
        nome: nome.trim(),
        categoria,
        valor: Number(parsedValue.toFixed(2)),
        observacao: observacao.trim() || undefined,
      });
    }
    setFormOpen(false);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-[#111827] dark:text-white sm:text-3xl">
            Custos mensais
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
            Cadastre suas despesas operacionais fixas. O total é integrado automaticamente na
            calculadora.
          </p>
        </div>

        <button
          type="button"
          onClick={openNewForm}
          className="inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#16A34A] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#15803D]"
        >
          <Plus className="h-4 w-4" />
          Nova despesa
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="col-span-2 rounded-2xl border border-[#16A34A]/35 bg-white p-4 sm:col-span-1 sm:p-5 dark:border-emerald-700/60 dark:bg-[#111827]">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-slate-300">
            Total mensal de custos fixos
          </p>
          <p className="mt-2 font-display text-2xl font-extrabold text-[#14532D] tabular-nums dark:text-emerald-400">
            {formatCurrencyBRL(totalMonthlyCosts)}
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-[#16A34A] dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>
              {state.profile.usarCustosMensaisAutomaticos
                ? 'Sincronizado com a calculadora'
                : 'Modo manual ativo na calculadora'}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 dark:border-slate-700/80 dark:bg-[#111827]">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-slate-300">
            Despesas
          </p>
          <p className="mt-2 font-display text-xl font-extrabold text-[#111827] tabular-nums dark:text-white sm:text-2xl">
            {state.costs.length}
          </p>
          <p className="mt-2 text-xs text-gray-600 dark:text-slate-400">
            {new Set(state.costs.map((c) => c.categoria)).size} categorias utilizadas
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 dark:border-slate-700/80 dark:bg-[#111827]">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-slate-300">
            Impacto / hora
          </p>
          <p className="mt-2 font-display text-xl font-extrabold text-[#111827] tabular-nums dark:text-white sm:text-2xl">
            {hourlyCostImpact !== null ? `${formatCurrencyBRL(hourlyCostImpact)}/h` : '—'}
          </p>
          <button
            type="button"
            onClick={() => setActivePage('calculator')}
            className="mt-2 text-xs font-semibold text-[#16A34A] hover:underline dark:text-emerald-400"
          >
            Ver na calculadora
          </button>
        </div>
      </div>

      {/* Filters */}
      {state.costs.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar despesa por nome ou observação..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-[#111827] outline-none focus:border-[#16A34A] dark:border-slate-800 dark:bg-[#111827] dark:text-white"
            />
          </div>
          <select
            aria-label="Filtrar por categoria"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-[#111827] outline-none focus:border-[#16A34A] dark:border-slate-800 dark:bg-[#111827] dark:text-white sm:w-56"
          >
            <option value="ALL">Todas as categorias</option>
            {COST_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* List or Empty State */}
      {state.costs.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Nenhum custo mensal cadastrado"
          description="Registre suas contas recorrentes — internet, energia, softwares, aluguel, contabilidade — para que seu preço hora cubra toda a sua estrutura."
          primaryAction={{ label: 'Cadastrar primeira despesa', onClick: openNewForm }}
          secondaryAction={{ label: 'Carregar dados demonstrativos', onClick: loadDemoData }}
        />
      ) : filteredCosts.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-[#111827]">
          <p className="text-sm font-semibold text-[#111827] dark:text-white">
            Nenhuma despesa encontrada para este filtro
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
            <table className="w-full min-w-[600px] text-left">
              <thead>
                <tr className="border-b border-gray-200/80 bg-gray-50/80 text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:border-slate-700/80 dark:bg-[#161F2E] dark:text-slate-300">
                  <th className="px-5 py-3.5">Despesa</th>
                  <th className="px-4 py-3.5">Categoria</th>
                  <th className="px-4 py-3.5 text-right">Valor mensal</th>
                  <th className="px-4 py-3.5 text-right">Participação</th>
                  <th className="px-5 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm dark:divide-slate-800">
                {filteredCosts.map((cost) => {
                  const pct = totalMonthlyCosts > 0 ? (cost.valor / totalMonthlyCosts) * 100 : 0;
                  return (
                    <tr
                      key={cost.id}
                      className="transition-colors hover:bg-gray-50/80 dark:hover:bg-slate-800/50"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-[#111827] dark:text-white">
                            {cost.nome}
                          </span>
                          {cost.isDemo && <DemoBadge />}
                        </div>
                        {cost.observacao && (
                          <p className="mt-0.5 text-xs text-gray-600 dark:text-slate-400">
                            {cost.observacao}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex rounded-lg bg-[#F3F4F6] px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-[#1A2333] dark:text-slate-200">
                          {cost.categoria}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold text-[#111827] tabular-nums dark:text-white">
                        {formatCurrencyBRL(cost.valor)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right text-xs font-medium text-gray-600 tabular-nums dark:text-slate-300">
                        {pct.toFixed(1).replace('.', ',')}%
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditForm(cost)}
                            title="Editar despesa"
                            aria-label={`Editar ${cost.nome}`}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-gray-500 transition-colors hover:border-gray-200 hover:bg-gray-100 hover:text-[#111827] dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(cost)}
                            title="Excluir despesa"
                            aria-label={`Excluir ${cost.nome}`}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-gray-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:text-slate-300 dark:hover:border-red-900/60 dark:hover:bg-red-950/50 dark:hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {formOpen && (
        <div
          className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[1px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cost-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setFormOpen(false);
          }}
        >
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-[#111827]">
            <div className="flex items-center justify-between">
              <h2
                id="cost-modal-title"
                className="font-display text-lg font-bold text-[#111827] dark:text-white"
              >
                {editingId ? 'Editar despesa mensal' : 'Cadastrar despesa mensal'}
              </h2>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                aria-label="Fechar"
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="cost-name"
                  className="block text-xs font-semibold text-gray-700 dark:text-slate-300"
                >
                  Nome da despesa
                </label>
                <input
                  id="cost-name"
                  type="text"
                  placeholder="Ex.: Internet fibra óptica"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-[#111827] outline-none focus:border-[#16A34A] dark:border-slate-600/80 dark:bg-[#1A2333] dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="cost-category"
                    className="block text-xs font-semibold text-gray-700 dark:text-slate-300"
                  >
                    Categoria
                  </label>
                  <select
                    id="cost-category"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value as CostCategory)}
                    className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-[#111827] outline-none focus:border-[#16A34A] dark:border-slate-600/80 dark:bg-[#1A2333] dark:text-white"
                  >
                    {COST_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="cost-value"
                    className="block text-xs font-semibold text-gray-700 dark:text-slate-300"
                  >
                    Valor mensal (R$)
                  </label>
                  <div className="relative mt-1.5">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                      R$
                    </span>
                    <input
                      id="cost-value"
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="149.90"
                      value={valorStr}
                      onChange={(e) => setValorStr(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3.5 text-sm font-medium text-[#111827] outline-none tabular-nums focus:border-[#16A34A] dark:border-slate-600/80 dark:bg-[#1A2333] dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="cost-obs"
                  className="block text-xs font-semibold text-gray-700 dark:text-slate-300"
                >
                  Observação <span className="font-normal text-gray-400">(opcional)</span>
                </label>
                <input
                  id="cost-obs"
                  type="text"
                  placeholder="Ex.: Rateio home office ou plano anual parcelado"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-[#111827] outline-none focus:border-[#16A34A] dark:border-slate-600/80 dark:bg-[#1A2333] dark:text-white"
                />
              </div>

              {formError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 dark:bg-red-950/40 dark:text-red-400">
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#16A34A] px-5 py-2 text-sm font-semibold text-white hover:bg-[#15803D]"
                >
                  {editingId ? 'Salvar alterações' : 'Adicionar despesa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Excluir despesa mensal?"
        description={
          deleteTarget
            ? `A despesa "${deleteTarget.nome}" (${formatCurrencyBRL(deleteTarget.valor)}) será removida do seu total operacional mensal.`
            : ''
        }
        confirmLabel="Excluir despesa"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteCost(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
};
