import { Player, PoliceRaidEvent, DarknetContract, DarknetAuctionItem, VirtualServer } from '../types/game.js';
import { GameWorld } from './GameWorld.js';
import { Server as SocketIOServer } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

export class ContractsAndRaidEngine {
  private gameWorld: GameWorld;
  private io: SocketIOServer | null = null;
  private activeRaids: Map<string, PoliceRaidEvent> = new Map();
  private contracts: DarknetContract[] = [];
  private auctions: DarknetAuctionItem[] = [];

  constructor(gameWorld: GameWorld) {
    this.gameWorld = gameWorld;
    this.initDefaultContracts();
    this.initDefaultAuctions();
    this.startAuctionTicker();
  }

  public setSocketServer(io: SocketIOServer) {
    this.io = io;
  }

  public getContracts(): DarknetContract[] {
    return this.contracts;
  }

  public getAuctions(): DarknetAuctionItem[] {
    return this.auctions;
  }

  public getActiveRaid(playerId: string): PoliceRaidEvent | undefined {
    return this.activeRaids.get(playerId);
  }

  // --- 1. Police Raid & Warrant System ---

  public triggerPoliceRaid(player: Player, agency: 'FBI Cyber Division' | 'Interpol Red Notice' | 'Receita Federal', reason: string): PoliceRaidEvent {
    const raid: PoliceRaidEvent = {
      id: `raid-${uuidv4().substring(0, 8)}`,
      agencyName: agency,
      warrantReason: reason,
      timeRemainingSec: 45,
      bribeCostUsd: Math.min(Math.round(player.cash * 0.35) + 5000, 250000),
      status: 'incoming',
    };

    this.activeRaids.set(player.id, raid);

    if (this.io) {
      this.io.emit('police_raid_alert', { raid, playerId: player.id });
    }

    const timer = setInterval(() => {
      const active = this.activeRaids.get(player.id);
      if (!active || active.status !== 'incoming') {
        clearInterval(timer);
        return;
      }

      active.timeRemainingSec -= 1;

      if (active.timeRemainingSec <= 0) {
        clearInterval(timer);
        this.resolveRaidSeizure(player, active);
      } else if (this.io) {
        this.io.emit('police_raid_tick', { raid: active });
      }
    }, 1000);

    return raid;
  }

  public defendPoliceRaid(player: Player, method: 'bribe' | 'purge_evidence' | 'blackout_jammer'): {
    success: boolean;
    message: string;
    seizedCash?: number;
  } {
    const raid = this.activeRaids.get(player.id);
    if (!raid || raid.status !== 'incoming') {
      return { success: false, message: 'Nenhum mandado ou incursão policial ativa no momento.' };
    }

    if (method === 'bribe') {
      let bribeCost = raid.bribeCostUsd;
      if (player.unlockedStoryPerks?.some(p => p.id === 'perk-narco-laundering')) {
        bribeCost = Math.round(bribeCost * 0.5);
      }

      if (player.cash < bribeCost) {
        return { success: false, message: `Saldo insuficiente para subornar as autoridades ($${bribeCost.toLocaleString()} necessário).` };
      }

      player.cash -= bribeCost;
      if (player.bankAccounts && player.bankAccounts.length > 0) {
        player.bankAccounts[0].balance = player.cash;
      }
      raid.status = 'bribed';
      this.activeRaids.delete(player.id);

      if (this.io) {
        this.io.emit('police_raid_resolved', { raid, outcome: 'bribed' });
      }

      return {
        success: true,
        message: `SUBORNO ACEITO: Propina de $${bribeCost.toLocaleString()} paga aos agentes corruptos. Mandado arquivado!`,
      };
    } else if (method === 'purge_evidence') {
      // Emergency log purge costs CPU power and resets local trace
      raid.status = 'purged';
      this.activeRaids.delete(player.id);
      player.reputation = Math.max(0, player.reputation - 200);

      if (this.io) {
        this.io.emit('police_raid_resolved', { raid, outcome: 'purged' });
      }

      return {
        success: true,
        message: 'PURGA DE EVIDÊNCIAS CONCLUÍDA: Todos os registros de acesso foram destruídos. Operação cancelada por falta de provas!',
      };
    } else {
      // Blackout Jammer requires VPN tier 3+ or costs $4,000
      const vpnTier = player.hardware.vpn?.level || 1;
      if (vpnTier < 3 && player.cash < 4000) {
        return { success: false, message: 'Requer VPN Tier 3+ (ShadowGuard) ou $4.000 para acionar Jammer de Pulso Eletromagnético.' };
      }

      if (vpnTier < 3) player.cash -= 4000;
      raid.status = 'purged';
      this.activeRaids.delete(player.id);

      if (this.io) {
        this.io.emit('police_raid_resolved', { raid, outcome: 'purged' });
      }

      return {
        success: true,
        message: 'BLACKOUT JAMMER ATIVADO: Sinal dos agentes bloqueado por interferência eletromagnética.',
      };
    }
  }

