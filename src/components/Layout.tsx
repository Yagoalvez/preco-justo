import React, { useState } from 'react';
import {
  LayoutDashboard,
  Calculator,
  Target,
  Briefcase,
  Receipt,
  History,
  Settings,
  Sun,
  Moon,
  Menu,
  X,
  Database,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PageId } from '../types';
import { BrandLogo } from './BrandLogo';

const NAV_ITEMS: Array<{ id: PageId; label: string; icon: React.FC<{ className?: string }> }> = [
  { id: 'overview', label: 'Visão geral', icon: LayoutDashboard },
  { id: 'calculator', label: 'Calculadora de preços', icon: Calculator },
  { id: 'goals', label: 'Planejamento de metas', icon: Target },
  { id: 'services', label: 'Meus serviços', icon: Briefcase },
  { id: 'costs', label: 'Custos mensais', icon: Receipt },
  { id: 'history', label: 'Histórico de cálculos', icon: History },
  { id: 'settings', label: 'Configurações', icon: Settings },
];

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    state,
    activePage,
    setActivePage,
    toggleTheme,
    hasDemoData,
    loadDemoData,
    clearDemoData,
    storageWarning,
    dismissStorageWarning,
  } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeNav = NAV_ITEMS.find((item) => item.id === activePage);

  const handleNavigate = (page: PageId) => {
    setActivePage(page);
    setMobileMenuOpen(false);
  };

  const renderNavLinks = () => (
    <nav className="flex flex-col gap-1" aria-label="Navegação principal">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = activePage === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => handleNavigate(item.id)}
            aria-current={isActive ? 'page' : undefined}
            className={`group flex min-h-[42px] w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-colors ${
              isActive
                ? 'bg-[#F0FDF4] text-[#14532D] dark:bg-emerald-950/80 dark:text-emerald-300'
                : 'text-gray-600 hover:bg-gray-100 hover:text-[#111827] dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white'
            }`}
          >
            <Icon
              className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                isActive
                  ? 'text-[#16A34A] dark:text-emerald-400'
                  : 'text-gray-400 group-hover:text-gray-600 dark:text-slate-500 dark:group-hover:text-slate-300'
              }`}
            />
            <span className="truncate">{item.label}</span>
            {isActive && (
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#16A34A] dark:bg-emerald-400" />
            )}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="no-print flex min-h-screen bg-[#F3F4F6] text-[#111827] dark:bg-[#090E17] dark:text-[#F9FAFB]">
      {/* Desktop Sidebar */}
      <aside className="hidden w-[272px] shrink-0 flex-col border-r border-gray-200 bg-white dark:border-slate-800 dark:bg-[#111827] lg:fixed lg:inset-y-0 lg:flex">
        <div className="flex h-[76px] flex-col justify-center border-b border-gray-100 px-5 dark:border-slate-800">
          <BrandLogo variant="horizontal" theme={state.theme} className="h-8 w-auto self-start" />
          <span className="mt-1 truncate text-[11px] font-medium text-gray-500 dark:text-slate-400">
            Precificação inteligente
          </span>
        </div>

        <div className="flex flex-1 flex-col justify-between overflow-y-auto px-4 py-4">
          <div>
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
              Menu principal
            </p>
            {renderNavLinks()}
          </div>

          <div className="mt-5 space-y-2.5 border-t border-gray-100 pt-4 dark:border-slate-800">
            {hasDemoData ? (
              <div className="rounded-xl border border-amber-200/90 bg-amber-50/80 p-3 dark:border-amber-800/60 dark:bg-amber-950/35">
                <p className="text-xs font-semibold text-amber-900 dark:text-amber-300">
                  Dados demonstrativos ativos
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-amber-800/90 dark:text-amber-200/80">
                  Os exemplos podem ser removidos a qualquer momento.
                </p>
                <button
                  type="button"
                  onClick={clearDemoData}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900 underline-offset-2 hover:underline dark:text-amber-300"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Apagar dados demonstrativos
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={loadDemoData}
                className="flex min-h-[40px] w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-[#F3F4F6]/80 px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:border-[#16A34A]/40 hover:bg-[#F0FDF4] hover:text-[#14532D] dark:border-slate-700 dark:bg-[#1A2333] dark:text-slate-200 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/60 dark:hover:text-emerald-300"
              >
                <Database className="h-3.5 w-3.5" />
                Carregar dados demonstrativos
              </button>
            )}

            <button
              type="button"
              onClick={toggleTheme}
              className="flex min-h-[40px] w-full items-center justify-between rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-700 dark:bg-[#1A2333]/60 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <span className="flex items-center gap-2">
                {state.theme === 'dark' ? (
                  <Sun className="h-4 w-4 text-amber-400" />
                ) : (
                  <Moon className="h-4 w-4 text-gray-500" />
                )}
                {state.theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
              </span>
              <span className="text-xs text-gray-500 dark:text-slate-400">
                {state.theme === 'dark' ? 'Escuro' : 'Claro'}
              </span>
            </button>

            <p className="px-1 text-xs leading-snug text-gray-500 dark:text-slate-400">
              Seu trabalho tem valor. Saiba quanto cobrar.
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Header + Drawer */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-[272px]">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200 bg-white/95 px-3.5 backdrop-blur-sm dark:border-slate-800 dark:bg-[#111827]/95 sm:px-4 lg:hidden">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menu"
              title="Abrir menu"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-600 hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center">
              <BrandLogo variant="horizontal" theme={state.theme} className="h-7 w-auto" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden text-xs font-medium text-gray-600 dark:text-slate-300 sm:inline">
              {activeNav?.label}
            </span>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={state.theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
              title={state.theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:bg-[#1A2333] dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {state.theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          </div>
        </header>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-modal="true">
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-[1px]"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative flex w-72 max-w-[85vw] flex-col bg-white shadow-2xl dark:bg-[#111827]">
              <div className="flex h-16 items-center justify-between border-b border-gray-100 px-5 dark:border-slate-800">
                <div className="flex flex-col justify-center">
                  <BrandLogo variant="horizontal" theme={state.theme} className="h-7 w-auto self-start" />
                  <span className="mt-0.5 block text-[11px] text-gray-500 dark:text-slate-400">
                    Seu trabalho tem valor.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Fechar menu"
                  className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex flex-1 flex-col justify-between overflow-y-auto p-4">
                {renderNavLinks()}
                <div className="mt-6 space-y-2.5 border-t border-gray-100 pt-4 dark:border-slate-800">
                  {hasDemoData ? (
                    <button
                      type="button"
                      onClick={() => {
                        clearDemoData();
                        setMobileMenuOpen(false);
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Apagar dados demonstrativos
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        loadDemoData();
                        setMobileMenuOpen(false);
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs font-semibold text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      <Database className="h-3.5 w-3.5" />
                      Carregar dados demonstrativos
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
          {storageWarning && (
            <div
              role="alert"
              className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-900 dark:border-amber-800/70 dark:bg-amber-950/40 dark:text-amber-200"
            >
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="font-semibold">Aviso de armazenamento local</p>
                  <p className="mt-0.5 leading-relaxed opacity-90">{storageWarning}</p>
                  {activePage !== 'settings' && (
                    <button
                      type="button"
                      onClick={() => handleNavigate('settings')}
                      className="mt-1.5 font-semibold underline underline-offset-2 hover:opacity-80"
                    >
                      Abrir Configurações e Backup JSON
                    </button>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={dismissStorageWarning}
                aria-label="Fechar aviso de armazenamento"
                className="rounded-md p-1 text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
};
