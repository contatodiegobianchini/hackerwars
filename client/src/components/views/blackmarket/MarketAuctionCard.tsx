import React from 'react';
import { Zap } from 'lucide-react';
import { DarknetAuctionItem, Player } from '../../../types/game.js';

interface MarketAuctionCardProps {
  auction: DarknetAuctionItem;
  player: Player;
  onPlaceBid: (auctionId: string, amount: number) => void;
  onBuyout: (auctionId: string) => void;
}

export const MarketAuctionCard: React.FC<MarketAuctionCardProps> = ({
  auction,
  player,
  onPlaceBid,
  onBuyout
}) => {
  const canAffordBid = player.cash >= auction.minNextBidUsd;
  const canAffordBuyout = player.cash >= auction.buyoutUsd;

  return (
    <div className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between space-y-4">
      <div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded uppercase">
            LEILÃO AO VIVO
          </span>
          <span className="text-xs font-mono text-gray-400">
            {auction.highestBidder}
          </span>
        </div>

        <h3 className="font-bold text-sm text-gray-900 mt-2">{auction.title}</h3>
        <p className="text-xs text-gray-600 mt-1 leading-relaxed">{auction.description}</p>

        <div className="mt-4 p-3 bg-gray-50 rounded-xl space-y-1 text-xs font-mono">
          <div className="flex justify-between text-gray-500">
            <span>Lance Atual:</span>
            <strong className="text-gray-900">${auction.currentBidUsd.toLocaleString()} USD</strong>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Líder Atual:</span>
            <span className="text-blue-600 font-semibold">{auction.highestBidder}</span>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-gray-100 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => onPlaceBid(auction.id, auction.minNextBidUsd)}
            disabled={!canAffordBid}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 ${
              canAffordBid
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                : 'bg-gray-50 text-gray-400 cursor-not-allowed'
            }`}
          >
            <span>Dar Lance (${auction.minNextBidUsd.toLocaleString()})</span>
          </button>

          <button
            onClick={() => onBuyout(auction.id)}
            disabled={!canAffordBuyout}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 ${
              canAffordBuyout
                ? 'bg-amber-500 hover:bg-amber-600 text-black shadow-sm'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Zap className="w-3 h-3" />
            <span>Arrematar (${auction.buyoutUsd.toLocaleString()})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
