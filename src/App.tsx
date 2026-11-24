import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { ToastContainer } from './components/ToastContainer';
import { QuoteModal } from './components/QuoteModal';
import { OnboardingModal } from './components/OnboardingModal';
import { OverviewPage } from './pages/OverviewPage';
import { CalculatorPage } from './pages/CalculatorPage';
import { GoalsPage } from './pages/GoalsPage';
import { ServicesPage } from './pages/ServicesPage';
import { CostsPage } from './pages/CostsPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';

const AppRouter: React.FC = () => {
  const { activePage } = useApp();

  const renderPage = () => {
    switch (activePage) {
      case 'overview':
        return <OverviewPage />;
      case 'calculator':
        return <CalculatorPage />;
      case 'goals':
        return <GoalsPage />;
      case 'services':
        return <ServicesPage />;
      case 'costs':
        return <CostsPage />;
      case 'history':
        return <HistoryPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <OverviewPage />;
    }
  };

  return (
    <>
      <Layout>{renderPage()}</Layout>
      <QuoteModal />
      <OnboardingModal />
      <ToastContainer />
    </>
  );
};

export function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}

export default App;
