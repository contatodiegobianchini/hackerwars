import React, { useEffect } from 'react';
import { useGameStore } from './stores/useGameStore.js';
import { Header } from './components/layout/Header.js';
import { Sidebar } from './components/layout/Sidebar.js';
import { ToastNotifications } from './components/desktop/ToastNotifications.js';
import { TaskProgressPopup } from './components/common/TaskProgressPopup.js';
import { AuthModal } from './components/auth/AuthModal.js';
import { HackerTerminalDrawer } from './components/terminal/HackerTerminalDrawer.js';

// Views
import { MyServerView } from './components/views/MyServerView.js';
import { TargetServerView } from './components/views/TargetServerView.js';
import { SoftwareListView } from './components/views/SoftwareListView.js';
import { ProcessQueueView } from './components/views/ProcessQueueView.js';
import { KnownServersView } from './components/views/KnownServersView.js';
import { OperationsBoard } from './components/views/OperationsBoard.js';
import { BlackMarketView } from './components/views/BlackMarketView.js';
import { BankingView } from './components/views/BankingView.js';
import { CryptoView } from './components/views/CryptoView.js';
import { HardwareShopView } from './components/views/HardwareShopView.js';
import { MyLogsView } from './components/views/MyLogsView.js';
import { LeaderboardView } from './components/views/LeaderboardView.js';
import { TutorialView } from './components/views/TutorialView.js';

// New Expansion Views
import { AntivirusDefenseView } from './components/views/AntivirusDefenseView.js';
import { ClansView } from './components/views/ClansView.js';
import { DatacenterView } from './components/views/DatacenterView.js';
import { CampaignView } from './components/views/CampaignView.js';
import { CartelLockdownOverlay } from './components/cartel/CartelLockdownOverlay.js';
import { PoliceRaidAlert } from './components/common/PoliceRaidAlert.js';
import { AdminPanelView } from './components/views/AdminPanelView.js';

import { MobileBottomNav } from './components/layout/MobileBottomNav.js';
import { ZoneTabs } from './components/layout/ZoneTabs.js';
import { ChatDrawer } from './components/layout/ChatDrawer.js';
import { TraceBar } from './components/layout/TraceBar.js';
import { HomeView } from './components/views/HomeView.js';

export const App: React.FC = () => {
  const {
    currentUser,
    isAuthLoading,
    checkAuth,
    currentView,
    toggleTerminal
  } = useGameStore();

  useEffect(() => {
    checkAuth();
  }, []);

  // Backtick opens and closes the terminal, like a game console. It is ignored
  // while typing in any other field.
  useEffect(() => {
    if (!currentUser) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '`' || e.ctrlKey || e.metaKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      const editable = !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
      if (editable && el?.id !== 'terminal-command') return;
      e.preventDefault();
      toggleTerminal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [currentUser, toggleTerminal]);

  if (isAuthLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center" style={{ background: 'var(--madrugada)' }}>
        <div className="flex flex-col items-center gap-3">
          <span className="hw-brand__name text-4xl">Hacker<b>Wars</b></span>
          <span className="text-sm text-gray-500 cyber-live">Conectando à rede…</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <>
        <AuthModal />
        <ToastNotifications />
      </>
    );
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'my_server': return <HomeView />;
      case 'machine': return <MyServerView />;
      case 'target_server': return <TargetServerView />;
      case 'software': return <SoftwareListView />;
      case 'processes': return <ProcessQueueView />;
      case 'known_servers': return <KnownServersView />;
      case 'missions': return <OperationsBoard />;
      case 'campaign': return <CampaignView />;
      case 'black_market': return <BlackMarketView />;
      case 'crypto': return <CryptoView />;
      case 'datacenter': return <DatacenterView />;
      case 'clans': return <ClansView />;
      case 'antivirus': return <AntivirusDefenseView />;
      case 'bank': return <BankingView />;
      case 'hardware': return <HardwareShopView />;
      case 'logs': return <MyLogsView />;
      case 'leaderboard': return <LeaderboardView />;
      case 'tutorial': return <TutorialView />;
      case 'admin_panel': return <AdminPanelView />;
      default: return <HomeView />;
    }
  };

  return (
    <div className="app-shell h-screen w-screen flex flex-col overflow-hidden">
      <Header />
      <TraceBar />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <main data-view={currentView} data-zone="core" className="hw-main">
          <div className="hw-main__inner">
            <ZoneTabs />
            {renderCurrentView()}
          </div>
        </main>
      </div>

      <MobileBottomNav />
      <ChatDrawer />
      <ToastNotifications />
      <TaskProgressPopup />
      <HackerTerminalDrawer />
      <CartelLockdownOverlay />
      <PoliceRaidAlert />
    </div>
  );
};

export default App;
