import { LootboxCrate, LootboxReward, ItemRarity, SoftwareItem, SoftwareType } from '../types/game.js';
import { v4 as uuidv4 } from 'uuid';

export class BlackMarketEngine {
  public crates: LootboxCrate[] = [
    {
      id: 'basic_stash',
      name: 'Cache Básico da Darknet',
      description: 'Lote de exploits e softwares apreendidos em fóruns clandestinos. Ótimo custo-benefício para iniciantes.',
      priceUsd: 750,
      priceBtc: 0.010,
      tier: 'basic',
      icon: 'Package',
      accentColor: '#3b82f6',
      odds: {
        common: 65,
        uncommon: 25,
        rare: 8,
        epic: 2,
        legendary: 0,
      },
    },
    {
      id: 'shadow_vault',
      name: 'Cofre Criptografado Shadow',
      description: 'Arquivos protegidos por criptografia militar. Contém ferramentas avançadas de invasão e mineradores de alto ganho.',
      priceUsd: 2500,
      priceBtc: 0.035,
      tier: 'advanced',
      icon: 'Lock',
      accentColor: '#8b5cf6',
      odds: {
        common: 15,
        uncommon: 52,
        rare: 24,
        epic: 8,
        legendary: 1,
      },
    },
    {
      id: 'zeroday_vault',
      name: 'Célula Militar Zero-Day',
      description: 'Armamento cibernético de inteligência militar. Chance alta de exploits épicos e a lendária ferramenta ZeroDay Titan!',
      priceUsd: 8000,
      priceBtc: 0.10,
      tier: 'elite',
      icon: 'Flame',
      accentColor: '#f59e0b',
      odds: {
        common: 0,
        uncommon: 20,
        rare: 48,
        epic: 24,
        legendary: 8,
      },
    },
  ];

  public getCrates(): LootboxCrate[] {
    return this.crates;
  }

  public openCrate(crateId: string): LootboxReward {
    const crate = this.crates.find(c => c.id === crateId) || this.crates[0];
    const rarity = this.rollRarity(crate.odds);

    return this.generateReward(rarity);
  }

  private rollRarity(odds: LootboxCrate['odds']): ItemRarity {
    const rand = Math.random() * 100;
    let accumulated = 0;

    accumulated += odds.common;
    if (rand <= accumulated) return 'common';

    accumulated += odds.uncommon;
    if (rand <= accumulated) return 'uncommon';

    accumulated += odds.rare;
    if (rand <= accumulated) return 'rare';

    accumulated += odds.epic;
    if (rand <= accumulated) return 'epic';

    return 'legendary';
  }

  private generateReward(rarity: ItemRarity): LootboxReward {
    const rollType = Math.random();

    // 70% chance of Software, 30% chance of high Cash/Crypto/Rep bonus
    if (rollType < 0.70) {
      return this.generateSoftwareReward(rarity);
    } else if (rollType < 0.85) {
      return this.generateCryptoReward(rarity);
    } else {
      return this.generateCashReward(rarity);
    }
  }

  private generateSoftwareReward(rarity: ItemRarity): LootboxReward {
    const toolTypes: SoftwareType[] = ['cracker', 'hasher', 'firewall', 'miner', 'ddos', 'portscan'];
    const chosenType = toolTypes[Math.floor(Math.random() * toolTypes.length)];

    let version = 1.2;
    let namePrefix = 'CrackMaster';
    let sizeMb = 20;

    switch (rarity) {
      case 'common':
        version = Number((Math.random() * 2.5 + 2.0).toFixed(1)); // v2.0 - v4.5
        namePrefix = chosenType === 'cracker' ? 'CrackMaster' : chosenType === 'hasher' ? 'SecureHash' : chosenType === 'miner' ? 'CryptoMinerX' : chosenType === 'ddos' ? 'StormBotNet' : 'AegisWall';
        sizeMb = Math.round(version * 6 + 10);
        break;

      case 'uncommon':
        version = Number((Math.random() * 4.5 + 5.0).toFixed(1)); // v5.0 - v9.5
        namePrefix = chosenType === 'cracker' ? 'ShadowCracker' : chosenType === 'hasher' ? 'CipherVault' : chosenType === 'miner' ? 'DarkMiner' : chosenType === 'ddos' ? 'MiraiCannon' : 'IronShield';
        sizeMb = Math.round(version * 5 + 15);
        break;

      case 'rare':
        version = Number((Math.random() * 8.0 + 10.0).toFixed(1)); // v10.0 - v18.0
        namePrefix = chosenType === 'cracker' ? 'VortexCracker' : chosenType === 'hasher' ? 'QuantumHash' : chosenType === 'miner' ? 'NanoMiner' : chosenType === 'ddos' ? 'TsunamiBotNet' : 'AegisTitan';
        sizeMb = Math.round(version * 4 + 20);
        break;

      case 'epic':
        version = Number((Math.random() * 12.0 + 20.0).toFixed(1)); // v20.0 - v32.0
        namePrefix = chosenType === 'cracker' ? 'ZeroDay_Titan_Mil' : chosenType === 'hasher' ? 'BlackHole_Crypt' : chosenType === 'miner' ? 'QuantumRig' : chosenType === 'ddos' ? 'OrbitalStrike' : 'GodShield';
        sizeMb = Math.round(version * 3.5 + 25);
        break;

      case 'legendary':
        version = Number((Math.random() * 15.0 + 35.0).toFixed(1)); // v35.0 - v50.0
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
    let btcAmount = 0.050;
    if (rarity === 'uncommon') btcAmount = 0.150;
    else if (rarity === 'rare') btcAmount = 0.500;
    else if (rarity === 'epic') btcAmount = 1.500;
    else if (rarity === 'legendary') btcAmount = 4.000;

    return {
      rarity,
      type: 'crypto',
      title: `Drop Cripto Anônimo: +${btcAmount} BTC`,
      description: `Chave privada de carteira recuperada contendo Bitcoins limpos!`,
      cryptoAmount: { symbol: 'BTC', amount: btcAmount, coinId: 'btc' },
    };
  }

  private generateCashReward(rarity: ItemRarity): LootboxReward {
    let cash = 5000;
    let rep = 150;

    if (rarity === 'uncommon') { cash = 18000; rep = 450; }
    else if (rarity === 'rare') { cash = 55000; rep = 1200; }
    else if (rarity === 'epic') { cash = 150000; rep = 3500; }
    else if (rarity === 'legendary') { cash = 450000; rep = 10000; }

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
