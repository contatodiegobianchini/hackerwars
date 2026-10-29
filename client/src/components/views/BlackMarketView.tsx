import React, { useState } from 'react';
import { useGameStore } from '../../stores/useGameStore.js';
import { DollarSign, Bitcoin } from 'lucide-react';
import { MarketHeader, BlackMarketTab } from './blackmarket/MarketHeader.js';
import { MarketCrateCard } from './blackmarket/MarketCrateCard.js';
import { MarketAuctionCard } from './blackmarket/MarketAuctionCard.js';
import { MarketContractCard } from './blackmarket/MarketContractCard.js';
import { MarketRewardModal } from './blackmarket/MarketRewardModal.js';

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

  const [activeTab, setActiveTab] = useState<BlackMarketTab>('crates');
  const [paymentType, setPaymentType] = useState<'usd' | 'btc'>('usd');

  if (!player) return null;

  return (
    <div className="space-y-4">
      {/* Header & Sub-Tabs */}
      <MarketHeader activeTab={activeTab} setActiveTab={setActiveTab} />

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
            {crates.map(crate => (
              <MarketCrateCard
                key={crate.id}
                crate={crate}
                player={player}
                paymentType={paymentType}
                isOpeningLootbox={isOpeningLootbox}
                onOpenCrate={openLootbox}
              />
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: DARKNET AUCTION HOUSE */}
      {activeTab === 'auctions' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {auctions.map(auc => (
              <MarketAuctionCard
                key={auc.id}
                auction={auc}
                player={player}
                onPlaceBid={placeAuctionBid}
                onBuyout={buyoutAuction}
              />
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SYNDICATE CONTRACTS */}
      {activeTab === 'contracts' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contracts.map(cnt => (
              <MarketContractCard
                key={cnt.id}
                contract={cnt}
                player={player}
                onClaimContract={claimDarknetContract}
              />
            ))}
          </div>
        </div>
      )}

      {/* Lootbox Reward Unveiling Modal */}
      {activeLootReward && (
        <MarketRewardModal
          reward={activeLootReward}
          onClearReward={clearLootReward}
        />
      )}
    </div>
  );
};
