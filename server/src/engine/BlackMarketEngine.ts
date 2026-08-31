import { LootboxCrate, LootboxReward, ItemRarity, SoftwareItem, SoftwareType } from '../types/game.js';
import { v4 as uuidv4 } from 'uuid';

export class BlackMarketEngine {
  public crates: LootboxCrate[] = [
    {
      id: 'basic_stash',
      name: 'Cache Básico da Darknet',
      description: 'Lote de exploits e softwares apreendidos em fóruns clandestinos. Ótimo custo-benefício para iniciantes.',
      priceUsd: 2500,
      priceBtc: 0.030,
      tier: 'basic',
      icon: 'Package',
      accentColor: '#3b82f6',
      odds: { common: 82, uncommon: 15, rare: 2.8, epic: 0.2, legendary: 0 },
    },
    {
      id: 'shadow_vault',
      name: 'Cofre Criptografado Shadow',
      description: 'Arquivos protegidos por criptografia militar. Contém ferramentas avançadas de invasão e mineradores de alto ganho.',
      priceUsd: 9000,
      priceBtc: 0.100,
      tier: 'advanced',
      icon: 'Lock',
      accentColor: '#8b5cf6',
      odds: { common: 32, uncommon: 50, rare: 15, epic: 2.8, legendary: 0.2 },
    },
    {
      id: 'zeroday_vault',
      name: 'Célula Militar Zero-Day',
      description: 'Armamento cibernético de inteligência militar. Drops épicos são raros e a ferramenta ZeroDay Titan é extremamente limitada.',
      priceUsd: 30000,
      priceBtc: 0.300,
      tier: 'elite',
      icon: 'Flame',
      accentColor: '#f59e0b',
      odds: { common: 8, uncommon: 37, rare: 40, epic: 13.5, legendary: 1.5 },
    },
  ];

  public getCrates(): LootboxCrate[] { return this.crates; }

  public openCrate(crateId: string): LootboxReward {
    const crate = this.crates.find(c => c.id === crateId) || this.crates[0];
    return this.generateReward(this.rollRarity(crate.odds));
  }

  private rollRarity(odds: LootboxCrate['odds']): ItemRarity {
    const rand = Math.random() * 100;
    let accumulated = 0;
    accumulated += odds.common;
    if (rand < accumulated) return 'common';
    accumulated += odds.uncommon;
    if (rand < accumulated) return 'uncommon';
    accumulated += odds.rare;
    if (rand < accumulated) return 'rare';
    accumulated += odds.epic;
    if (rand < accumulated) return 'epic';
    return 'legendary';
  }

  private generateReward(rarity: ItemRarity): LootboxReward {
    const rollType = Math.random();
    if (rollType < 0.60) return this.generateSoftwareReward(rarity);
    if (rollType < 0.82) return this.generateCryptoReward(rarity);
    return this.generateCashReward(rarity);
  }

  private generateSoftwareReward(rarity: ItemRarity): LootboxReward {
    const toolTypes: SoftwareType[] = ['cracker', 'hasher', 'firewall', 'miner', 'ddos', 'portscan'];
    const chosenType = toolTypes[Math.floor(Math.random() * toolTypes.length)];
    let version = 1.2;
    let namePrefix = 'CrackMaster';
    let sizeMb = 20;

    switch (rarity) {
      case 'common':
        version = Number((Math.random() * 2.0 + 1.5).toFixed(1));
        namePrefix = chosenType === 'cracker' ? 'CrackMaster' : chosenType === 'hasher' ? 'SecureHash' : chosenType === 'miner' ? 'CryptoMinerX' : chosenType === 'ddos' ? 'StormBotNet' : 'AegisWall';
        sizeMb = Math.round(version * 6 + 10);
        break;
      case 'uncommon':
        version = Number((Math.random() * 3.0 + 4.0).toFixed(1));
        namePrefix = chosenType === 'cracker' ? 'ShadowCracker' : chosenType === 'hasher' ? 'CipherVault' : chosenType === 'miner' ? 'DarkMiner' : chosenType === 'ddos' ? 'MiraiCannon' : 'IronShield';
        sizeMb = Math.round(version * 5 + 15);
        break;
      case 'rare':
        version = Number((Math.random() * 6.0 + 8.0).toFixed(1));
        namePrefix = chosenType === 'cracker' ? 'VortexCracker' : chosenType === 'hasher' ? 'QuantumHash' : chosenType === 'miner' ? 'NanoMiner' : chosenType === 'ddos' ? 'TsunamiBotNet' : 'AegisTitan';
        sizeMb = Math.round(version * 4 + 20);
        break;
      case 'epic':
        version = Number((Math.random() * 8.0 + 16.0).toFixed(1));
        namePrefix = chosenType === 'cracker' ? 'ZeroDay_Titan_Mil' : chosenType === 'hasher' ? 'BlackHole_Crypt' : chosenType === 'miner' ? 'QuantumRig' : chosenType === 'ddos' ? 'OrbitalStrike' : 'GodShield';
        sizeMb = Math.round(version * 3.5 + 25);
        break;
      case 'legendary':
        version = Number((Math.random() * 10.0 + 30.0).toFixed(1));
        namePrefix = chosenType === 'cracker' ? 'TITAN_EXPLOIT_GODMODE' : chosenType === 'hasher' ? 'HYPER_QUANTUM_ENCRYPTOR' : chosenType === 'miner' ? 'SKYNET_CLUSTER_MINER' : chosenType === 'ddos' ? 'EXTINCTION_BOTNET' : 'IMPENETRABLE_FORTRESS';
        sizeMb = Math.round(version * 3 + 30);
        break;
    }

    const software: SoftwareItem = {
      id: `soft-loot-${uuidv4().substring(0, 8)}`,
      name: `${namePrefix}_v${version.toFixed(1)}`,
      type: chosenType,
      version,
      sizeMb,
      isInstalled: true,
      rarity,
    };

    return {
      rarity,
      type: 'software',
      title: `${software.name} [${rarity.toUpperCase()}]`,
      description: `Software especial de raridade ${rarity.toUpperCase()} concedido pelo Black Market!`,
      software,
    };
  }

  private generateCryptoReward(rarity: ItemRarity): LootboxReward {
    let btcAmount = 0.030;
    if (rarity === 'uncommon') btcAmount = 0.080;
    else if (rarity === 'rare') btcAmount = 0.200;
    else if (rarity === 'epic') btcAmount = 0.750;
    else if (rarity === 'legendary') btcAmount = 2.000;
    return {
      rarity,
      type: 'crypto',
      title: `Drop Cripto Anônimo: +${btcAmount} BTC`,
      description: 'Chave privada de carteira recuperada contendo Bitcoins limpos!',
      cryptoAmount: { symbol: 'BTC', amount: btcAmount, coinId: 'btc' },
    };
  }

  private generateCashReward(rarity: ItemRarity): LootboxReward {
    let cash = 2500;
    let rep = 75;
    if (rarity === 'uncommon') { cash = 8000; rep = 200; }
    else if (rarity === 'rare') { cash = 25000; rep = 650; }
    else if (rarity === 'epic') { cash = 75000; rep = 1800; }
    else if (rarity === 'legendary') { cash = 250000; rep = 6000; }
    return {
      rarity,
      type: 'cash',
      title: `Malote Financeiro Offshore: +$${cash.toLocaleString()}`,
      description: `Transferência anônima não rastreável e +${rep} REP!`,
      cashAmount: cash,
      repAmount: rep,
    };
  }
}
