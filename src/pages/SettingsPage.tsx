import React, { useEffect, useRef, useState } from 'react';
import {
  Save,
  Sun,
  Moon,
  Database,
  Trash2,
  Download,
  Upload,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ConfirmModal } from '../components/ConfirmModal';

export const SettingsPage: React.FC = () => {
  const {
    state,
    setTheme,
    updateProfessional,
    updateProfile,
    hasDemoData,
    loadDemoData,
    clearDemoData,
    resetAllData,
    createBackupJson,
    importBackup,
    openOnboarding,
    notify,
  } = useApp();

  // Professional info form
  const [nomeProfissional, setNomeProfissional] = useState(state.professional.nomeProfissional);
  const [especialidade, setEspecialidade] = useState(state.professional.especialidade);
  const [email, setEmail] = useState(state.professional.email);
  const [telefone, setTelefone] = useState(state.professional.telefone);
  const [documento, setDocumento] = useState(state.professional.documento);
  const [cidade, setCidade] = useState(state.professional.cidade);
  const [validadeDias, setValidadeDias] = useState(String(state.professional.validadePadraoDias));
  const [observacoesPadrao, setObservacoesPadrao] = useState(state.professional.observacoesPadrao);

  // Default calculator margins
  const [margemPadrao, setMargemPadrao] = useState(String(state.profile.margemLucroPadrao));
  const [impostosPadrao, setImpostosPadrao] = useState(String(state.profile.impostosTaxasPadrao));

  const [confirmReset, setConfirmReset] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setNomeProfissional(state.professional.nomeProfissional);
    setEspecialidade(state.professional.especialidade);
    setEmail(state.professional.email);
    setTelefone(state.professional.telefone);
    setDocumento(state.professional.documento);
    setCidade(state.professional.cidade);
    setValidadeDias(String(state.professional.validadePadraoDias));
    setObservacoesPadrao(state.professional.observacoesPadrao);
    setMargemPadrao(String(state.profile.margemLucroPadrao));
    setImpostosPadrao(String(state.profile.impostosTaxasPadrao));
  }, [state.professional, state.profile.margemLucroPadrao, state.profile.impostosTaxasPadrao]);

  const handleSaveProfessional = (e: React.FormEvent) => {
    e.preventDefault();
    const validade = Number(validadeDias);
    const margem = Number(margemPadrao.replace(',', '.'));
    const impostos = Number(impostosPadrao.replace(',', '.'));

    if (!Number.isFinite(validade) || validade <= 0) {
      notify({
        type: 'error',
        title: 'Validade inválida',
        description: 'Informe um prazo de validade padrão maior que zero dias.',
      });
      return;
    }

    if (
      !Number.isFinite(margem) ||
      !Number.isFinite(impostos) ||
      margem < 0 ||
      impostos < 0 ||
      margem + impostos >= 100
    ) {
      notify({
        type: 'error',
        title: 'Percentuais padrão inválidos',
        description: 'A soma da margem padrão com impostos deve ser menor que 100%.',
      });
      return;
    }

    updateProfessional({
      nomeProfissional: nomeProfissional.trim(),
      especialidade: especialidade.trim(),
      email: email.trim(),
      telefone: telefone.trim(),
      documento: documento.trim(),
      cidade: cidade.trim(),
      validadePadraoDias: Math.round(validade),
      observacoesPadrao: observacoesPadrao.trim(),
    });

    updateProfile({
      margemLucroPadrao: margem,
      impostosTaxasPadrao: impostos,
    });

    notify({
      type: 'success',
      title: 'Configurações salvas',
      description: 'Seus dados profissionais e padrões foram atualizados no dispositivo.',
    });
  };

  const handleExportBackup = () => {
    const blob = new Blob([createBackupJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `preco-justo-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify({
      type: 'success',
      title: 'Backup exportado',
      description: `Arquivo JSON gerado com ${state.costs.length} despesas, ${state.services.length} serviços e ${state.history.length} cálculos.`,
    });
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        importBackup(reader.result);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-[#111827] dark:text-white sm:text-3xl">
          Configurações
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
          Personalize seus dados para orçamentos em PDF, aparência e gerenciamento dos dados locais.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Professional & Defaults Form */}
        <form
          onSubmit={handleSaveProfessional}
          className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-slate-800 dark:bg-[#111827] lg:col-span-7"
        >
          <h2 className="text-base font-bold text-[#111827] dark:text-white">
            Dados do profissional e orçamentos
          </h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
            Essas informações aparecem automaticamente no cabeçalho dos orçamentos enviados aos
            clientes.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label
                htmlFor="set-prof-name"
                className="block text-xs font-semibold text-gray-700 dark:text-slate-300"
              >
                Nome do profissional ou estúdio
              </label>
              <input
                id="set-prof-name"
                type="text"
                placeholder="Ex.: Clara Mendes Design"
                value={nomeProfissional}
                onChange={(e) => setNomeProfissional(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-[#111827] outline-none focus:border-[#16A34A] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="set-prof-spec"
                className="block text-xs font-semibold text-gray-700 dark:text-slate-300"
              >
                Especialidade / Cargo
              </label>
              <input
                id="set-prof-spec"
                type="text"
                placeholder="Ex.: Designer Gráfico e Web"
                value={especialidade}
                onChange={(e) => setEspecialidade(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-[#111827] outline-none focus:border-[#16A34A] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="set-prof-doc"
                className="block text-xs font-semibold text-gray-700 dark:text-slate-300"
              >
                CPF ou CNPJ <span className="font-normal text-gray-400">(opcional)</span>
              </label>
              <input
                id="set-prof-doc"
                type="text"
                placeholder="Ex.: CNPJ 00.000.000/0001-00"
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-[#111827] outline-none focus:border-[#16A34A] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="set-prof-email"
                className="block text-xs font-semibold text-gray-700 dark:text-slate-300"
              >
                E-mail profissional
              </label>
              <input
                id="set-prof-email"
                type="email"
                placeholder="contato@seusite.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-[#111827] outline-none focus:border-[#16A34A] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="set-prof-phone"
                className="block text-xs font-semibold text-gray-700 dark:text-slate-300"
              >
                Telefone / WhatsApp
              </label>
              <input
                id="set-prof-phone"
                type="text"
                placeholder="(11) 99999-9999"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-[#111827] outline-none focus:border-[#16A34A] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="set-prof-city"
                className="block text-xs font-semibold text-gray-700 dark:text-slate-300"
              >
                Cidade / UF
              </label>
              <input
                id="set-prof-city"
                type="text"
                placeholder="São Paulo — SP"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-[#111827] outline-none focus:border-[#16A34A] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="set-validity"
                className="block text-xs font-semibold text-gray-700 dark:text-slate-300"
              >
                Validade padrão do orçamento (dias)
              </label>
              <input
                id="set-validity"
                type="number"
                min="1"
                max="180"
                value={validadeDias}
                onChange={(e) => setValidadeDias(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-[#111827] outline-none tabular-nums focus:border-[#16A34A] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="set-notes"
                className="block text-xs font-semibold text-gray-700 dark:text-slate-300"
              >
                Observações padrão nos orçamentos
              </label>
              <textarea
                id="set-notes"
                rows={3}
                value={observacoesPadrao}
                onChange={(e) => setObservacoesPadrao(e.target.value)}
                className="mt-1.5 w-full resize-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-[#111827] outline-none focus:border-[#16A34A] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div className="border-t border-gray-100 pt-4 dark:border-slate-800 sm:col-span-2">
              <p className="text-xs font-bold text-[#111827] dark:text-white">
                Padrões da calculadora
              </p>
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="set-margin"
                    className="block text-xs font-semibold text-gray-700 dark:text-slate-300"
                  >
                    Margem de lucro padrão (%)
                  </label>
                  <input
                    id="set-margin"
                    type="number"
                    min="0"
                    max="99"
                    step="1"
                    value={margemPadrao}
                    onChange={(e) => setMargemPadrao(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-[#111827] outline-none tabular-nums focus:border-[#16A34A] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="set-tax"
                    className="block text-xs font-semibold text-gray-700 dark:text-slate-300"
                  >
                    Impostos e taxas padrão (%)
                  </label>
                  <input
                    id="set-tax"
                    type="number"
                    min="0"
                    max="99"
                    step="0.5"
                    value={impostosPadrao}
                    onChange={(e) => setImpostosPadrao(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-[#111827] outline-none tabular-nums focus:border-[#16A34A] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end border-t border-gray-100 pt-5 dark:border-slate-800">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-[#16A34A] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#15803D]"
            >
              <Save className="h-4 w-4" />
              Salvar configurações
            </button>
          </div>
        </form>

        {/* Right column: Theme, Demo Data, Backup */}
        <div className="space-y-6 lg:col-span-5">
          {/* Theme */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-slate-800 dark:bg-[#111827]">
            <h2 className="text-base font-bold text-[#111827] dark:text-white">Aparência</h2>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
              Escolha o modo visual que melhor se adapta ao seu ambiente de trabalho.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                  state.theme === 'light'
                    ? 'border-[#16A34A] bg-[#F0FDF4] text-[#14532D]'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <Sun className="h-4 w-4" />
                Modo claro
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                  state.theme === 'dark'
                    ? 'border-emerald-500 bg-emerald-950/50 text-emerald-300'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <Moon className="h-4 w-4" />
                Modo escuro
              </button>
            </div>
          </section>

          {/* Demo Data */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-slate-800 dark:bg-[#111827]">
            <h2 className="text-base font-bold text-[#111827] dark:text-white">
              Dados demonstrativos
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-slate-400">
              Popule o sistema com custos mensais, serviços de exemplo (Instagram, identidade
              visual, edição de vídeo, landing page e gestão de redes sociais) e cálculos prontos.
              Todos os itens são identificados como demonstrativos.
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={loadDemoData}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-[#F3F4F6] px-4 py-2.5 text-xs font-semibold text-[#111827] transition-colors hover:bg-gray-200/70 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
              >
                <Database className="h-4 w-4 text-[#16A34A]" />
                Carregar dados demonstrativos
              </button>
              {hasDemoData && (
                <button
                  type="button"
                  onClick={clearDemoData}
                  className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300"
                >
                  <Trash2 className="h-4 w-4" />
                  Apagar demonstrativos
                </button>
              )}
            </div>
          </section>

          {/* Backup & Reset */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-slate-800 dark:bg-[#111827]">
            <h2 className="text-base font-bold text-[#111827] dark:text-white">
              Armazenamento local e backup
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-slate-400">
              Todos os seus dados ficam salvos localmente no navegador (LocalStorage), sem envio a
              servidores externos. Hoje armazenados:{' '}
              <strong className="text-gray-700 dark:text-slate-200">
                {state.costs.length} despesas, {state.services.length} serviços e{' '}
                {state.history.length} cálculos
              </strong>
              .
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={handleExportBackup}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Download className="h-3.5 w-3.5" />
                Exportar backup JSON
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Upload className="h-3.5 w-3.5" />
                Importar backup JSON
              </button>
              <button
                type="button"
                onClick={openOnboarding}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <BookOpen className="h-3.5 w-3.5 text-[#16A34A]" />
                Rever guia inicial
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                onChange={handleFileImport}
                className="hidden"
              />
            </div>

            <div className="mt-5 border-t border-gray-100 pt-4 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:underline dark:text-red-400"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Limpar todos os dados do aplicativo
              </button>
            </div>
          </section>
        </div>
      </div>

      <ConfirmModal
        open={confirmReset}
        title="Limpar todos os dados?"
        description="Esta ação removerá permanentemente todos os custos mensais, serviços cadastrados, histórico de cálculos e configurações salvas neste navegador."
        confirmLabel="Sim, limpar tudo"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          resetAllData();
          setConfirmReset(false);
        }}
      />
    </div>
  );
};
