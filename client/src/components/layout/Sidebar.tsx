import React from 'react';
import { useGameStore, GameView } from '../../stores/useGameStore.js';
import {
  Server,
  FolderArchive,
  Activity,
  FileText,
  Cpu,
  Globe,
  Target,
  DollarSign,
  Bitcoin,
  Trophy,
  HelpCircle,
  Radio,
  ShoppingBag,
  ShieldCheck,
  ShieldAlert,
  Users,
  HardDrive,
  BookOpen,
  MessageSquare,
  Music,
  Volume2,
  VolumeX,
  Terminal,
  LogOut
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    activeConnection,
    player,
    processes,
    activeInvasion,
    isMobileMenuOpen,
    setMobileMenuOpen,
    isSoundtrackPlaying,
    toggleSoundtrack,
    soundEnabled,
    toggleSound,
    toggleTerminal,
    logout
  } = useGameStore();

  const softwareCount = player?.software.length || 5;
  const runningTasksCount = processes.length;
  const infectionCount = player?.infections?.length || 0;
  const isAdmin = player?.role === 'admin' || player?.username.toLowerCase() === 'zero_cool';

  const sections: Array<{
    title: string;
    items: Array<{
      id: GameView;
      label: string;
      icon: React.ElementType;
      badge?: string | number;
      badgeColor?: string;
    }>;
  }> = [
    {
      title: 'MEU SISTEMA',
      items: [
        { id: 'my_server', label: 'Meu Computador', icon: Server },
        { id: 'software', label: 'Meus Softwares', icon: FolderArchive, badge: softwareCount },
        {
          id: 'antivirus',
          label: 'Defesa & Antivírus',
          icon: ShieldCheck,
          badge: activeInvasion ? 'ALERTA' : infectionCount > 0 ? `${infectionCount} INF` : undefined,
          badgeColor: activeInvasion || infectionCount > 0 ? 'bg-red-600 text-white' : undefined,
        },
        {
          id: 'processes',
          label: 'Fila de Tarefas',
          icon: Activity,
          badge: runningTasksCount > 0 ? runningTasksCount : undefined
        },
        { id: 'logs', label: 'Meus Logs', icon: FileText },
        { id: 'hardware', label: 'Loja de Hardware', icon: Cpu },
      ]
    },
    {
      title: 'INTERNET & INVASÕES',
      items: [
        { id: 'dark_chat', label: 'DarkIRC Chat', icon: MessageSquare, badge: 'P2P', badgeColor: 'bg-emerald-600 text-white' },
        { id: 'campaign', label: 'Modo História', icon: BookOpen, badge: '10 CAPS' },
        { id: 'missions', label: 'Missões & Contratos', icon: Target },
        { id: 'known_servers', label: 'Servidores & Alvos', icon: Globe, badge: 'IPs' },
        ...(activeConnection ? [{
          id: 'target_server' as GameView,
          label: `Alvo: ${activeConnection.hostname.split('.')[0]}`,
          icon: Radio,
          badge: activeConnection.security.isBreached ? 'ROOT' : 'LOCK',
        }] : [])
      ]
    },
    {
      title: 'FINANÇAS & EXPANSÃO',
      items: [
        { id: 'black_market', label: 'Black Market', icon: ShoppingBag, badge: 'LOOT' },
        { id: 'crypto', label: 'Cripto & Mineração', icon: Bitcoin },
        { id: 'datacenter', label: 'Datacenter Cloud', icon: HardDrive, badge: 'VPS' },
        { id: 'clans', label: 'Clãs & Territórios', icon: Users, badge: 'WAR' },
        { id: 'bank', label: 'Banco Online', icon: DollarSign },
      ]
    },
    {
      title: 'COMUNIDADE',
      items: [
        { id: 'leaderboard', label: 'Ranking & Notícias', icon: Trophy },
        { id: 'tutorial', label: 'Guia do Jogo', icon: HelpCircle },
      ]
    },
    ...(isAdmin ? [{
      title: 'ADMINISTRAÇÃO',
      items: [
        {
          id: 'admin_panel' as GameView,
          label: 'Painel Admin (DB)',
          icon: ShieldAlert,
          badge: 'ROOT',
          badgeColor: 'bg-red-600 text-white'
        },
      ]
    }] : [])
  ];

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full py-4 px-3 overflow-y-auto">
      <div className="space-y-5">
        {/* Mobile Player Info Header inside drawer */}
        {player && (
          <div className="md:hidden pb-3 border-b border-[#1c1c1e] px-2">
            <div className="text-xs font-bold text-white font-mono">{player.username}</div>
            <div className="text-[11px] text-emerald-400 font-mono mt-0.5">{player.rank} • {player.ip}</div>
          </div>
        )}

        {sections.map((sec, idx) => (
          <div key={idx} className="space-y-1">
            <div className="px-3 text-[10px] sm:text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              {sec.title}
            </div>

            <div className="space-y-0.5">
              {sec.items.map(item => {
                const Icon = item.icon;
                const isActive = currentView === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentView(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition duration-150 text-left ${
                      isActive
                        ? 'bg-[#1c1c1e] text-white font-semibold shadow-sm'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-[#141416]'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge !== undefined && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ml-1 ${
                          item.badgeColor || (isActive ? 'bg-white text-black' : 'bg-[#2c2c2e] text-gray-400')
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Audio & System Control Panel (Visible in drawer and desktop sidebar) */}
      <div className="pt-3 mt-4 border-t border-[#1c1c1e] space-y-2">
        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider px-2">
          Áudio & Sistema
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={toggleSoundtrack}
            className={`p-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center space-x-1.5 border transition ${
              isSoundtrackPlaying
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40'
                : 'bg-[#141416] text-gray-400 border-[#2c2c2e]'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>{isSoundtrackPlaying ? 'OST On' : 'OST Mute'}</span>
          </button>

          <button
            onClick={toggleSound}
            className={`p-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center space-x-1.5 border transition ${
              soundEnabled
                ? 'bg-[#141416] text-gray-300 border-[#2c2c2e]'
                : 'bg-red-950/40 text-red-400 border-red-800/40'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-gray-300" /> : <VolumeX className="w-3.5 h-3.5 text-red-400" />}
            <span>{soundEnabled ? 'Sons On' : 'Sons Mute'}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1.5 pt-0.5">
          <button
            onClick={() => {
              toggleTerminal();
              setMobileMenuOpen(false);
            }}
            className="p-2 rounded-xl bg-[#141416] hover:bg-[#202024] text-gray-300 border border-[#2c2c2e] text-xs font-mono flex items-center justify-center space-x-1.5"
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Terminal</span>
          </button>

          <button
            onClick={logout}
            className="p-2 rounded-xl bg-[#141416] hover:bg-red-950/40 text-gray-400 hover:text-red-400 border border-[#2c2c2e] text-xs font-mono flex items-center justify-center space-x-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        </div>
      </div>

      {/* Footer info */}
      <div className="pt-3 mt-3 border-t border-[#1c1c1e] px-2 text-[10px] text-gray-500 font-mono flex items-center justify-between">
        <span>Hacker Wars v2.5</span>
        <span className="text-emerald-500">● Online</span>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-56 lg:w-60 bg-[#0a0a0a] border-r border-[#1c1c1e] flex-col shrink-0 select-none">
        {sidebarContent}
      </aside>

      {/* Mobile Backdrop & Slide-in Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop Blur Overlay */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            aria-hidden="true"
          />

          {/* Drawer Container */}
          <div className="relative w-72 max-w-[82vw] bg-[#0d0d0d] border-r border-[#2c2c2e] shadow-2xl h-full z-10 flex flex-col">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
