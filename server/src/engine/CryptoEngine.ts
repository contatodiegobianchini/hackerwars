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

  private startSimulation() {
    // Tick prices every 4 seconds
    setInterval(() => {
      for (const coin of Object.values(this.coins)) {
        // Random percentage shift based on volatility
        const rand = (Math.random() * 2 - 0.98);
        const percentChange = rand * coin.volatility;
        const newPrice = Math.max(0.000001, coin.priceUsd * (1 + percentChange));

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
    }, 4000);
  }
}
