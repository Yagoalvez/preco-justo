import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Briefcase,
  Calculator,
  FileText,
  Clock,
  X,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SERVICE_CATEGORIES, ServiceCategory, ServiceItem } from '../types';
import { formatCurrencyBRL, formatHours, parseNumericInput } from '../utils/format';
import { calculatePricing, getEffectiveMonthlyCosts } from '../utils/pricing';
import { ConfirmModal } from '../components/ConfirmModal';
import { DemoBadge, EmptyState } from '../components/EmptyState';

type SortOption = 'recent' | 'name' | 'price_asc' | 'price_desc';

export const ServicesPage: React.FC = () => {
  const {
    state,
    totalMonthlyCosts,
    addService,
    updateService,
    deleteService,
    loadDemoData,
    openQuoteModal,
    openCalculatorWithPrefill,
    notify,
  } = useApp();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState<ServiceCategory>('Design');
  const [descricao, setDescricao] = useState('');
  const [tempoStr, setTempoStr] = useState('');
  const [custoAdicionalStr, setCustoAdicionalStr] = useState('0');
  const [margemStr, setMargemStr] = useState(String(state.profile.margemLucroPadrao));
  const [impostosStr, setImpostosStr] = useState(String(state.profile.impostosTaxasPadrao));
  const [precoStr, setPrecoStr] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<ServiceItem | null>(null);

  useEffect(() => {
    if (!formOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFormOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [formOpen]);

  const filteredServices = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = state.services.filter((s) => {
      const matchCat = categoryFilter === 'ALL' || s.categoria === categoryFilter;
      const matchText =
        !q ||
        s.nome.toLowerCase().includes(q) ||
        s.descricao.toLowerCase().includes(q) ||
        s.categoria.toLowerCase().includes(q);
      return matchCat && matchText;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'name') return a.nome.localeCompare(b.nome, 'pt-BR');
      if (sortBy === 'price_asc') return a.precoRecomendado - b.precoRecomendado;
      if (sortBy === 'price_desc') return b.precoRecomendado - a.precoRecomendado;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [state.services, search, categoryFilter, sortBy]);

  const openNewForm = () => {
    setEditingId(null);
    setNome('');
    setCategoria('Design');
    setDescricao('');
    setTempoStr('');
    setCustoAdicionalStr('0');
    setMargemStr(String(state.profile.margemLucroPadrao));
    setImpostosStr(String(state.profile.impostosTaxasPadrao));
    setPrecoStr('');
    setFormError(null);
    setFormOpen(true);
  };

  const openEditForm = (item: ServiceItem) => {
    setEditingId(item.id);
    setNome(item.nome);
    setCategoria(item.categoria);
    setDescricao(item.descricao);
    setTempoStr(String(item.tempoEstimado));
    setCustoAdicionalStr(String(item.custoAdicional));
    setMargemStr(String(item.margemLucro ?? state.profile.margemLucroPadrao));
    setImpostosStr(String(item.impostosTaxas ?? state.profile.impostosTaxasPadrao));
    setPrecoStr(String(item.precoRecomendado));
    setFormError(null);
    setFormOpen(true);
  };

  const handleAutoCalculatePrice = () => {
    const horas = parseNumericInput(tempoStr, NaN);
    const extra = parseNumericInput(custoAdicionalStr, 0);
    const margem = parseNumericInput(margemStr, NaN);
    const impostos = parseNumericInput(impostosStr, NaN);
    if (!Number.isFinite(horas) || horas <= 0) {
      setFormError('Informe primeiro o tempo estimado (em horas) para calcular o preço.');
      return;
    }
    if (!Number.isFinite(extra) || extra < 0) {
      setFormError('O custo adicional não pode ser negativo.');
      return;
    }
    if (
      !Number.isFinite(margem) ||
      !Number.isFinite(impostos) ||
      margem < 0 ||
      impostos < 0 ||
      margem + impostos >= 100
    ) {
      setFormError('A soma da margem de lucro com impostos e taxas deve ser menor que 100%.');
      return;
    }
    const custosFixosMensais = getEffectiveMonthlyCosts(state.profile, totalMonthlyCosts);
    const calc = calculatePricing({
      remuneracaoMensal: state.profile.remuneracaoMensal,
      custosFixosMensais,
      diasTrabalhadosMes: state.profile.diasTrabalhadosMes,
      horasProdutivasDia: state.profile.horasProdutivasDia,
      percentualFaturavel: state.profile.percentualFaturavel,
      horasNecessarias: horas,
      custosAdicionais: extra,
      margemLucro: margem,
      impostosTaxas: impostos,
    });

    if (!calc.ok) {
      setFormError(
        'Configure sua remuneração desejada na Calculadora ou Configurações antes do cálculo automático.'
      );
      return;
    }

    setPrecoStr(calc.data.precoRecomendado.toFixed(2));
    setFormError(null);
    notify({
      type: 'info',
      title: 'Preço sugerido calculado',
      description: `Baseado no seu perfil atual (${margem}% margem e ${impostos}% impostos).`,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tempo = parseNumericInput(tempoStr, NaN);
    const extra = parseNumericInput(custoAdicionalStr, 0);
    const margem = parseNumericInput(margemStr, NaN);
    const impostos = parseNumericInput(impostosStr, NaN);
    const preco = parseNumericInput(precoStr, NaN);

    if (!nome.trim()) {
      setFormError('Informe o nome do serviço.');
      return;
    }
    if (!Number.isFinite(tempo) || tempo <= 0) {
      setFormError('Informe um tempo estimado maior que zero.');
      return;
    }
    if (!Number.isFinite(extra) || extra < 0) {
      setFormError('O custo adicional não pode ser negativo.');
      return;
    }
    if (
      !Number.isFinite(margem) ||
      !Number.isFinite(impostos) ||
      margem < 0 ||
      impostos < 0 ||
      margem + impostos >= 100
    ) {
      setFormError('A soma da margem de lucro com impostos e taxas deve ser menor que 100%.');
      return;
    }
    if (!Number.isFinite(preco) || preco <= 0) {
      setFormError('Informe um preço recomendado maior que zero.');
      return;
    }

    if (editingId) {
      updateService(editingId, {
        nome: nome.trim(),
        categoria,
        descricao: descricao.trim(),
        tempoEstimado: tempo,
        custoAdicional: Number(extra.toFixed(2)),
        margemLucro: margem,
        impostosTaxas: impostos,
        precoRecomendado: Number(preco.toFixed(2)),
      });
    } else {
      addService({
        nome: nome.trim(),
        categoria,
        descricao: descricao.trim(),
        tempoEstimado: tempo,
        custoAdicional: Number(extra.toFixed(2)),
        precoRecomendado: Number(preco.toFixed(2)),
        margemLucro: margem,
        impostosTaxas: impostos,
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
            Meus serviços
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
            Organize seu catálogo de serviços com tempos estimados e preços recomendados prontos
            para orçamento.
          </p>
        </div>

        <button
          type="button"
          onClick={openNewForm}
          className="inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#16A34A] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#15803D]"
        >
          <Plus className="h-4 w-4" />
          Novo serviço
        </button>
      </div>

      {/* Filters */}
      {state.services.length > 0 && (
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar serviços por nome ou descrição..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-[#111827] outline-none focus:border-[#16A34A] dark:border-slate-800 dark:bg-[#111827] dark:text-white"
            />
          </div>
          <select
            aria-label="Filtrar categoria de serviço"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-[#111827] outline-none focus:border-[#16A34A] dark:border-slate-800 dark:bg-[#111827] dark:text-white md:w-48"
          >
            <option value="ALL">Todas categorias</option>
            {SERVICE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <select
            aria-label="Ordenar serviços"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-[#111827] outline-none focus:border-[#16A34A] dark:border-slate-800 dark:bg-[#111827] dark:text-white md:w-48"
          >
            <option value="recent">Mais recentes</option>
            <option value="name">Ordem alfabética</option>
            <option value="price_desc">Maior preço</option>
            <option value="price_asc">Menor preço</option>
          </select>
        </div>
      )}

      {/* Services Grid or Empty State */}
      {state.services.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="Nenhum serviço cadastrado ainda"
          description="Monte seu catálogo com tempos estimados, custos diretos e preços recomendados para gerar propostas em segundos."
          primaryAction={{ label: 'Cadastrar primeiro serviço', onClick: openNewForm }}
          secondaryAction={{ label: 'Carregar dados demonstrativos', onClick: loadDemoData }}
        />
      ) : filteredServices.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-[#111827]">
          <p className="text-sm font-semibold text-[#111827] dark:text-white">
            Nenhum serviço encontrado
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setCategoryFilter('ALL');
            }}
            className="mt-3 text-xs font-semibold text-[#16A34A] hover:underline"
          >
            Limpar pesquisa e filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredServices.map((service) => (
            <article
              key={service.id}
              className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 transition-colors hover:border-gray-300 dark:border-slate-700/80 dark:bg-[#111827] dark:hover:border-slate-600"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-lg bg-[#F3F4F6] px-2.5 py-1 text-xs font-semibold text-gray-700 dark:bg-[#1A2333] dark:text-slate-200">
                      {service.categoria}
                    </span>
                    {service.isDemo && <DemoBadge />}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditForm(service)}
                      title="Editar serviço"
                      aria-label={`Editar ${service.nome}`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-gray-500 transition-colors hover:border-gray-200 hover:bg-gray-100 hover:text-[#111827] dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(service)}
                      title="Excluir serviço"
                      aria-label={`Excluir ${service.nome}`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-gray-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:text-slate-300 dark:hover:border-red-900/60 dark:hover:bg-red-950/50 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <h2 className="mt-2.5 font-display text-lg font-bold text-[#111827] dark:text-white">
                  {service.nome}
                </h2>
                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-gray-600 dark:text-slate-300">
                  {service.descricao || 'Sem descrição cadastrada.'}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-gray-100 pt-3.5 text-xs text-gray-600 dark:border-slate-800 dark:text-slate-300">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-gray-400 dark:text-slate-400" />
                    Tempo:{' '}
                    <strong className="font-semibold text-[#111827] tabular-nums dark:text-white">
                      {formatHours(service.tempoEstimado)}
                    </strong>
                  </span>
                  <span>
                    Custo adicional:{' '}
                    <strong className="font-semibold text-[#111827] tabular-nums dark:text-white">
                      {formatCurrencyBRL(service.custoAdicional)}
                    </strong>
                  </span>
                  <span>
                    Margem:{' '}
                    <strong className="font-semibold text-[#111827] tabular-nums dark:text-white">
                      {service.margemLucro}%
                    </strong>
                  </span>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-gray-100 pt-4 dark:border-slate-800">
                <div>
                  <span className="block text-xs font-medium text-gray-600 dark:text-slate-400">
                    Preço recomendado
                  </span>
                  <span className="font-display text-xl font-extrabold text-[#14532D] tabular-nums dark:text-emerald-400">
                    {formatCurrencyBRL(service.precoRecomendado)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      openCalculatorWithPrefill({
                        step: 2,
                        service: {
                          nome: service.nome,
                          categoria: service.categoria,
                          descricao: service.descricao,
                          horasNecessarias: service.tempoEstimado,
                          custosAdicionais: service.custoAdicional,
                          margemLucro: service.margemLucro ?? state.profile.margemLucroPadrao,
                          impostosTaxas: service.impostosTaxas ?? state.profile.impostosTaxasPadrao,
                        },
                      })
                    }
                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-700 dark:bg-[#1A2333] dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <Calculator className="h-3.5 w-3.5" />
                    Recalcular
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      openQuoteModal({
                        nomeServico: service.nome,
                        descricao: service.descricao,
                        valorFinal: service.precoRecomendado,
                      })
                    }
                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-[#16A34A] px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#15803D]"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Orçamento
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Add / Edit Service Modal */}
      {formOpen && (
        <div
          className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[1px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="service-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setFormOpen(false);
          }}
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-[#111827]">
            <div className="flex items-center justify-between">
              <h2
                id="service-modal-title"
                className="font-display text-lg font-bold text-[#111827] dark:text-white"
              >
                {editingId ? 'Editar serviço' : 'Cadastrar novo serviço'}
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="srv-name"
                    className="block text-xs font-semibold text-gray-700 dark:text-slate-300"
                  >
                    Nome do serviço
                  </label>
                  <input
                    id="srv-name"
                    type="text"
                    placeholder="Ex.: Desenvolvimento de landing page"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-[#111827] outline-none focus:border-[#16A34A] dark:border-slate-600/80 dark:bg-[#1A2333] dark:text-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="srv-cat"
                    className="block text-xs font-semibold text-gray-700 dark:text-slate-300"
                  >
                    Categoria
                  </label>
                  <select
                    id="srv-cat"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value as ServiceCategory)}
                    className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-[#111827] outline-none focus:border-[#16A34A] dark:border-slate-600/80 dark:bg-[#1A2333] dark:text-white"
                  >
                    {SERVICE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="srv-desc"
                  className="block text-xs font-semibold text-gray-700 dark:text-slate-300"
                >
                  Descrição do escopo
                </label>
                <textarea
                  id="srv-desc"
                  rows={3}
                  placeholder="O que está incluído na entrega deste serviço..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="mt-1.5 w-full resize-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-[#111827] outline-none focus:border-[#16A34A] dark:border-slate-600/80 dark:bg-[#1A2333] dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="srv-hours"
                    className="block text-xs font-semibold text-gray-700 dark:text-slate-300"
                  >
                    Tempo estimado (horas)
                  </label>
                  <input
                    id="srv-hours"
                    type="number"
                    min="0.5"
                    step="0.5"
                    placeholder="10"
                    value={tempoStr}
                    onChange={(e) => setTempoStr(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-medium text-[#111827] outline-none tabular-nums focus:border-[#16A34A] dark:border-slate-600/80 dark:bg-[#1A2333] dark:text-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="srv-extra"
                    className="block text-xs font-semibold text-gray-700 dark:text-slate-300"
                  >
                    Custo adicional (R$)
                  </label>
                  <div className="relative mt-1.5">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                      R$
                    </span>
                    <input
                      id="srv-extra"
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={custoAdicionalStr}
                      onChange={(e) => setCustoAdicionalStr(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3.5 text-sm font-medium text-[#111827] outline-none tabular-nums focus:border-[#16A34A] dark:border-slate-600/80 dark:bg-[#1A2333] dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="srv-margin"
                    className="block text-xs font-semibold text-gray-700 dark:text-slate-300"
                  >
                    Margem de lucro (%)
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      id="srv-margin"
                      type="number"
                      min="0"
                      max="99"
                      step="1"
                      value={margemStr}
                      onChange={(e) => setMargemStr(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-3.5 pr-8 text-sm font-medium text-[#111827] outline-none tabular-nums focus:border-[#16A34A] dark:border-slate-600/80 dark:bg-[#1A2333] dark:text-white"
                    />
                    <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                      %
                    </span>
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="srv-tax"
                    className="block text-xs font-semibold text-gray-700 dark:text-slate-300"
                  >
                    Impostos e taxas (%)
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      id="srv-tax"
                      type="number"
                      min="0"
                      max="99"
                      step="0.5"
                      value={impostosStr}
                      onChange={(e) => setImpostosStr(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-3.5 pr-8 text-sm font-medium text-[#111827] outline-none tabular-nums focus:border-[#16A34A] dark:border-slate-600/80 dark:bg-[#1A2333] dark:text-white"
                    />
                    <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                      %
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="srv-price"
                    className="block text-xs font-semibold text-gray-700 dark:text-slate-300"
                  >
                    Preço recomendado (R$)
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoCalculatePrice}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#16A34A] hover:underline dark:text-emerald-400"
                  >
                    <Sparkles className="h-3 w-3" />
                    Sugerir com meu perfil atual
                  </button>
                </div>
                <div className="relative mt-1.5">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                    R$
                  </span>
                  <input
                    id="srv-price"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="1500.00"
                    value={precoStr}
                    onChange={(e) => setPrecoStr(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3.5 text-sm font-semibold text-[#111827] outline-none tabular-nums focus:border-[#16A34A] dark:border-slate-600/80 dark:bg-[#1A2333] dark:text-white"
                  />
                </div>
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
                  {editingId ? 'Salvar alterações' : 'Salvar serviço'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Excluir serviço?"
        description={
          deleteTarget
            ? `O serviço "${deleteTarget.nome}" será removido permanentemente do seu catálogo.`
            : ''
        }
        confirmLabel="Excluir serviço"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteService(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
};
