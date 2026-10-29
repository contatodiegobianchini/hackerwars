import React, { useEffect } from 'react';
import { useGameStore } from './stores/useGameStore.js';
import { Header } from './components/layout/Header.js';
import { Sidebar } from './components/layout/Sidebar.js';
import { ToastNotifications } from './components/desktop/ToastNotifications.js';
import { TaskProgressPopup } from './components/common/TaskProgressPopup.js';
import { AuthModal } from './components/auth/AuthModal.js';
import { HackerTerminalDrawer } from './components/terminal/HackerTerminalDrawer.js';
import { Shield } from 'lucide-react';

// Views
import { MyServerView } from './components/views/MyServerView.js';
import { TargetServerView } from './components/views/TargetServerView.js';
import { SoftwareListView } from './components/views/SoftwareListView.js';
import { ProcessQueueView } from './components/views/ProcessQueueView.js';
import { KnownServersView } from './components/views/KnownServersView.js';
import { MissionsView } from './components/views/MissionsView.js';
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
import { DarkChatView } from './components/views/DarkChatView.js';
import { CartelLockdownOverlay } from './components/cartel/CartelLockdownOverlay.js';
import { PoliceRaidAlert } from './components/common/PoliceRaidAlert.js';
import { AdminPanelView } from './components/views/AdminPanelView.js';

import { MobileBottomNav } from './components/layout/MobileBottomNav.js';

export const App: React.FC = () => {
  const {
    currentUser,
    isAuthLoading,
    checkAuth,
    currentView
  } = useGameStore();

  useEffect(() => {
    checkAuth();
  }, []);

  if (isAuthLoading) {
    return (
      <div className="h-screen w-screen bg-[#0a0a0a] flex items-center justify-center text-white">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-black shadow-lg animate-pulse">
            <Shield className="w-6 h-6 fill-black text-black" />
          </div>
          <span className="text-xs font-mono text-gray-400">Iniciando protocolo seguro...</span>
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
      case 'my_server': return <MyServerView />;
      case 'target_server': return <TargetServerView />;
      case 'software': return <SoftwareListView />;
      case 'processes': return <ProcessQueueView />;
      case 'known_servers': return <KnownServersView />;
      case 'missions': return <MissionsView />;
      case 'campaign': return <CampaignView />;
      case 'dark_chat': return <DarkChatView />;
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
      default: return <MyServerView />;
    }
  };

  return (
    <div className="h-screen w-screen bg-[#0a0a0a] text-slate-200 flex flex-col overflow-hidden font-sans select-none">
      {/* Top Navigation Header */}
      <Header />

      {/* Main Container: Sidebar + Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar (Desktop + Mobile Drawer) */}
        <Sidebar />

        {/* Central View Content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 bg-[#0a0a0a]">
          <div className="max-w-6xl mx-auto pb-24 md:pb-16">
            {renderCurrentView()}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Quick Navigation Bar */}
      <MobileBottomNav />

      {/* Global Real-time Notifications */}
      <ToastNotifications />

      {/* Bottom Floating Live Task Progress Indicator */}
      <TaskProgressPopup />

      {/* Interactive Collapsible Hacker Terminal Console */}
      <HackerTerminalDrawer />

      {/* Cartel Jumpscare Video & 5-Minute Lockdown ("Na Encolha") */}
      <CartelLockdownOverlay />

      {/* Police & FBI Raid Emergency Alert */}
      <PoliceRaidAlert />
    </div>
  );
};

export default App;