  private resolveRaidSeizure(player: Player, raid: PoliceRaidEvent) {
    raid.status = 'seized';
    this.activeRaids.delete(player.id);

    const seized = Math.min(player.cash, Math.round(player.cash * 0.35) + 3500);
    player.cash -= seized;
    // 2-minute house arrest lockdown
    player.lockdownUntil = Date.now() + 2 * 60 * 1000;

    if (this.io) {
      this.io.emit('police_raid_resolved', {
        raid,
        outcome: 'seized',
        seizedCash: seized,
        lockdownMinutes: 2,
        message: `INCURSÃO POLICIAL EXECUTADA: A ${raid.agencyName} apreendeu $${seized.toLocaleString()} USD em ativos não declarados e impôs 2 minutos de prisão domiciliar preventiva!`,
      });
    }
  }

  // --- 2. Darknet Contracts (Bounty Board) ---

  public claimContract(player: Player, contractId: string): { success: boolean; message: string; contract?: DarknetContract } {
    const contract = this.contracts.find(c => c.id === contractId);
    if (!contract) return { success: false, message: 'Contrato não encontrado.' };
    if (contract.completed) return { success: false, message: 'Este contrato já foi concluído.' };

    const cracker = player.software.find(s => s.type === 'cracker');
    const crackerLevel = cracker ? cracker.version : 1.0;

    if (crackerLevel < contract.requiredCrackerLevel) {
      return {
        success: false,
        message: `Nível de Cracker Insuficiente: Este contrato exige Cracker v${contract.requiredCrackerLevel.toFixed(1)}+ (Você possui v${crackerLevel.toFixed(1)}).`,
      };
    }

    // Check if target server was compromised or fulfilled
    const target = this.gameWorld.getServer(contract.targetIp);
    const hasBreached = target ? target.security.isBreached : false;

    if (!hasBreached && !player.hackedIps.includes(contract.targetIp)) {
      return {
        success: false,
        message: `Objetivo incompleto: Você precisa quebrar a segurança e invadir ${contract.targetHostname} (${contract.targetIp}) primeiro!`,
      };
    }

    contract.completed = true;
    player.cash += contract.rewardCash;
    player.reputation += contract.rewardRep;
    if (contract.rewardCryptoBtc) {
      player.cryptoWallet.btc = Number(((player.cryptoWallet.btc || 0) + contract.rewardCryptoBtc).toFixed(6));
      player.crypto = player.cryptoWallet.btc;
    }

    this.gameWorld.addNews(`CONTRATO EXECUTADO: Hacker anônimo finalizou o contrato "${contract.title}" na Darknet!`, 'ECONOMY');

    return {
      success: true,
      contract,
      message: `Contrato "${contract.title}" Concluído! Recompensa de +$${contract.rewardCash.toLocaleString()} USD e +${contract.rewardRep} REP creditada!`,
    };
  }

  // --- 3. Darknet Auction House ---

