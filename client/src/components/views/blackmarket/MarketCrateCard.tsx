import React from 'react';
import { Package, Lock, Flame, Sparkles } from 'lucide-react';
import { LootboxCrate, Player } from '../../../types/game.js';

interface MarketCrateCardProps {
  crate: LootboxCrate;
  player: Player;
  paymentType: 'usd' | 'btc';
  isOpeningLootbox: boolean;
  onOpenCrate: (crateId: string, paymentType: 'usd' | 'btc') => void;
}

export const MarketCrateCard: React.FC<MarketCrateCardProps> = ({
  crate,
  player,
  paymentType,
  isOpeningLootbox,
  onOpenCrate
}) => {
  const getCrateIcon = (iconName: string) => {
    switch (iconName) {
      case 'Lock': return Lock;
      case 'Flame': return Flame;
      default: return Package;
    }
  };

  const Icon = getCrateIcon(crate.icon);
  const canAfford = paymentType === 'usd'
    ? player.cash >= crate.priceUsd
    : (player.cryptoWallet?.btc || 0) >= crate.priceBtc;

  return (
    <div className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4 border border-gray-100">
      <div>
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-800 shadow-sm">
            <Icon className="w-6 h-6" />
          </div>

          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md uppercase ${
            crate.tier === 'elite'
              ? 'bg-amber-100 text-amber-800'
              : crate.tier === 'advanced'
                ? 'bg-purple-100 text-purple-800'
                : 'bg-blue-100 text-blue-800'
          }`}>
            TIER {crate.tier.toUpperCase()}
          </span>
        </div>

        <h3 className="font-bold text-sm text-gray-900 mt-3">{crate.name}</h3>
        <p className="text-xs text-gray-600 mt-1 leading-relaxed">{crate.description}</p>

        {/* Odds Breakdown */}
        <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Probabilidades de Drop
          </div>
          <div className="grid grid-cols-5 gap-1 text-center font-mono text-[10px]">
            <div className="bg-gray-50 p-1 rounded">
              <div className="text-gray-400">Comum</div>
              <div className="font-bold text-gray-700">{crate.odds.common}%</div>
            </div>
            <div className="bg-emerald-50 p-1 rounded">
              <div className="text-emerald-600">Incom.</div>
              <div className="font-bold text-emerald-800">{crate.odds.uncommon}%</div>
            </div>
            <div className="bg-blue-50 p-1 rounded">
              <div className="text-blue-600">Raro</div>
              <div className="font-bold text-blue-800">{crate.odds.rare}%</div>
            </div>
            <div className="bg-purple-50 p-1 rounded">
              <div className="text-purple-600">Épico</div>
              <div className="font-bold text-purple-800">{crate.odds.epic}%</div>
            </div>
            <div className="bg-amber-50 p-1 rounded">
              <div className="text-amber-600">Lend.</div>
              <div className="font-bold text-amber-800">{crate.odds.legendary}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Price & Open Button */}
      <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
        <div className="font-mono text-xs">
          <div className="text-[10px] text-gray-400">Preço da Caixa</div>
          <div className={`font-bold ${canAfford ? 'text-gray-900' : 'text-red-500'}`}>
            {paymentType === 'usd' ? `$${crate.priceUsd.toLocaleString()}` : `${crate.priceBtc} BTC`}
          </div>
        </div>

        <button
          onClick={() => onOpenCrate(crate.id, paymentType)}
          disabled={!canAfford || isOpeningLootbox}
          className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            canAfford
              ? 'bg-black hover:bg-gray-800 text-white shadow-sm'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isOpeningLootbox ? 'Abrindo...' : 'Abrir Caixa'}</span>
        </button>
      </div>
    </div>
  );
};
