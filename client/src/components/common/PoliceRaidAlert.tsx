import React from 'react';
import { useGameStore } from '../../stores/useGameStore.js';
import { ShieldAlert, DollarSign, Flame, Zap, Clock, AlertTriangle } from 'lucide-react';

export const PoliceRaidAlert: React.FC = () => {
  const { activeRaid, player, defendPoliceRaid } = useGameStore();

  if (!activeRaid || activeRaid.status !== 'incoming') return null;

  const canAffordBribe = player ? player.cash >= activeRaid.bribeCostUsd : false;
  const vpnTier = player?.hardware?.vpn?.level || 1;
  const canAffordJammer = vpnTier >= 3 || (player ? player.cash >= 4000 : false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#180a0c] border-2 border-red-600 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-[0_0_80px_rgba(239,68,68,0.45)] text-white relative overflow-hidden">
        {/* Police Flashing Alert Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-red-600/30 border border-red-500 flex items-center justify-center text-red-400 animate-pulse">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-red-600 text-white font-mono text-[10px] uppercase font-black px-2 py-0.5 rounded tracking-widest animate-pulse">
                ALERTA MÁXIMO
              </span>
              <span className="text-xs text-red-300 font-mono">MANDADO DE PRISÃO</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {activeRaid.agencyName}
            </h2>
          </div>
        </div>

        {/* Warrant Details */}
        <div className="bg-red-950/40 border border-red-500/30 rounded-2xl p-4 mb-6">
          <div className="flex items-start space-x-2 text-xs text-red-200 leading-relaxed font-mono">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-red-400">MOTIVO DA ORDEM JUDICIAL: </span>
              {activeRaid.warrantReason}
            </div>
          </div>
        </div>

        {/* Countdown Timer */}
        <div className="flex items-center justify-between bg-black/50 border border-red-500/20 rounded-2xl p-4 mb-6">
          <div className="flex items-center space-x-2 text-gray-300 text-xs">
            <Clock className="w-4 h-4 text-red-400" />
            <span>Tempo até arrombamento da porta:</span>
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-black text-red-400 tracking-wider animate-pulse">
            00:{activeRaid.timeRemainingSec.toString().padStart(2, '0')}s
          </div>
        </div>

        {/* Defense Actions */}
        <div className="space-y-3">
          {/* Action 1: Bribe */}
          <button
            onClick={() => defendPoliceRaid('bribe')}
            disabled={!canAffordBribe}
            className={`w-full p-4 rounded-2xl border flex items-center justify-between transition ${
              canAffordBribe
                ? 'bg-red-900/30 hover:bg-red-900/50 border-red-500/50 text-white shadow-lg'
                : 'bg-black/30 border-red-900/30 text-gray-500 cursor-not-allowed opacity-60'
            }`}
          >
            <div className="flex items-center space-x-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-white">Subornar Agentes Federais</div>
                <div className="text-[11px] text-gray-400">Pagar propina secreta e arquivar o mandado</div>
              </div>
            </div>
            <div className="text-right">
              <div className={`font-mono font-bold text-sm ${canAffordBribe ? 'text-amber-400' : 'text-red-400'}`}>
                ${activeRaid.bribeCostUsd.toLocaleString()}
              </div>
            </div>
          </button>

          {/* Action 2: Purge Evidence */}
          <button
            onClick={() => defendPoliceRaid('purge_evidence')}
            className="w-full p-4 rounded-2xl bg-red-950/30 hover:bg-red-900/40 border border-red-500/40 flex items-center justify-between text-white transition shadow-lg"
          >
            <div className="flex items-center space-x-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-white">Purga de Emergência de Evidências</div>
                <div className="text-[11px] text-gray-400">Destruir registros e logs locais (-200 REP)</div>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-orange-400 bg-orange-950/60 px-3 py-1 rounded-xl border border-orange-500/30">
              DESTRUIR LOGS
            </span>
          </button>

          {/* Action 3: Blackout Jammer */}
          <button
            onClick={() => defendPoliceRaid('blackout_jammer')}
            disabled={!canAffordJammer}
            className={`w-full p-4 rounded-2xl border flex items-center justify-between transition ${
              canAffordJammer
                ? 'bg-blue-950/40 hover:bg-blue-900/50 border-blue-500/40 text-white shadow-lg'
                : 'bg-black/30 border-blue-900/30 text-gray-500 cursor-not-allowed opacity-60'
            }`}
          >
            <div className="flex items-center space-x-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-white">Disparar Blackout Jammer (EMP)</div>
                <div className="text-[11px] text-gray-400">Bloquear sinal e radares das viaturas</div>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-blue-400 bg-blue-950/60 px-3 py-1 rounded-xl border border-blue-500/30">
              {vpnTier >= 3 ? 'GRÁTIS (VPN T3)' : '$4.000 USD'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
