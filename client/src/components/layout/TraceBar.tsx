import React from 'react';
import { useGameStore } from '../../stores/useGameStore.js';

const DANGER: Record<string, string> = { LOW: 'baixo', MEDIUM: 'médio', HIGH: 'alto', CRITICAL: 'crítico' };

/**
 * Police trace strip. Visible on every screen while connected to a target, so the
 * clock keeps running in the player's face even outside the target screen.
 */
export const TraceBar: React.FC = () => {
  const { activeConnection, activeTrace, player, disconnectTarget, setCurrentView } = useGameStore();
  if (!activeConnection || !player) return null;

  const tracing = !!activeTrace?.isActive && activeTrace.targetIp === activeConnection.ip;
  const progress = tracing ? activeTrace!.progressPercent : 0;
  const critical = tracing && (activeTrace!.dangerLevel === 'CRITICAL' || activeTrace!.secondsRemaining <= 10);
  const hops = player.activeProxyChain?.length || 0;
  const vpn = player.hardware.vpn?.traceDelaySec || 0;

  return (
    <div className={`hw-trace ${tracing ? '' : 'hw-trace--calm'} ${critical ? 'hw-trace--critical' : ''}`} role="status" aria-live="polite">
      <div className="hw-trace__bar"><div className="hw-trace__fill" style={{ width: `${tracing ? Math.max(2, progress) : 0}%` }} /></div>
      <div className="hw-trace__row">
        <button onClick={() => setCurrentView('target_server')} className="min-w-0 flex-1 truncate text-left">
          <span className="hidden sm:inline">Conectado a </span><span className="ip">{activeConnection.ip}</span> <strong className="hidden sm:inline">{activeConnection.hostname}</strong>
        </button>
        <span className="hidden lg:inline">
          {hops > 0 ? `${hops} ${hops === 1 ? 'proxy' : 'proxies'}` : 'Sem proxies'} · VPN +{vpn} s
        </span>
        {tracing ? (
          <span className="hw-trace__clock">
            <span className="hidden sm:inline">Rastreamento </span>{progress}% · {activeTrace!.secondsRemaining} s<span className="hidden sm:inline"> · risco {DANGER[activeTrace!.dangerLevel] || activeTrace!.dangerLevel}</span>
          </span>
        ) : (
          <span className="hw-trace__clock"><span className="hidden sm:inline">Alvo de baixo risco: </span>sem rastreamento</span>
        )}
        <button onClick={disconnectTarget} className="hw-link">Desconectar</button>
      </div>
    </div>
  );
};
