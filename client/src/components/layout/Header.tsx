import React from 'react';
import { useGameStore } from '../../stores/useGameStore.js';
import { LogOut, MessageSquare, MoreVertical, Music, ShieldAlert, Terminal, Volume2, VolumeX } from 'lucide-react';
import { useNavCounts } from './useNavCounts.js';

const formatCash = (value: number) =>
  value >= 1_000_000 ? `${(value / 1_000_000).toFixed(1).replace('.', ',')} mi`
    : value >= 10_000 ? `${Math.round(value / 1000)} mil`
      : value.toLocaleString('pt-BR');

export const Header: React.FC = () => {
  const {
    player, activeConnection, setCurrentView, processes,
    soundEnabled, toggleSound, isSoundtrackPlaying, toggleSoundtrack,
    isMobileMenuOpen, toggleMobileMenu, setMobileMenuOpen, toggleTerminal, isTerminalOpen,
    isChatOpen, toggleChat, logout,
  } = useGameStore();
  const { unreadChat } = useNavCounts();

  if (!player) return null;

  const isAdmin = player.role === 'admin' || player.username.toLowerCase() === 'zero_cool';
  const maxTasks = player.hardware.ram.maxTasks;

  return (
    <header className="hw-header">
      <button className="hw-brand" onClick={() => setCurrentView('my_server')} aria-label="Ir para o início">
        <span className="hw-brand__name">Hacker<b>Wars</b></span>
        <span className="hw-brand__who hidden lg:inline"><strong>{player.username}</strong> · {player.rank}</span>
      </button>

      <div className="flex-1 min-w-0 hidden md:flex justify-center">
        {!activeConnection && (
          <div className="hw-link-status">
            <span className="hw-link-status__dot" />
            <span>Sem conexão · <span className="ip">{player.ip}</span></span>
          </div>
        )}
      </div>
      <div className="flex-1 md:hidden" />

      <div className="hw-wallet">
        <button className="hw-stat" onClick={() => setCurrentView('bank')} title="Saldo em dólar">
          <small>US$</small>{formatCash(player.cash)}
        </button>
        <button className="hw-stat hw-stat--coin" onClick={() => setCurrentView('shop')} title="CyberCoins: acelere o jogo">
          <small>CC</small>{(player.cyberCoins || 0).toLocaleString('pt-BR')}
        </button>
        <button className="hw-stat hidden sm:inline-flex" onClick={() => setCurrentView('crypto')} title="Carteira de bitcoin">
          <small>BTC</small>{player.crypto.toFixed(3).replace('.', ',')}
        </button>
        <button
          className={`hw-stat hidden md:inline-flex ${processes.length > 0 ? 'hw-stat--busy' : ''}`}
          onClick={() => setCurrentView('processes')}
          title="Processos em execução / máximo da RAM"
        >
          <small>Processos</small>{processes.length}/{maxTasks}
        </button>
      </div>

      <div className="flex items-center gap-1">
        <button className="hw-icon-btn" onClick={toggleChat} aria-pressed={isChatOpen} title="DarkIRC" aria-label={`Abrir DarkIRC${unreadChat ? `, ${unreadChat} mensagens novas` : ''}`}>
          <MessageSquare />
          {unreadChat > 0 && !isChatOpen && <span className="hw-count">{unreadChat > 9 ? '9+' : unreadChat}</span>}
        </button>
        <button className="hw-icon-btn hidden md:inline-flex" onClick={toggleTerminal} aria-pressed={isTerminalOpen} title="Terminal (tecla `)" aria-label="Abrir terminal">
          <Terminal />
        </button>
        <button className="hw-icon-btn hidden md:inline-flex" onClick={toggleSoundtrack} aria-pressed={isSoundtrackPlaying} title={isSoundtrackPlaying ? 'Desligar música' : 'Ligar música'} aria-label="Música">
          <Music />
        </button>
        <button className="hw-icon-btn hidden md:inline-flex" onClick={toggleSound} title={soundEnabled ? 'Silenciar efeitos' : 'Ligar efeitos'} aria-label="Efeitos sonoros">
          {soundEnabled ? <Volume2 /> : <VolumeX />}
        </button>

        {/* Celular: o restante fica num menu compacto */}
        <div className="relative md:hidden">
          <button className="hw-icon-btn" onClick={toggleMobileMenu} aria-expanded={isMobileMenuOpen} aria-label="Mais opções">
            <MoreVertical />
          </button>
          {isMobileMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMobileMenuOpen(false)} />
              <div className="absolute right-0 top-11 z-50 w-56 rounded-lg border border-gray-200 bg-white p-1.5 shadow-xl">
                <button className="hw-nav__small w-full" onClick={() => { setMobileMenuOpen(false); toggleTerminal(); }}><Terminal /> Terminal</button>
                <button className="hw-nav__small w-full" onClick={toggleSoundtrack}><Music /> {isSoundtrackPlaying ? 'Desligar música' : 'Ligar música'}</button>
                <button className="hw-nav__small w-full" onClick={toggleSound}>{soundEnabled ? <Volume2 /> : <VolumeX />} {soundEnabled ? 'Silenciar efeitos' : 'Ligar efeitos'}</button>
                {isAdmin && <button className="hw-nav__small w-full" onClick={() => setCurrentView('admin_panel')}><ShieldAlert /> Administração</button>}
                <button className="hw-nav__small hw-nav__small--danger w-full" onClick={logout}><LogOut /> Sair</button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