  public placeBid(player: Player, auctionId: string, bidAmountUsd: number): { success: boolean; message: string } {
    const auction = this.auctions.find(a => a.id === auctionId);
    if (!auction) return { success: false, message: 'Lote de leilão não encontrado.' };

    if (Date.now() > auction.endsAt) {
      return { success: false, message: 'Este leilão já foi encerrado.' };
    }

    if (player.cash < bidAmountUsd) {
      return { success: false, message: `Saldo insuficiente ($${bidAmountUsd.toLocaleString()} necessário).` };
    }

    if (bidAmountUsd < auction.minNextBidUsd) {
      return { success: false, message: `O lance mínimo atual é de $${auction.minNextBidUsd.toLocaleString()} USD.` };
    }

    player.cash -= bidAmountUsd;
    auction.currentBidUsd = bidAmountUsd;
    auction.highestBidder = player.username;
    auction.minNextBidUsd = Math.round(bidAmountUsd * 1.15);

    return {
      success: true,
      message: `Lance de $${bidAmountUsd.toLocaleString()} USD computado no lote "${auction.title}"! Maior lance atual.`,
    };
  }

  public buyoutAuction(player: Player, auctionId: string): { success: boolean; message: string } {
    const auction = this.auctions.find(a => a.id === auctionId);
    if (!auction) return { success: false, message: 'Lote não encontrado.' };

    if (player.cash < auction.buyoutUsd) {
      return { success: false, message: `Saldo insuficiente para arremate imediato ($${auction.buyoutUsd.toLocaleString()}).` };
    }

    player.cash -= auction.buyoutUsd;
    this.deliverAuctionItem(player, auction);

    // Remove bought auction and spawn new one
    this.auctions = this.auctions.filter(a => a.id !== auctionId);
    this.spawnNewAuction();

    return {
      success: true,
      message: `LOTE ARREMATADO COM SUCESSO! Você adquiriu "${auction.title}". O item foi entregue diretamente ao seu sistema!`,
    };
  }

  private deliverAuctionItem(player: Player, auction: DarknetAuctionItem) {
    if (auction.itemType === 'software' && auction.itemData) {
      const existing = player.software.find(s => s.type === auction.itemData.type);
      if (existing) {
        existing.version = Math.max(existing.version, auction.itemData.version);
        existing.name = auction.itemData.name;
      } else {
        player.software.push(auction.itemData);
      }
    } else if (auction.itemType === 'crypto_drive') {
      const btc = auction.itemData.btcAmount || 5.0;
      player.cryptoWallet.btc = Number(((player.cryptoWallet.btc || 0) + btc).toFixed(6));
      player.crypto = player.cryptoWallet.btc;
    }
  }

  private initDefaultContracts() {
    this.contracts = [
      {
        id: 'cnt-1',
        title: 'Operação Fórmula Zero (Cola-Coca)',
        targetIp: '104.18.23.99',
        targetHostname: 'colacoca-vault.corp',
        type: 'steal_file',
        rewardCash: 45000,
        rewardCryptoBtc: 0.15,
        rewardRep: 1200,
        requiredCrackerLevel: 8.0,
        description: 'Um conglomerado rival quer a fórmula original do refrigerante. Invada o servidor da Cola-Coca e quebre a criptografia.',
      },
      {
        id: 'cnt-2',
        title: 'Apagão Financeiro (MegaBank)',
        targetIp: '12.189.44.10',
        targetHostname: 'vault.megabank.global',
        type: 'ddos_shutdown',
        rewardCash: 120000,
        rewardCryptoBtc: 0.45,
        rewardRep: 3500,
        requiredCrackerLevel: 22.0,
        description: 'Derrube os serviços online do MegaBank durante o fechamento do pregão da bolsa de Nova York.',
      },
      {
        id: 'cnt-3',
        title: 'Vazamento da Área 51 (FBI BlackOps)',
        targetIp: '198.51.100.24',
        targetHostname: 'surveillance.fbi-gov.sec',
        type: 'steal_file',
        rewardCash: 350000,
        rewardCryptoBtc: 1.25,
        rewardRep: 8500,
        requiredCrackerLevel: 30.0,
        description: 'Infiltre o banco de dados do FBI, quebre o hasher v30.0 e recupere os arquivos confidenciais da Área 51.',
      },
      {
        id: 'cnt-4',
        title: 'Controle do Satélite Quântico (NASA DSN)',
        targetIp: '198.118.192.50',
        targetHostname: 'deepspace.nasa-quantum.gov',
        type: 'plant_miner',
        rewardCash: 850000,
        rewardCryptoBtc: 3.50,
        rewardRep: 25000,
        requiredCrackerLevel: 50.0,
        description: 'O Santo Graal da computação: Infiltre o supercomputador da NASA (Hasher v50.0) e instale um minerador quântico de alta potência!',
      },
    ];
  }

