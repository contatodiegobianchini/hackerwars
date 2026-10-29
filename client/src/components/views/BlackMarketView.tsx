import React, { useState } from 'react';
import { useGameStore } from '../../stores/useGameStore.js';
import {
  ShoppingBag,
  Package,
  Lock,
  Flame,
  Sparkles,
  DollarSign,
  Bitcoin,
  CheckCircle2,
  X,
  Award,
  Zap,
  Key,
  ShieldCheck
} from 'lucide-react';
import { LootboxCrate, ItemRarity } from '../../types/game.js';

export const BlackMarketView: React.FC = () => {
  const {
    player,
    crates,
    openLootbox,
    activeLootReward,
    clearLootReward,
    isOpeningLootbox,
    auctions,
    placeAuctionBid,
    buyoutAuction,
    contracts,
    claimDarknetContract
  } = useGameStore();

  const [activeTab, setActiveTab] = useState<'crates' | 'auctions' | 'contracts'>('crates');
  const [paymentType, setPaymentType] = useState<'usd' | 'btc'>('usd');

  if (!player) return null;

  const getRarityBadge = (rarity: ItemRarity) => {
    switch (rarity) {
      case 'common': return { label: 'Comum', bg: 'bg-gray-100 text-gray-700 border-gray-300' };
      case 'uncommon': return { label: 'Incomum', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'rare': return { label: 'Raro', bg: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'epic': return { label: 'Épico', bg: 'bg-purple-100 text-purple-800 border-purple-300' };
      case 'legendary': return { label: 'LENDÁRIO', bg: 'bg-amber-100 text-amber-900 border-amber-400 font-extrabold' };
    }
  };

  const getCrateIcon = (iconName: string) => {
    switch (iconName) {
      case 'Lock': return Lock;
      case 'Flame': return Flame;
      default: return Package;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Sub-Tabs */}
      <div className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-gray-700" />
              <h1 className="text-base font-bold text-gray-900">Black Market // Mercado Clandestino</h1>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Caches de software raros, leilão de zero-days militares e contratos de alta recompensa da Darknet.
            </p>
          </div>

          {/* Sub-Tabs Selector */}
          <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('crates')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
                activeTab === 'crates' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Lootboxes</span>
            </button>

            <button
              onClick={() => setActiveTab('auctions')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
                activeTab === 'auctions' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Leilão de Zero-Days</span>
            </button>

            <button
              onClick={() => setActiveTab('contracts')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
                activeTab === 'contracts' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-blue-500" />
              <span>Contratos Syndicate</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: LOOTBOXES */}
      {activeTab === 'crates' && (
        <div className="space-y-4">
          {/* Payment Toggle */}
          <div className="flex justify-end">
            <div className="flex items-center space-x-1 bg-white p-1 rounded-xl text-xs font-semibold shadow-sm border border-gray-100">
              <button
                onClick={() => setPaymentType('usd')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1 ${
                  paymentType === 'usd' ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>USD (${player.cash.toLocaleString()})</span>
              </button>

              <button
                onClick={() => setPaymentType('btc')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1 ${
                  paymentType === 'btc' ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Bitcoin className="w-3.5 h-3.5" />
                <span>BTC ({player.cryptoWallet?.btc?.toFixed(4) || 0} BTC)</span>
              </button>
            </div>
          </div>

          {/* Crates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {crates.map(crate => {
              const Icon = getCrateIcon(crate.icon);
              const canAfford = paymentType === 'usd'
                ? player.cash >= crate.priceUsd
                : (player.cryptoWallet?.btc || 0) >= crate.priceBtc;

              return (
                <div
                  key={crate.id}
                  className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4 border border-gray-100"
                >
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
                      onClick={() => openLootbox(crate.id, paymentType)}
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
            })}
          </div>
        </div>
      )}

      {/* TAB 2: DARKNET AUCTION HOUSE */}
      {activeTab === 'auctions' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {auctions.map(auc => {
              const canAffordBid = player.cash >= auc.minNextBidUsd;
              const canAffordBuyout = player.cash >= auc.buyoutUsd;

              return (
                <div
                  key={auc.id}
                  className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded uppercase">
                        LEILÃO AO VIVO
                      </span>
                      <span className="text-xs font-mono text-gray-400">
                        {auc.highestBidder}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-gray-900 mt-2">{auc.title}</h3>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">{auc.description}</p>

                    <div className="mt-4 p-3 bg-gray-50 rounded-xl space-y-1 text-xs font-mono">
                      <div className="flex justify-between text-gray-500">
                        <span>Lance Atual:</span>
                        <strong className="text-gray-900">${auc.currentBidUsd.toLocaleString()} USD</strong>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>Líder Atual:</span>
                        <span className="text-blue-600 font-semibold">{auc.highestBidder}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => placeAuctionBid(auc.id, auc.minNextBidUsd)}
                        disabled={!canAffordBid}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 ${
                          canAffordBid
                            ? 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                            : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <span>Dar Lance (${auc.minNextBidUsd.toLocaleString()})</span>
                      </button>

                      <button
                        onClick={() => buyoutAuction(auc.id)}
                        disabled={!canAffordBuyout}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 ${
                          canAffordBuyout
                            ? 'bg-amber-500 hover:bg-amber-600 text-black shadow-sm'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <Zap className="w-3 h-3" />
                        <span>Arrematar (${auc.buyoutUsd.toLocaleString()})</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: SYNDICATE CONTRACTS */}
      {activeTab === 'contracts' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contracts.map(cnt => {
              const cracker = player.software.find(s => s.type === 'cracker');
              const crackerLevel = cracker ? cracker.version : 1.0;
              const hasLevel = crackerLevel >= cnt.requiredCrackerLevel;
              const target = useGameStore.getState().servers.find(s => s.ip === cnt.targetIp) ||
                             useGameStore.getState().allServers.find(s => s.ip === cnt.targetIp);
              const isBreached = target ? target.security.isBreached : false;

              return (
                <div
                  key={cnt.id}
                  className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                        cnt.completed ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {cnt.completed ? 'CONCLUÍDO' : 'CONTRATO DISPONÍVEL'}
                      </span>

                      <span className="text-xs font-mono text-gray-400">
                        {cnt.targetHostname} ({cnt.targetIp})
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-gray-900 mt-2">{cnt.title}</h3>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">{cnt.description}</p>

                    <div className="mt-4 p-3 bg-gray-50 rounded-xl space-y-1.5 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Recompensa:</span>
                        <span className="font-bold text-emerald-600">
                          +${cnt.rewardCash.toLocaleString()} USD
                          {cnt.rewardCryptoBtc ? ` + ${cnt.rewardCryptoBtc} BTC` : ''}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Reputação:</span>
                        <span className="font-bold text-blue-600">+{cnt.rewardRep} REP</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Cracker Exigido:</span>
                        <span className={`font-bold ${hasLevel ? 'text-gray-900' : 'text-red-500'}`}>
                          v{cnt.requiredCrackerLevel.toFixed(1)}+ (Você: v{crackerLevel.toFixed(1)})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100">
                    <button
                      onClick={() => claimDarknetContract(cnt.id)}
                      disabled={cnt.completed}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                        cnt.completed
                          ? 'bg-emerald-50 text-emerald-700 cursor-default'
                          : isBreached
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md animate-pulse'
                            : 'bg-black hover:bg-gray-800 text-white shadow-sm'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>
                        {cnt.completed
                          ? 'Recompensa Coletada'
                          : isBreached
                            ? 'Reivindicar Recompensa (Alvo Invadido!)'
                            : `Invadir ${cnt.targetHostname} & Reivindicar`}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lootbox Reward Unveiling Modal */}
      {activeLootReward && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none animate-fade-in">
          <div className="bg-white text-gray-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-gray-100 text-center relative space-y-4">
            <button
              onClick={clearLootReward}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Rarity Pill */}
            <div>
              <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${getRarityBadge(activeLootReward.rarity).bg}`}>
                RARIDADE: {getRarityBadge(activeLootReward.rarity).label.toUpperCase()}
              </span>
            </div>

            {/* Glow Icon Box */}
            <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center shadow-lg ${
              activeLootReward.rarity === 'legendary'
                ? 'bg-amber-400 text-black shadow-amber-300/50 animate-bounce'
                : activeLootReward.rarity === 'epic'
                  ? 'bg-purple-600 text-white shadow-purple-300/50'
                  : activeLootReward.rarity === 'rare'
                    ? 'bg-blue-600 text-white shadow-blue-300/50'
                    : 'bg-emerald-600 text-white'
            }`}>
              {activeLootReward.type === 'software' ? (
                <Zap className="w-10 h-10" />
              ) : activeLootReward.type === 'crypto' ? (
                <Bitcoin className="w-10 h-10" />
              ) : (
                <DollarSign className="w-10 h-10" />
              )}
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900">{activeLootReward.title}</h2>
              <p className="text-xs text-gray-500 mt-1">{activeLootReward.description}</p>
            </div>

            {activeLootReward.software && (
              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 text-xs font-mono text-gray-700 space-y-1">
                <div>Versão: <strong className="text-gray-900">v{activeLootReward.software.version.toFixed(1)}</strong></div>
                <div>Tamanho: <strong className="text-gray-900">{activeLootReward.software.sizeMb} MB</strong></div>
                <div>Tipo: <strong className="text-gray-900">{activeLootReward.software.type.toUpperCase()}</strong></div>
              </div>
            )}

            <button
              onClick={clearLootReward}
              className="w-full bg-black hover:bg-gray-800 text-white font-bold text-xs py-3 rounded-2xl shadow-md transition"
            >
              Equipar & Guardar no Meu Sistema
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
