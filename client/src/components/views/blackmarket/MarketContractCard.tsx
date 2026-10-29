import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { DarknetContract, Player } from '../../../types/game.js';
import { useGameStore } from '../../../stores/useGameStore.js';

interface MarketContractCardProps {
  contract: DarknetContract;
  player: Player;
  onClaimContract: (contractId: string) => void;
}

export const MarketContractCard: React.FC<MarketContractCardProps> = ({
  contract,
  player,
  onClaimContract
}) => {
  const cracker = player.software.find(s => s.type === 'cracker');
  const crackerLevel = cracker ? cracker.version : 1.0;
  const hasLevel = crackerLevel >= contract.requiredCrackerLevel;
  const target = useGameStore.getState().servers.find(s => s.ip === contract.targetIp) ||
                 useGameStore.getState().allServers.find(s => s.ip === contract.targetIp);
  const isBreached = target ? target.security.isBreached : false;

  return (
    <div className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between space-y-4">
      <div>
        <div className="flex items-center justify-between">
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
            contract.completed ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
          }`}>
            {contract.completed ? 'CONCLUÍDO' : 'CONTRATO DISPONÍVEL'}
          </span>

          <span className="text-xs font-mono text-gray-400">
            {contract.targetHostname} ({contract.targetIp})
          </span>
        </div>

        <h3 className="font-bold text-sm text-gray-900 mt-2">{contract.title}</h3>
        <p className="text-xs text-gray-600 mt-1 leading-relaxed">{contract.description}</p>

        <div className="mt-4 p-3 bg-gray-50 rounded-xl space-y-1.5 text-xs font-mono">
          <div className="flex justify-between">
            <span className="text-gray-500">Recompensa:</span>
            <span className="font-bold text-emerald-600">
              +${contract.rewardCash.toLocaleString()} USD
              {contract.rewardCryptoBtc ? ` + ${contract.rewardCryptoBtc} BTC` : ''}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Reputação:</span>
            <span className="font-bold text-blue-600">+{contract.rewardRep} REP</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Cracker Exigido:</span>
            <span className={`font-bold ${hasLevel ? 'text-gray-900' : 'text-red-500'}`}>
              v{contract.requiredCrackerLevel.toFixed(1)}+ (Você: v{crackerLevel.toFixed(1)})
            </span>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-gray-100">
        <button
          onClick={() => onClaimContract(contract.id)}
          disabled={contract.completed}
          className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
            contract.completed
              ? 'bg-emerald-50 text-emerald-700 cursor-default'
              : isBreached
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md animate-pulse'
                : 'bg-black hover:bg-gray-800 text-white shadow-sm'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>
            {contract.completed
              ? 'Recompensa Coletada'
              : isBreached
                ? 'Reivindicar Recompensa (Alvo Invadido!)'
                : `Invadir ${contract.targetHostname} & Reivindicar`}
          </span>
        </button>
      </div>
    </div>
  );
};
