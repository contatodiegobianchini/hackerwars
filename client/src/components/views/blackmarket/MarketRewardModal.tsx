import React from 'react';
import { X, Zap, Bitcoin, DollarSign } from 'lucide-react';
import { ItemRarity, LootboxReward } from '../../../types/game.js';

interface MarketRewardModalProps {
  reward: LootboxReward;
  onClearReward: () => void;
}

export const MarketRewardModal: React.FC<MarketRewardModalProps> = ({ reward, onClearReward }) => {
  const getRarityBadge = (rarity: ItemRarity) => {
    switch (rarity) {
      case 'common': return { label: 'Comum', bg: 'bg-gray-100 text-gray-700 border-gray-300' };
      case 'uncommon': return { label: 'Incomum', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'rare': return { label: 'Raro', bg: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'epic': return { label: 'Épico', bg: 'bg-purple-100 text-purple-800 border-purple-300' };
      case 'legendary': return { label: 'LENDÁRIO', bg: 'bg-amber-100 text-amber-900 border-amber-400 font-extrabold' };
    }
  };

  const badge = getRarityBadge(reward.rarity);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none animate-fade-in">
      <div className="bg-white text-gray-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-gray-100 text-center relative space-y-4">
        <button
          onClick={onClearReward}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Rarity Pill */}
        <div>
          <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${badge.bg}`}>
            RARIDADE: {badge.label.toUpperCase()}
          </span>
        </div>

        {/* Glow Icon Box */}
        <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center shadow-lg ${
          reward.rarity === 'legendary'
            ? 'bg-amber-400 text-black shadow-amber-300/50 animate-bounce'
            : reward.rarity === 'epic'
              ? 'bg-purple-600 text-white shadow-purple-300/50'
              : reward.rarity === 'rare'
                ? 'bg-blue-600 text-white shadow-blue-300/50'
                : 'bg-emerald-600 text-white'
        }`}>
          {reward.type === 'software' ? (
            <Zap className="w-10 h-10" />
          ) : reward.type === 'crypto' ? (
            <Bitcoin className="w-10 h-10" />
          ) : (
            <DollarSign className="w-10 h-10" />
          )}
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900">{reward.title}</h2>
          <p className="text-xs text-gray-500 mt-1">{reward.description}</p>
        </div>

        {reward.software && (
          <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 text-xs font-mono text-gray-700 space-y-1">
            <div>Versão: <strong className="text-gray-900">v{reward.software.version.toFixed(1)}</strong></div>
            <div>Tamanho: <strong className="text-gray-900">{reward.software.sizeMb} MB</strong></div>
            <div>Tipo: <strong className="text-gray-900">{reward.software.type.toUpperCase()}</strong></div>
          </div>
        )}

        <button
          onClick={onClearReward}
          className="w-full bg-black hover:bg-gray-800 text-white font-bold text-xs py-3 rounded-2xl shadow-md transition"
        >
          Equipar & Guardar no Meu Sistema
        </button>
      </div>
    </div>
  );
};
