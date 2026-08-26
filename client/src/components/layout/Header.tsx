import React from 'react';
import { useGameStore } from '../../stores/useGameStore.js';
import {
  Shield,
  Activity,
  Volume2,
  VolumeX,
  HelpCircle,
  X,
  ExternalLink,
  LogOut,
  Music,
  Menu,
  Terminal,
  DollarSign,
  Bitcoin
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    player,
    activeConnection,
    disconnectTarget,
    setCurrentView,
    processes,
    soundEnabled,
    toggleSound,
    isSoundtrackPlaying,
    toggleSoundtrack,
    isMobileMenuOpen,
    toggleMobileMenu,
    toggleTerminal,
    logout
  } = useGameStore();

  if (!player) return null;

  const usedRamTasks = processes.length;
  const maxRamTasks = player.hardware.ram.maxTasks;

  return (
    <header className="h-14 sm:h-16 w-full bg-[#0d0d0d] border-b border-[#1c1c1e] flex items-center justify-between px-2.5 sm:px-6 sticky top-0 z-30 select-none">
      {/* Brand & Mobile Hamburger Toggle */}
      <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
        {/* Mobile Hamburger Button */}
        <button
          onClick={toggleMobileMenu}
          className="md:hidden p-2 rounded-xl bg-[#1c1c1e] text-gray-200 hover:text-white border border-[#2c2c2e] transition shrink-0"
          aria-label="Abrir Menu"
        >
          {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>

        {/* Brand Logo */}
        <div
          onClick={() => setCurrentView('my_server')}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white flex items-center justify-center text-black cursor-pointer shadow-sm shrink-0"
        >
          <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-black text-black" />
        </div>

        <div
          onClick={() => setCurrentView('my_server')}
          className="cursor-pointer leading-tight"
        >
          <div className="font-bold text-[11px] sm:text-xs tracking-wider text-white uppercase truncate">
            HACKER EXP
          </div>
          <div className="hidden sm:block text-[10px] sm:text-[11px] text-gray-400">
            Simulador de Invasão
          </div>
        </div>

        {/* User Pill Capsule (Desktop only) */}
        <div className="hidden xl:flex items-center space-x-2 bg-[#1c1c1e] border border-[#2c2c2e] px-3 py-1 rounded-xl text-xs text-gray-300 ml-2">
          <span className="font-medium text-white">{player.username}</span>
          <span className="text-gray-600">|</span>
          <span className="text-gray-300">{player.rank}</span>
          <span className="text-gray-600">|</span>
          <span className="text-gray-400 font-mono text-[11px]">{player.ip}</span>
        </div>
      </div>

      {/* Center Target Status Pill (Desktop & Tablet) */}
      <div className="hidden lg:flex items-center">
        {activeConnection ? (
          <div className="flex items-center space-x-2 bg-[#1c1c1e] border border-blue-500/50 px-3 py-1 rounded-xl text-xs text-gray-300">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
            <span className="text-[11px] text-gray-400">Alvo:</span>
            <button
              onClick={() => setCurrentView('target_server')}
              className="font-bold text-blue-400 hover:underline flex items-center space-x-1 font-mono text-xs"
            >
              <span>{activeConnection.hostname} ({activeConnection.ip})</span>
              <ExternalLink className="w-3 h-3" />
            </button>
            <button
              onClick={disconnectTarget}
              title="Desconectar"
              className="ml-1 text-gray-400 hover:text-red-400 p-0.5 rounded transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2 bg-[#1c1c1e] border border-[#2c2c2e] px-3 py-1 rounded-xl text-xs text-gray-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-gray-500"></span>
            <span>Servidor Local (127.0.0.1)</span>
          </div>
        )}
      </div>

      {/* Right Side Capsules & Settings (Guaranteed to fit on 360px+ screens) */}
      <div className="flex items-center space-x-1.5 sm:space-x-2 text-xs font-mono shrink-0">
        {/* Balance Cash Pill */}
        <button
          onClick={() => setCurrentView('bank')}
          className="bg-[#1c1c1e] hover:bg-[#252528] border border-[#2c2c2e] text-emerald-400 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl flex items-center space-x-1 transition font-semibold text-[11px] sm:text-xs"
          title="Ver Saldo no Banco"
        >
          <span className="text-gray-400 font-normal">$</span>
          <span>{player.cash >= 1000000 ? `${(player.cash / 1000000).toFixed(1)}M` : player.cash >= 10000 ? `${Math.round(player.cash / 1000)}k` : player.cash.toLocaleString()}</span>
        </button>

        {/* Crypto Balance Pill (Desktop/Tablet) */}
        <button
          onClick={() => setCurrentView('crypto')}
          className="hidden sm:flex bg-[#1c1c1e] hover:bg-[#252528] border border-[#2c2c2e] text-amber-400 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl items-center space-x-1 transition font-semibold text-[11px] sm:text-xs"
          title="Ver Carteira Cripto"
        >
          <span className="text-gray-400 font-normal">₿</span>
          <span>{player.crypto.toFixed(3)}</span>
        </button>

        {/* Active Tasks Pill (Desktop only) */}
        <button
          onClick={() => setCurrentView('processes')}
          className="hidden md:flex bg-[#1c1c1e] hover:bg-[#252528] border border-[#2c2c2e] text-gray-200 px-2.5 py-1 sm:py-1.5 rounded-xl items-center space-x-1.5 transition text-[11px] sm:text-xs"
        >
          <Activity className="w-3.5 h-3.5 text-gray-400" />
          <span>{usedRamTasks}/{maxRamTasks}</span>
        </button>

        {/* Root Admin Badge Button (Only visible if admin) */}
        {(player.role === 'admin' || player.username.toLowerCase() === 'zero_cool') && (
          <button
            onClick={() => setCurrentView('admin_panel')}
            className="bg-red-600/90 hover:bg-red-500 text-white font-mono text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-1 rounded-xl shadow-sm border border-red-400/60 flex items-center space-x-1 shrink-0 transition"
            title="Acessar Painel Administrativo"
          >
            <span>🛡️</span>
            <span className="hidden sm:inline">ADMIN</span>
          </button>
        )}

        {/* Music Soundtrack Toggle Button (Always visible on mobile & desktop!) */}
        <button
          onClick={toggleSoundtrack}
          title={isSoundtrackPlaying ? 'Desligar Música de Fundo (OST)' : 'Ligar Música de Fundo (OST)'}
          className={`p-2 rounded-xl transition flex items-center justify-center shrink-0 border ${
            isSoundtrackPlaying
              ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/50 shadow-sm shadow-emerald-900/40'
              : 'bg-[#1c1c1e] text-gray-500 border-[#2c2c2e] hover:text-white'
          }`}
          aria-label="Controle de Música"
        >
          <Music className={`w-4 h-4 ${isSoundtrackPlaying ? 'animate-pulse text-emerald-400' : 'text-gray-500'}`} />
        </button>

        {/* Sound FX Toggle Button (Always visible!) */}
        <button
          onClick={toggleSound}
          title={soundEnabled ? 'Silenciar Efeitos' : 'Ativar Efeitos Sonoros'}
          className={`p-2 rounded-xl border transition shrink-0 ${
            soundEnabled
              ? 'bg-[#1c1c1e] text-gray-300 border-[#2c2c2e] hover:text-white'
              : 'bg-red-950/40 text-red-400 border-red-800/40'
          }`}
          aria-label="Controle de Áudio"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-gray-300" /> : <VolumeX className="w-4 h-4 text-red-400" />}
        </button>

        {/* Terminal CLI Toggle Button (Desktop & Tablet) */}
        <button
          onClick={toggleTerminal}
          title="Abrir Terminal CLI"
          className="hidden sm:flex p-2 rounded-xl bg-[#1c1c1e] hover:bg-[#252528] border border-[#2c2c2e] text-gray-300 hover:text-white transition shrink-0"
        >
          <Terminal className="w-4 h-4" />
        </button>

        {/* Logout Button (Desktop only) */}
        <button
          onClick={logout}
          title="Sair da Conta (Logout)"
          className="hidden sm:flex p-2 rounded-xl hover:bg-[#1c1c1e] hover:text-red-400 text-gray-400 transition shrink-0"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
