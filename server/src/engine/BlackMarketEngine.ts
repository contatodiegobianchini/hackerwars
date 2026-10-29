import { LootboxCrate, LootboxReward, ItemRarity, SoftwareItem, SoftwareType } from '../types/game.js';
import { v4 as uuidv4 } from 'uuid';

export class BlackMarketEngine {
  public crates: LootboxCrate[] = [
    {
      id: 'basic_stash', name: 'Cache Básico da Darknet', description: 'Lote de exploits e softwares apreendidos em fóruns clandestinos. Ótimo custo-benefício para iniciantes.', priceUsd: 2500, priceBtc: 0.030, tier: 'basic', icon: 'Package', accentColor: '#3b82f6', odds: { common: 84, uncommon: 15, rare: 1, epic: 0, legendary: 0 },
    },
    {
      id: 'shadow_vault', name: 'Cofre Criptografado Shadow', description: 'Arquivos protegidos por criptografia militar. Contém ferramentas avançadas de invasão e mineradores de alto ganho.', priceUsd: 9000, priceBtc: 0.100, tier: 'advanced', icon: 'Lock', accentColor: '#8b5cf6', odds: { common: 35, uncommon: 52, rare: 11, epic: 1.8, legendary: 0.2 },
    },
    {
      id: 'zeroday_vault', name: 'Célula Militar Zero-Day', description: 'Armamento cibernético de inteligência militar. Drops épicos são raros e a ferramenta ZeroDay Titan é extremamente limitada.', priceUsd: 30000, priceBtc: 0.300, tier: 'elite', icon: 'Flame', accentColor: '#f59e0b', odds: { common: 15, uncommon: 43, rare: 32, epic: 9, legendary: 1 },
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
    accumulated += odds.common; if (rand < accumulated) return 'common';
    accumulated += odds.uncommon; if (rand < accumulated) return 'uncommon';
    accumulated += odds.rare; if (rand < accumulated) return 'rare';
    accumulated += odds.epic; if (rand < accumulated) return 'epic';
    return 'legendary';
  }

  private generateReward(rarity: ItemRarity): LootboxReward {
    const rollType = Math.random();
    if (rollType < 0.58) return this.generateSoftwareReward(rarity);
    if (rollType < 0.82) return this.generateCryptoReward(rarity);
    return this.generateCashReward(rarity);
  }

  private generateSoftwareReward(rarity: ItemRarity): LootboxReward {
    const toolTypes: SoftwareType[] = ['cracker', 'hasher', 'firewall', 'miner', 'ddos', 'portscan'];
    const chosenType = toolTypes[Math.floor(Math.random() * toolTypes.length)];
    let version = 1.0;
    let namePrefix = 'CrackMaster';
    let sizeMb = 20;

    switch (rarity) {
      case 'common':
        version = Number((Math.random() * 0.5 + 0.8).toFixed(1)); // v0.8 - v1.3
        namePrefix = chosenType === 'cracker' ? 'CrackMaster' : chosenType === 'hasher' ? 'SecureHash' : chosenType === 'miner' ? 'CryptoMinerX' : chosenType === 'ddos' ? 'StormBotNet' : 'AegisWall';
        sizeMb = Math.round(version * 5 + 8);
        break;
      case 'uncommon':
        version = Number((Math.random() * 0.8 + 1.2).toFixed(1)); // v1.2 - v2.0
        namePrefix = chosenType === 'cracker' ? 'ShadowCracker' : chosenType === 'hasher' ? 'CipherVault' : chosenType === 'miner' ? 'DarkMiner' : chosenType === 'ddos' ? 'MiraiCannon' : 'IronShield';
        sizeMb = Math.round(version * 5 + 12);
        break;
      case 'rare':
        version = Number((Math.random() * 1.5 + 2.0).toFixed(1)); // v2.0 - v3.5
        namePrefix = chosenType === 'cracker' ? 'VortexCracker' : chosenType === 'hasher' ? 'QuantumHash' : chosenType === 'miner' ? 'NanoMiner' : chosenType === 'ddos' ? 'TsunamiBotNet' : 'AegisTitan';
        sizeMb = Math.round(version * 4 + 18);
        break;
      case 'epic':
        version = Number((Math.random() * 2.5 + 3.5).toFixed(1)); // v3.5 - v6.0
        namePrefix = chosenType === 'cracker' ? 'ZeroDay_Titan_Mil' : chosenType === 'hasher' ? 'BlackHole_Crypt' : chosenType === 'miner' ? 'QuantumRig' : chosenType === 'ddos' ? 'OrbitalStrike' : 'GodShield';
        sizeMb = Math.round(version * 3 + 22);
        break;
      case 'legendary':
        version = Number((Math.random() * 4.0 + 6.0).toFixed(1)); // v6.0 - v10.0
        namePrefix = chosenType === 'cracker' ? 'TITAN_EXPLOIT_GODMODE' : chosenType === 'hasher' ? 'HYPER_QUANTUM_ENCRYPTOR' : chosenType === 'miner' ? 'SKYNET_CLUSTER_MINER' : chosenType === 'ddos' ? 'EXTINCTION_BOTNET' : 'IMPENETRABLE_FORTRESS';
        sizeMb = Math.round(version * 3 + 28);
        break;
    }

    const software: SoftwareItem = { id: `soft-loot-${uuidv4().substring(0, 8)}`, name: `${namePrefix}_v${version.toFixed(1)}`, type: chosenType, version, sizeMb, isInstalled: true, rarity };
    return { rarity, type: 'software', title: `${software.name} [${rarity.toUpperCase()}]`, description: `Software especial de raridade ${rarity.toUpperCase()} concedido pelo Black Market!`, software };
  }

  private generateCryptoReward(rarity: ItemRarity): LootboxReward {
    let btcAmount = 0.030;
    if (rarity === 'uncommon') btcAmount = 0.080;
    else if (rarity === 'rare') btcAmount = 0.200;
    else if (rarity === 'epic') btcAmount = 0.750;
    else if (rarity === 'legendary') btcAmount = 2.000;
    return { rarity, type: 'crypto', title: `Drop Cripto Anônimo: +${btcAmount} BTC`, description: 'Chave privada de carteira recuperada contendo Bitcoins limpos!', cryptoAmount: { symbol: 'BTC', amount: btcAmount, coinId: 'btc' } };
  }

  private generateCashReward(rarity: ItemRarity): LootboxReward {
    let cash = 2500;
    let rep = 75;
    if (rarity === 'uncommon') { cash = 8000; rep = 200; }
    else if (rarity === 'rare') { cash = 25000; rep = 650; }
    else if (rarity === 'epic') { cash = 75000; rep = 1800; }
    else if (rarity === 'legendary') { cash = 250000; rep = 6000; }
    return { rarity, type: 'cash', title: `Malote Financeiro Offshore: +$${cash.toLocaleString()}`, description: `Transferência anônima não rastreável e +${rep} REP!`, cashAmount: cash, repAmount: rep };
  }
}
