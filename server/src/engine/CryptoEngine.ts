import { CryptoMarketState, CryptoCoin } from '../types/game.js';

export class CryptoEngine {
  private coins: Record<string, CryptoCoin> = {
    btc: {
      id: 'btc',
      name: 'Bitcoin',
      symbol: 'BTC',
      priceUsd: 68420,
      change24h: 3.8,
      priceHistory: [64200, 65100, 64800, 66300, 67200, 66900, 68420],
      volatility: 0.015,
      description: 'O ouro digital original. Moeda de alta liquidez e reserva de valor mundial.',
      color: '#f59e0b',
    },
    eth: {
      id: 'eth',
      name: 'Ethereum',
      symbol: 'ETH',
      priceUsd: 3480,
      change24h: 5.2,
      priceHistory: [3150, 3220, 3190, 3340, 3410, 3390, 3480],
      volatility: 0.022,
      description: 'Combustível para contratos inteligentes descentralizados e exploits web3.',
      color: '#6366f1',
    },
    shdw: {
      id: 'shdw',
      name: 'ShadowCash (XMR)',
      symbol: 'SHDW',
      priceUsd: 245.50,
      change24h: -1.4,
      priceHistory: [260, 255, 258, 250, 248, 242, 245.50],
      volatility: 0.035,
      description: 'Moeda 100% anônima e indetectável. Padrão de pagamento do Black Market.',
      color: '#10b981',
    },
    doge: {
      id: 'doge',
      name: 'DogeMeme Coin',
      symbol: 'DOGE',
      priceUsd: 0.385,
      change24h: 18.5,
      priceHistory: [0.28, 0.29, 0.31, 0.30, 0.34, 0.33, 0.385],
      volatility: 0.08,
      description: 'Moeda meme ultra-volátil movida a tweets de bilionários excêntricos.',
      color: '#eab308',
    },
    pepe: {
      id: 'pepe',
      name: 'CyberPepe Token',
      symbol: 'PEPE',
      priceUsd: 0.000045,
      change24h: 42.1,
      priceHistory: [0.000028, 0.000031, 0.000030, 0.000036, 0.000034, 0.000042, 0.000045],
      volatility: 0.12,
      description: 'Token de micro-capitalização de alto risco. Pode multiplicar por 10x ou zerar.',
      color: '#22c55e',
    },
  };

  private totalNetworkHashrate: number = 840.5;

  constructor() {
    this.startSimulation();
  }

  public getState(): CryptoMarketState {
    return {
      btcPrice: this.coins.btc.priceUsd,
      coins: this.coins,
      priceHistory: this.coins.btc.priceHistory,
      change24h: this.coins.btc.change24h,
      totalNetworkHashrate: this.totalNetworkHashrate,
    };
  }

  public getCoin(coinId: string): CryptoCoin | undefined {
    return this.coins[coinId.toLowerCase()];
  }

  // Reference price each coin reverts to. Without mean reversion the walk compounds
  // every 4s and drifts to astronomical values after a few hours of uptime.
  private readonly basePrices: Record<string, number> = Object.fromEntries(
    Object.values(this.coins).map(coin => [coin.id, coin.priceUsd]),
  );

  /** One market step: symmetric noise + pull toward the base price, hard-capped to [base/4, base*4]. */
  public tickPrices() {
    for (const coin of Object.values(this.coins)) {
      const base = this.basePrices[coin.id];
      const current = Number.isFinite(coin.priceUsd) && coin.priceUsd > 0 ? coin.priceUsd : base;

      // Long-run spread around the base grows with volatility (BTC ~16%, PEPE ~58%).
      const targetSpread = 0.1 + coin.volatility * 4;
      const reversion = (coin.volatility ** 2) / (6 * targetSpread ** 2);
      const noise = (Math.random() * 2 - 1) * coin.volatility;
      const logPrice = Math.log(current) + reversion * Math.log(base / current) + noise;
      const newPrice = Math.min(base * 4, Math.max(base / 4, Math.exp(logPrice)));

      coin.priceUsd = coin.id === 'pepe'
        ? Number(newPrice.toFixed(8))
        : coin.id === 'doge'
          ? Number(newPrice.toFixed(4))
          : Number(newPrice.toFixed(2));

      coin.priceHistory.push(coin.priceUsd);
      if (coin.priceHistory.length > 30) {
        coin.priceHistory.shift();
      }

      const startPrice = coin.priceHistory[0];
      coin.change24h = Number((((coin.priceUsd - startPrice) / startPrice) * 100).toFixed(1));
    }

    this.totalNetworkHashrate = Number((800 + Math.random() * 80).toFixed(1));
  }

  private startSimulation() {
    if (process.env.NODE_ENV === 'test') return;
    // Tick prices every 4 seconds
    setInterval(() => this.tickPrices(), 4000).unref();
  }
}
