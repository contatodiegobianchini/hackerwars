import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../stores/useGameStore.js';
import { Bitcoin, Zap, ArrowUpRight, ArrowDownRight, RefreshCw, Layers } from 'lucide-react';

export const CryptoView: React.FC = () => {
  const {
    player,
    cryptoState,
    tradeCrypto,
    setMiningCoin,
    allServers
  } = useGameStore();

  const [selectedCoinId, setSelectedCoinId] = useState<string>('btc');
  const [tradeUsdAmount, setTradeUsdAmount] = useState<number>(500);
  const [tradeCoinAmount, setTradeCoinAmount] = useState<number>(0.01);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const coins = cryptoState?.coins || {};
  const currentCoin = coins[selectedCoinId] || {
    id: 'btc',
    name: 'Bitcoin',
    symbol: 'BTC',
    priceUsd: 68000,
    change24h: 3.5,
    priceHistory: [65000, 66000, 68000],
    volatility: 0.015,
    description: 'Ouro digital',
    color: '#f59e0b',
  };

  // Canvas price chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = (canvas.width = canvas.parentElement?.clientWidth || 500);
    const height = (canvas.height = 160);

    ctx.clearRect(0, 0, width, height);

    const history = currentCoin.priceHistory && currentCoin.priceHistory.length > 0
      ? currentCoin.priceHistory
      : [currentCoin.priceUsd * 0.95, currentCoin.priceUsd];

    const min = Math.min(...history) * 0.99;
    const max = Math.max(...history) * 1.01;
    const range = max - min || 1;

    // Horizontal grid lines
    ctx.strokeStyle = '#f3f4f6';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
      const y = (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Line
    ctx.beginPath();
    history.forEach((val, idx) => {
      const x = (width / (history.length - 1)) * idx;
      const y = height - ((val - min) / range) * height;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = currentCoin.color || '#111827';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Pulse dot at current price
    const lastX = width;
    const lastY = height - ((history[history.length - 1] - min) / range) * height;
    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fillStyle = currentCoin.color || '#111827';
    ctx.fill();
  }, [currentCoin]);

  if (!player) return null;

  const wallet = player.cryptoWallet || {
    btc: player.crypto || 0,
    eth: 0,
    doge: 0,
    shdw: 0,
    pepe: 0,
  };

  const userCoinBalance = wallet[selectedCoinId] || 0;
  const userCoinUsdValue = userCoinBalance * currentCoin.priceUsd;

  const totalPortfolioUsd = Object.entries(wallet).reduce((acc, [cId, amt]) => {
    const c = coins[cId];
    return acc + (c ? (amt || 0) * c.priceUsd : 0);
  }, 0);

  const activeMinerServers = (allServers.length > 0 ? allServers : [])
    .filter(s => s.activeMiners && s.activeMiners.some((m: any) => m.ownerId === player.id));

  const totalHashRate = activeMinerServers.reduce((acc, s) => {
    const miner = s.activeMiners.find((m: any) => m.ownerId === player.id);
    return acc + (miner ? miner.hashRate : 0);
  }, 0);

  const handleBuy = () => {
    tradeCrypto(selectedCoinId, 'buy', tradeUsdAmount);
  };

  const handleSell = () => {
    tradeCrypto(selectedCoinId, 'sell', undefined, tradeCoinAmount);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Bitcoin className="w-5 h-5 text-gray-700" />
              <h1 className="text-base font-bold text-gray-900">Exchange Cripto & Mercado Financeiro</h1>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Negocie múltiplas criptomoedas em tempo real ou direcione sua fazenda de mineração.
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-100 px-4 py-2 rounded-xl text-right font-mono">
            <div className="text-[10px] text-gray-400 font-semibold uppercase">PORTFÓLIO TOTAL</div>
            <div className="text-base font-bold text-emerald-600">${totalPortfolioUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
          </div>
        </div>
      </div>

      {/* Coin Selector Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Object.values(coins).map(coin => {
          const isSelected = selectedCoinId === coin.id;
          const isPositive = coin.change24h >= 0;

          return (
            <div
              key={coin.id}
              onClick={() => setSelectedCoinId(coin.id)}
              className={`p-3.5 rounded-2xl cursor-pointer transition flex flex-col justify-between border ${
                isSelected
                  ? 'bg-black text-white shadow-md border-black'
                  : 'bg-white text-gray-900 border-gray-100 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs">{coin.symbol}</span>
                <span className={`text-[10px] font-mono font-bold flex items-center ${
                  isPositive
                    ? isSelected ? 'text-emerald-300' : 'text-emerald-600'
                    : isSelected ? 'text-red-300' : 'text-red-600'
                }`}>
                  {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  <span>{Math.abs(coin.change24h)}%</span>
                </span>
              </div>

              <div className="mt-2">
                <div className="text-sm font-bold font-mono">
                  ${coin.priceUsd < 1 ? coin.priceUsd.toFixed(6) : coin.priceUsd.toLocaleString()}
                </div>
                <div className={`text-[10px] truncate ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
                  {coin.name}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Chart for Selected Coin */}
      <div className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-bold text-gray-900">{currentCoin.name} ({currentCoin.symbol})</span>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                currentCoin.change24h >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
              }`}>
                {currentCoin.change24h >= 0 ? `+${currentCoin.change24h}%` : `${currentCoin.change24h}%`} (24h)
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-gray-900 mt-1">
              ${currentCoin.priceUsd < 1 ? currentCoin.priceUsd.toFixed(6) : currentCoin.priceUsd.toLocaleString()}
            </div>
          </div>

          <div className="text-right text-xs font-mono text-gray-500">
            <div>Seu Saldo: <strong className="text-gray-900">{userCoinBalance} {currentCoin.symbol}</strong></div>
            <div>≈ ${userCoinUsdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD</div>
          </div>
        </div>

        <div className="w-full h-40 bg-gray-50 rounded-xl p-2 border border-gray-100 relative">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>
      </div>

      {/* Buy / Sell Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Buy */}
        <div className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Comprar {currentCoin.symbol} (USD → {currentCoin.symbol})
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-[11px] text-gray-500 mb-1">
                <span>Valor em Dinheiro ($ USD)</span>
                <span>Saldo: ${player.cash.toLocaleString()}</span>
              </div>
              <input
                type="number"
                min="1"
                max={player.cash}
                value={tradeUsdAmount}
                onChange={e => setTradeUsdAmount(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-gray-900 outline-none focus:border-black"
              />
            </div>

            <div className="flex gap-2">
              {[25, 50, 75, 100].map(pct => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setTradeUsdAmount(Math.floor(player.cash * (pct / 100)))}
                  className="flex-1 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-[10px] font-mono text-gray-700"
                >
                  {pct}%
                </button>
              ))}
            </div>

            <button
              onClick={handleBuy}
              className="w-full bg-black hover:bg-gray-800 text-white font-semibold text-xs py-2.5 rounded-xl shadow-sm transition"
            >
              Comprar {currentCoin.symbol}
            </button>
          </div>
        </div>

        {/* Sell */}
        <div className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Vender {currentCoin.symbol} ({currentCoin.symbol} → USD)
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-[11px] text-gray-500 mb-1">
                <span>Quantidade em {currentCoin.symbol}</span>
                <span>Disponível: {userCoinBalance}</span>
              </div>
              <input
                type="number"
                step={currentCoin.priceUsd < 1 ? '100' : '0.001'}
                min="0.000001"
                max={userCoinBalance}
                value={tradeCoinAmount}
                onChange={e => setTradeCoinAmount(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-gray-900 outline-none focus:border-black"
              />
            </div>

            <div className="flex gap-2">
              {[25, 50, 75, 100].map(pct => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setTradeCoinAmount(Number((userCoinBalance * (pct / 100)).toFixed(currentCoin.priceUsd < 1 ? 0 : 4)))}
                  className="flex-1 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-[10px] font-mono text-gray-700"
                >
                  {pct}%
                </button>
              ))}
            </div>

            <button
              onClick={handleSell}
              className="w-full bg-black hover:bg-gray-800 text-white font-semibold text-xs py-2.5 rounded-xl shadow-sm transition"
            >
              Vender {currentCoin.symbol} para USD
            </button>
          </div>
        </div>
      </div>

      {/* Mining Farm Target Configuration */}
      <div className="bg-white text-gray-900 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-gray-700" />
            <div>
              <h3 className="font-bold text-sm text-gray-900">Alocação da Fazenda de Mineração</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Escolha qual criptomoeda seus mineradores remotos ({totalHashRate.toFixed(1)} GH/s ativos) irão gerar a cada 5 segundos.
              </p>
            </div>
          </div>

          {/* Coin Selector Radio */}
          <div className="flex items-center space-x-1.5 bg-gray-100 p-1 rounded-xl text-xs font-mono">
            {['btc', 'eth', 'shdw', 'doge', 'pepe'].map(cId => {
              const isActive = (player.miningTargetCoin || 'btc') === cId;
              return (
                <button
                  key={cId}
                  onClick={() => setMiningCoin(cId)}
                  className={`px-3 py-1 rounded-lg uppercase transition ${
                    isActive ? 'bg-white text-black font-bold shadow-sm' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {cId}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Miners Server List */}
        {activeMinerServers.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-6 text-center text-xs text-gray-500">
            Nenhum minerador instalado ainda. Invada um servidor e clique em "Instalar Minerador de Cripto"!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeMinerServers.map(srv => {
              const miner = srv.activeMiners.find((m: any) => m.ownerId === player.id);
              return (
                <div key={srv.ip} className="bg-gray-50 border border-gray-100 p-3.5 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-gray-900">{srv.hostname}</div>
                    <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                      IP: {srv.ip} • CPU: {srv.hardware?.cpuPower} GHz
                    </div>
                  </div>
                  <div className="text-right font-mono text-xs font-bold text-emerald-600">
                    +{miner?.hashRate} GH/s
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
