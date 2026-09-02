import React from 'react';
import { ShoppingBag, Package, Sparkles, Award } from 'lucide-react';

export type BlackMarketTab = 'crates' | 'auctions' | 'contracts';

interface MarketHeaderProps {
  activeTab: BlackMarketTab;
  setActiveTab: (tab: BlackMarketTab) => void;
}

export const MarketHeader: React.FC<MarketHeaderProps> = ({ activeTab, setActiveTab }) => {
  return (
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
  );
};