  private initDefaultAuctions() {
    const now = Date.now();
    this.auctions = [
      {
        id: 'auc-1',
        title: 'CrackMaster Militar Titanium (v18.0)',
        itemType: 'software',
        itemData: {
          id: 'soft-crc-mil-18',
          name: 'CrackMaster Titanium v18.0',
          type: 'cracker',
          version: 18.0,
          sizeMb: 35,
          isInstalled: true,
        },
        currentBidUsd: 28000,
        highestBidder: 'CipherGhost_99',
        minNextBidUsd: 32000,
        buyoutUsd: 65000,
        endsAt: now + 15 * 60 * 1000,
        description: 'Exploit militar desenvolvido por agências de inteligência para quebra instantânea de hashers corporativos.',
      },
      {
        id: 'auc-2',
        title: 'Cold Storage Wallet Perdida (4.50 BTC)',
        itemType: 'crypto_drive',
        itemData: {
          btcAmount: 4.50,
        },
        currentBidUsd: 120000,
        highestBidder: 'Satoshi_Disciple',
        minNextBidUsd: 135000,
        buyoutUsd: 280000,
        endsAt: now + 25 * 60 * 1000,
        description: 'Chave privada recuperada de um laptop de 2011 contendo 4.50 Bitcoins intactos!',
      },
      {
        id: 'auc-3',
        title: 'NASA Quantum Encryption Shield (v50.0)',
        itemType: 'software',
        itemData: {
          id: 'soft-hsh-quantum-50',
          name: 'NASA Quantum Shield v50.0',
          type: 'hasher',
          version: 50.0,
          sizeMb: 95,
          isInstalled: true,
        },
        currentBidUsd: 450000,
        highestBidder: 'NullSec_Overlord',
        minNextBidUsd: 500000,
        buyoutUsd: 1200000,
        endsAt: now + 45 * 60 * 1000,
        description: 'Criptografia defensiva quântica da NASA. Torna seu servidor virtualmente inexpugnável!',
      },
    ];
  }

  private spawnNewAuction() {
    const lotTypes = [
      {
        title: 'ZeroDay Titan Exploit (v30.0)',
        itemType: 'software' as const,
        itemData: { id: `soft-crc-${Date.now()}`, name: 'ZeroDay Titan v30.0', type: 'cracker', version: 30.0, sizeMb: 60, isInstalled: true },
        currentBidUsd: 95000,
        minNextBidUsd: 110000,
        buyoutUsd: 220000,
        description: 'Exploit de penetração militar de nível 30.0.',
      },
      {
        title: 'Carteira Abandonada SilkRoad (8.00 BTC)',
        itemType: 'crypto_drive' as const,
        itemData: { btcAmount: 8.00 },
        currentBidUsd: 250000,
        minNextBidUsd: 280000,
        buyoutUsd: 520000,
        description: 'Cofre apreendido contendo 8.00 Bitcoins da Darknet.',
      },
    ];

    const pick = lotTypes[Math.floor(Math.random() * lotTypes.length)];
    this.auctions.push({
      id: `auc-${uuidv4().substring(0, 8)}`,
      ...pick,
      highestBidder: 'ShadowBidder_' + Math.floor(Math.random() * 900 + 100),
      endsAt: Date.now() + 30 * 60 * 1000,
    });
  }

  private startAuctionTicker() {
    if (process.env.NODE_ENV === 'test') return;
    // NPC bot bidding simulation every 40s
    setInterval(() => {
      for (const auc of this.auctions) {
        if (Math.random() < 0.35 && Date.now() < auc.endsAt) {
          auc.currentBidUsd = auc.minNextBidUsd;
          auc.highestBidder = 'DarkBot_' + Math.floor(Math.random() * 899 + 100);
          auc.minNextBidUsd = Math.round(auc.currentBidUsd * 1.15);
        }
      }
    }, 40000);
  }
}
