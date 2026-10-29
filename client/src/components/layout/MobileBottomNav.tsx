import React from 'react';
import { useGameStore, GameView } from '../../stores/useGameStore.js';
import {
  Server,
  Globe,
  MessageSquare,
  BookOpen,
  Activity,
  Menu
} from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    processes,
    toggleMobileMenu,
    isMobileMenuOpen
  } = useGameStore();

  const runningTasksCount = processes.length;

  const quickNavItems: Array<{
    id: GameView;
    label: string;
    icon: React.ElementType;
    badge?: number;
  }> = [
    { id: 'my_server', label: 'Meu PC', icon: Server },
    { id: 'known_servers', label: 'Alvos', icon: Globe },
    { id: 'dark_chat', label: 'DarkIRC', icon: MessageSquare },
    { id: 'campaign', label: 'História', icon: BookOpen },
    { id: 'processes', label: 'Tarefas', icon: Activity, badge: runningTasksCount > 0 ? runningTasksCount : undefined },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0d0d0d]/95 backdrop-blur-md border-t border-[#1c1c1e] px-2 py-1 flex items-center justify-around select-none">
      {quickNavItems.map(item => {
        const Icon = item.icon;
        const isActive = currentView === item.id;

        return (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition duration-150 ${
              isActive
                ? 'text-white font-bold'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
              {item.badge !== undefined && (
                <span className="absolute -top-1 -right-2 bg-emerald-500 text-black text-[9px] font-bold px-1 rounded-full animate-pulse">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5">{item.label}</span>
          </button>
        );
      })}

      {/* More / Menu Drawer Toggle */}
      <button
        onClick={toggleMobileMenu}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition duration-150 ${
          isMobileMenuOpen
            ? 'text-white font-bold'
            : 'text-gray-400 hover:text-gray-200'
        }`}
      >
        <Menu className="w-5 h-5 text-gray-400" />
        <span className="text-[10px] mt-0.5">Mais</span>
      </button>
    </nav>
  );
};
