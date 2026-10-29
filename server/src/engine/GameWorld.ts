import {
  Player,
  VirtualServer,
  SoftwareItem,
  LogEntry,
  BankAccount,
  GlobalNewsItem,
  ProcessType,
  LootboxReward,
  Clan,
  TerritoryNode,
  PlayerVps,
  VpsModuleType,
  StoryChapter,
  StoryChoice,
  ProxyHop,
  PoliceTraceState,
  DarkChatChannel,
  DarkChatMessage,
  FactionType,
  AdminUserData
} from '../types/game.js';
import { MissionEngine } from './MissionEngine.js';
import { CryptoEngine } from './CryptoEngine.js';
import { BlackMarketEngine } from './BlackMarketEngine.js';
import { DefenseEngine } from './DefenseEngine.js';
import { ProxyTraceEngine } from './ProxyTraceEngine.js';
import { ClanEngine } from './ClanEngine.js';
import { DatacenterEngine } from './DatacenterEngine.js';
import { StoryEngine } from './StoryEngine.js';
import { ContractsAndRaidEngine } from './ContractsAndRaidEngine.js';
import { DarkChatEngine } from './DarkChatEngine.js';
import { CPU_TIERS, GPU_TIERS, RAM_TIERS, HDD_TIERS, NETWORK_TIERS, VPN_TIERS, COOLING_TIERS } from './HardwareDatabase.js';
import { db, dbHelpers } from '../database/sqlite.js';
import { v4 as uuidv4 } from 'uuid';

export class GameWorld {
  private players: Map<string, { userId: string; player: Player }> = new Map();
  private servers: Map<string, VirtualServer> = new Map();
  public missionEngine: MissionEngine;
  public cryptoEngine: CryptoEngine;
  public blackMarketEngine: BlackMarketEngine;
  public defenseEngine: DefenseEngine;
  public proxyTraceEngine: ProxyTraceEngine;
  public clanEngine: ClanEngine;
  public datacenterEngine: DatacenterEngine;
  public storyEngine: StoryEngine;
  public contractsAndRaidEngine: ContractsAndRaidEngine;
  public darkChatEngine: DarkChatEngine;

  constructor() {
    const savedServers = dbHelpers.getAllServers();
    savedServers.forEach(srv => {
      this.servers.set(srv.ip, srv);
    });

    this.missionEngine = new MissionEngine();
    this.cryptoEngine = new CryptoEngine();
    this.blackMarketEngine = new BlackMarketEngine();
    this.defenseEngine = new DefenseEngine();
    this.proxyTraceEngine = new ProxyTraceEngine();
    this.clanEngine = new ClanEngine();
    this.datacenterEngine = new DatacenterEngine();
    this.storyEngine = new StoryEngine();
    this.contractsAndRaidEngine = new ContractsAndRaidEngine(this);
    this.darkChatEngine = new DarkChatEngine();

    this.startMiningTicker();
    this.startWorldNewsTicker();
    this.startNpcSecurityTicker();
    this.startVpsAndInvasionTicker();
    this.startSpywareSnifferTicker();
  }

  public getOrCreatePlayer(userId: string): Player {
    const cached = this.players.get(userId);
    if (cached) {
      this.updatePlayerStats(cached.player);
      return cached.player;
    }

    const saved = dbHelpers.getPlayerByUserId(userId);
    if (saved) {
      this.updatePlayerStats(saved);
      this.players.set(userId, { userId, player: saved });
      return saved;
    }

    const user = dbHelpers.getUserById(userId);
    const created = dbHelpers.createUser(user ? user.username : 'hacker', 'temp');
    this.players.set(userId, { userId, player: created.player });
    return created.player;
  }

  public savePlayerState(userId: string) {
    const cached = this.players.get(userId);
    if (cached) {
      this.updatePlayerStats(cached.player);
      dbHelpers.savePlayer(userId, cached.player);
    }
  }

  public getPlayer(userId: string = 'user-zero-cool-1'): Player {
    return this.getOrCreatePlayer(userId);
  }

  private updatePlayerStats(player: Player) {
    const usedStorage = player.software.reduce((acc, s) => acc + s.sizeMb, 0);
    player.hardware.hdd.usedMb = usedStorage;
    player.rank = this.calculateRank(player.reputation);

    // Initialize GPU if not present on legacy save
    if (!player.hardware.gpu) {
      player.hardware.gpu = { ...GPU_TIERS[0] };
    }

    // Initialize VPN if not present on legacy save
    if (!player.hardware.vpn) {
      player.hardware.vpn = { ...VPN_TIERS[0] };
    }

    // Initialize multi-crypto wallet if not present
    if (!player.cryptoWallet) {
      player.cryptoWallet = {
        btc: player.crypto || 0.045,
        eth: 0.35,
        doge: 2500,
        shdw: 8.5,
        pepe: 450000,
      };
    }
    if (!player.miningTargetCoin) {
      player.miningTargetCoin = 'btc';
    }
    player.crypto = player.cryptoWallet.btc;

    // Advanced Expansion Fields Defaults
    player.infections = [];
    if (player.honeypotActiveUntil && Date.now() < player.honeypotActiveUntil) {
      player.honeypotActive = true;
    } else {
      player.honeypotActive = false;
    }
    if (!player.activeProxyChain) player.activeProxyChain = [];
    if (!player.vpsList) player.vpsList = [];
    if (!player.completedStoryChapters) player.completedStoryChapters = [];

    // Sync bank accounts with real player cash
    if (player.bankAccounts && player.bankAccounts.length > 0) {
      player.bankAccounts[0].balance = player.cash;
    } else {
      player.bankAccounts = [{
        accountNumber: `ACC-${player.username.toUpperCase()}-01`,
        bankName: 'Global Trust Bank',
        bankIp: '185.220.101.44',
        balance: player.cash,
      }];
    }

    // Ensure cooling exists
    if (!player.hardware.cooling) {
      player.hardware.cooling = { ...COOLING_TIERS[0] };
    }

    // Ensure Antivirus software exists
    if (!player.software.some(s => s.type === 'antivirus')) {
      player.software.push({
        id: 'soft-av-1',
        name: 'AegisScanner Pro',
        type: 'antivirus',
        version: 1.0,
        sizeMb: 18,
        isInstalled: true,
      });
    }

    // Ensure Spyware software exists
    if (!player.software.some(s => s.type === 'spyware')) {
      player.software.push({
        id: 'soft-spy-1',
        name: 'ShadowStealer Pro',
        type: 'spyware',
        version: 1.0,
        sizeMb: 14,
        isInstalled: true,
      });
    }

    // Ensure Faction & Story fields exist
    if (!player.factionReputation) {
      player.factionReputation = {
        anonymous: 100,
        russian_bears: 0,
        cartel: 0,
        lone_wolf: 0,
      };
    }
    if (!player.unlockedStoryPerks) {
      player.unlockedStoryPerks = [];
    }
    if (!player.completedStoryChapters) {
      player.completedStoryChapters = [];
    }
    if (!player.activeFactionAlignment) {
      player.activeFactionAlignment = 'anonymous';
    }
    if (!player.activeStoryChapterId) {
      player.activeStoryChapterId = 'chap-1';
    }
  }

  private calculateRank(rep: number): string {
    if (rep < 200) return 'Script Kiddie';
    if (rep < 600) return 'Novice Cracker';
    if (rep < 1500) return 'NetRunner';
    if (rep < 3500) return 'Cyber Infiltrator';
    if (rep < 7000) return 'Ghost Hacker';
    if (rep < 15000) return 'Elite Operator';
    return 'Zero-Day Legend';
  }

  public getServer(ip: string): VirtualServer | undefined {
    return this.servers.get(ip);
  }

  public getAllServers(): VirtualServer[] {
    return Array.from(this.servers.values());
  }

  public getDiscoveredServers(userId: string = 'user-zero-cool-1'): VirtualServer[] {
    const player = this.getOrCreatePlayer(userId);
    return player.discoveredIps
      .map(ip => this.servers.get(ip))
      .filter((srv): srv is VirtualServer => srv !== undefined);
  }

  public getNews(): GlobalNewsItem[] {
    return dbHelpers.getNews();
  }

  public addNews(headline: string, category: GlobalNewsItem['category']) {
    dbHelpers.addNews(headline, category);
  }

  // --- Proxy Bouncing ---

  public toggleProxyHop(userId: string, hopIp: string): { success: boolean; activeProxyChain: string[]; message?: string } {
    const player = this.getOrCreatePlayer(userId);
    if (!player.activeProxyChain) player.activeProxyChain = [];

    const index = player.activeProxyChain.indexOf(hopIp);
    if (index !== -1) {
      player.activeProxyChain.splice(index, 1);
      this.savePlayerState(userId);
      return { success: true, activeProxyChain: player.activeProxyChain, message: `Nó ${hopIp} removido da rota de salto.` };
    }

    if (player.activeProxyChain.length >= 4) {
      return { success: false, activeProxyChain: player.activeProxyChain, message: 'Limite máximo de 4 nós de proxy na rota atingido!' };
    }

    player.activeProxyChain.push(hopIp);
    this.savePlayerState(userId);
    return { success: true, activeProxyChain: player.activeProxyChain, message: `Nó ${hopIp} adicionado à rota de salto (+18s no rastreamento policial).` };
  }

  public clearProxyChain(userId: string): { success: boolean; activeProxyChain: string[] } {
    const player = this.getOrCreatePlayer(userId);
    player.activeProxyChain = [];
    this.savePlayerState(userId);
    return { success: true, activeProxyChain: [] };
  }

  // --- Defense, Antivirus & Honeypots ---

  public toggleHoneypot(userId: string): {
    success: boolean;
    honeypotActive: boolean;
    message: string;
    honeypotActiveUntil?: number;
    honeypotCooldownUntil?: number
  } {
    const player = this.getOrCreatePlayer(userId);
    const now = Date.now();

    // 1. If currently active (within 10-min window)
    if (player.honeypotActiveUntil && now < player.honeypotActiveUntil) {
      const minsRemaining = Math.ceil((player.honeypotActiveUntil - now) / 60000);
      return {
        success: false,
        honeypotActive: true,
        honeypotActiveUntil: player.honeypotActiveUntil,
        honeypotCooldownUntil: player.honeypotCooldownUntil,
        message: `Honeypot já está ativo! Restam ${minsRemaining} min de armadilha ativa.`,
      };
    }

    // 2. If on cooldown (2-hour cooldown from activation)
    if (player.honeypotCooldownUntil && now < player.honeypotCooldownUntil) {
      const msLeft = player.honeypotCooldownUntil - now;
      const hours = Math.floor(msLeft / 3600000);
      const minutes = Math.ceil((msLeft % 3600000) / 60000);
      const timeStr = hours > 0 ? `${hours}h ${minutes}min` : `${minutes} min`;
      return {
        success: false,
        honeypotActive: false,
        honeypotActiveUntil: player.honeypotActiveUntil,
        honeypotCooldownUntil: player.honeypotCooldownUntil,
        message: `Honeypot em recarga! Disponível novamente em ${timeStr}. (Tempo de recarga: 2 horas).`,
      };
    }

    // 3. Arm Honeypot: 10 minutes active window + 2 hours cooldown
    const activeDurationMs = 10 * 60 * 1000; // 10 minutes
    const cooldownDurationMs = 2 * 60 * 60 * 1000; // 2 hours

    player.honeypotActive = true;
    player.honeypotActiveUntil = now + activeDurationMs;
    player.honeypotCooldownUntil = now + cooldownDurationMs;

    this.savePlayerState(userId);

    return {
      success: true,
      honeypotActive: true,
      honeypotActiveUntil: player.honeypotActiveUntil,
      honeypotCooldownUntil: player.honeypotCooldownUntil,
      message: 'Honeypot ARMADO com sucesso! Ativo pelos próximos 10 minutos (Recarga de 2 horas iniciada).',
    };
  }

  // --- Black Market & Lootbox Opening ---

  public openLootbox(
    userId: string,
    crateId: string,
    paymentMethod: 'usd' | 'btc'
  ): { success: boolean; reward?: LootboxReward; message?: string } {
    const player = this.getOrCreatePlayer(userId);
    const crate = this.blackMarketEngine.getCrates().find(c => c.id === crateId);

    if (!crate) {
      return { success: false, message: 'Caixa de loot não encontrada.' };
    }

    if (paymentMethod === 'usd') {
      if (player.cash < crate.priceUsd) {
        return { success: false, message: `Saldo insuficiente ($${crate.priceUsd.toLocaleString()} necessário).` };
      }
      player.cash -= crate.priceUsd;
    } else {
      if ((player.cryptoWallet.btc || 0) < crate.priceBtc) {
        return { success: false, message: `Saldo em Bitcoin insuficiente (${crate.priceBtc} BTC necessário).` };
      }
      player.cryptoWallet.btc = Number((player.cryptoWallet.btc - crate.priceBtc).toFixed(6));
      player.crypto = player.cryptoWallet.btc;
    }

    const reward = this.blackMarketEngine.openCrate(crateId);

    if (reward.type === 'software' && reward.software) {
      const existing = player.software.find(s => s.name === reward.software?.name || (s.type === reward.software?.type && s.version < (reward.software?.version || 1)));
      if (existing && reward.software.version > existing.version) {
        existing.version = reward.software.version;
        existing.name = reward.software.name;
        existing.rarity = reward.rarity;
      } else {
        player.software.push(reward.software);
      }
      player.reputation += reward.rarity === 'legendary' ? 1000 : reward.rarity === 'epic' ? 400 : 100;
    } else if (reward.type === 'crypto' && reward.cryptoAmount) {
      const coin = reward.cryptoAmount.coinId || 'btc';
      player.cryptoWallet[coin] = Number(((player.cryptoWallet[coin] || 0) + reward.cryptoAmount.amount).toFixed(6));
      if (coin === 'btc') player.crypto = player.cryptoWallet.btc;
    } else if (reward.type === 'cash' && reward.cashAmount) {
      player.cash += reward.cashAmount;
      if (reward.repAmount) player.reputation += reward.repAmount;
    }

    if (reward.rarity === 'legendary' || reward.rarity === 'epic') {
      this.addNews(
        `DROP RARO: Hacker ${player.username} obteve o item [${reward.title}] no Black Market!`,
        'BREACH'
      );
    }

    this.savePlayerState(userId);
    return { success: true, reward, message: `Você abriu "${crate.name}" com sucesso!` };
  }

  // --- Multi-Crypto Trading ---

  public tradeCoin(
    userId: string,
    coinId: string,
    action: 'buy' | 'sell',
    usdAmount?: number,
    coinAmount?: number
  ): { success: boolean; message: string } {
    const player = this.getOrCreatePlayer(userId);
    const coin = this.cryptoEngine.getCoin(coinId);
    if (!coin) return { success: false, message: 'Criptomoeda não encontrada no mercado.' };

    if (!player.cryptoWallet) player.cryptoWallet = { btc: 0, eth: 0, doge: 0, shdw: 0, pepe: 0 };

    if (action === 'buy') {
      const spendUsd = usdAmount || (coinAmount ? coinAmount * coin.priceUsd : 0);
      if (player.cash < spendUsd || spendUsd <= 0) {
        return { success: false, message: 'Saldo em USD insuficiente.' };
      }

      const boughtCoins = spendUsd / coin.priceUsd;
      player.cash -= spendUsd;
      player.cryptoWallet[coinId] = Number(((player.cryptoWallet[coinId] || 0) + boughtCoins).toFixed(coinId === 'pepe' ? 2 : 6));
      if (coinId === 'btc') player.crypto = player.cryptoWallet.btc;

      this.savePlayerState(userId);
      return {
        success: true,
        message: `Comprado ${boughtCoins.toFixed(coinId === 'pepe' ? 0 : 4)} ${coin.symbol} por $${spendUsd.toLocaleString()}`
      };
    } else {
      const sellAmount = coinAmount || (usdAmount ? usdAmount / coin.priceUsd : 0);
      const currentBalance = player.cryptoWallet[coinId] || 0;
      if (currentBalance < sellAmount || sellAmount <= 0) {
        return { success: false, message: `Saldo de ${coin.symbol} insuficiente.` };
      }

      const gainedUsd = Math.round(sellAmount * coin.priceUsd);
      player.cryptoWallet[coinId] = Number((currentBalance - sellAmount).toFixed(coinId === 'pepe' ? 2 : 6));
      player.cash += gainedUsd;
      if (coinId === 'btc') player.crypto = player.cryptoWallet.btc;

      this.savePlayerState(userId);
      return {
        success: true,
        message: `Vendido ${sellAmount.toFixed(coinId === 'pepe' ? 0 : 4)} ${coin.symbol} por $${gainedUsd.toLocaleString()}`
      };
    }
  }

  public setMiningTargetCoin(userId: string, coinId: string): { success: boolean; message: string } {
    const player = this.getOrCreatePlayer(userId);
    const coin = this.cryptoEngine.getCoin(coinId);
    if (!coin) return { success: false, message: 'Criptomoeda inválida.' };

    player.miningTargetCoin = coinId;
    this.savePlayerState(userId);
    return { success: true, message: `Fazenda de mineração reconfigurada para minerar ${coin.name} (${coin.symbol}).` };
  }

  // --- Network & Hacking Actions ---

  public connectToServer(userId: string, ip: string): { success: boolean; server?: VirtualServer; message?: string; traceState?: PoliceTraceState } {
    const player = this.getOrCreatePlayer(userId);
    const cleanIp = (ip || '').trim();
    const lower = cleanIp.toLowerCase();

    // 1. Direct match
    let server = this.servers.get(cleanIp);

    // 2. Known alias resolutions for story and dark chat links
    if (!server) {
      if (cleanIp === '198.51.100.99' || lower.includes('nasa')) {
        server = this.servers.get('198.118.192.50');
      } else if (cleanIp === '12.189.44.10' || lower.includes('megabank')) {
        server = this.servers.get('12.189.44.10') || this.servers.get('64.233.160.1');
      } else if (cleanIp === '64.233.160.1' || lower.includes('ironclad')) {
        server = this.servers.get('64.233.160.1');
      }
    }

    // 3. Match by domain, hostname, or ID
    if (!server) {
      for (const s of this.servers.values()) {
        if (
          s.ip === cleanIp ||
          s.id === cleanIp ||
          (s.domain && s.domain.toLowerCase() === lower) ||
          (s.hostname && s.hostname.toLowerCase() === lower) ||
          (s.hostname && s.hostname.toLowerCase().includes(lower)) ||
          (s.domain && s.domain.toLowerCase().includes(lower))
        ) {
          server = s;
          break;
        }
      }
    }

    if (!server) {
      return { success: false, message: `Host inalcançável: ${ip}` };
    }

    // Synchronize breached state
    server.security.isBreached = player.hackedIps.includes(server.ip) || !!server.security.isBreached;

    const now = Date.now();
    const sourceIp = player.activeProxyChain.length > 0
      ? player.activeProxyChain[player.activeProxyChain.length - 1]
      : player.ip;

    const log: LogEntry = {
      id: `log-${uuidv4().substring(0, 8)}`,
      timestamp: now,
      formattedTime: new Date(now).toLocaleTimeString(),
      ip: sourceIp,
      action: `Conexão de entrada estabelecida a partir de ${sourceIp}${player.activeProxyChain.length > 0 ? ' [Proxy Route]' : ''}`,
      isSelf: false,
    };
    if (!server.logs) server.logs = [];
    server.logs.unshift(log);

    if (!player.discoveredIps.includes(server.ip)) {
      player.discoveredIps.push(server.ip);
    }

    this.savePlayerState(userId);
    dbHelpers.saveServer(server);

    // Build Proxy Hops for Police Trace
    const hops: ProxyHop[] = player.activeProxyChain.map(hopIp => {
      const hopSrv = this.servers.get(hopIp);
      return {
        ip: hopIp,
        hostname: hopSrv?.hostname || hopIp,
        latencyMs: Math.floor(Math.random() * 40 + 15),
        isClean: true,
      };
    });

    // Start Live Police Trace on High-Risk targets with VPN Delay protection
    const vpnDelay = player.hardware.vpn?.traceDelaySec || 0;
    const traceState = this.proxyTraceEngine.startTraceIfNeeded(
      userId,
      server,
      hops,
      vpnDelay,
      (tracedServer) => {
        if (tracedServer.type === 'cartel') {
          // CARTEL RETALIATION JUMPSCARE & 5-MIN LOCKDOWN!
          const durationMs = 5 * 60 * 1000; // 5 minutes
          player.lockdownUntil = Date.now() + durationMs;
          this.addNews(`RETALIAÇÃO DO CARTEL: Sicários armados localizaram a casa do hacker ${player.username}! Alvo está NA ENCOLHA!`, 'BREACH');
          this.savePlayerState(userId);

          if (this.proxyTraceEngine['io']) {
            this.proxyTraceEngine['io'].emit('cartel_jumpscare_event', {
              player: this.getPlayer(userId),
              target: tracedServer,
              lockdownUntil: player.lockdownUntil,
              lockdownDurationSec: 300,
              message: 'O Cartel rastreou seu IP e mandou sicários até seu esconderijo!',
            });
          }
        } else {
          // Trace Completed Callback (Caught by FBI / Police!)
          const fine = Math.min(player.cash, 3500);
          player.cash -= fine;
          this.addNews(`ALERTA: Rastreamento policial concluído! FBI interceptou a rota de ${player.username}. Multa de $${fine} aplicada.`, 'POLICE');
          this.savePlayerState(userId);
        }
      }
    ) || undefined;

    return { success: true, server, traceState };
  }

  public disconnectServer(userId: string) {
    this.proxyTraceEngine.stopTrace(userId);
  }

  public portScan(userId: string, targetIp: string): { success: boolean; server?: VirtualServer; message?: string } {
    const player = this.getOrCreatePlayer(userId);
    const server = this.servers.get(targetIp);
    if (!server) return { success: false, message: 'Host não encontrado' };

    if (!server.logs) server.logs = [];
    server.logs.unshift({
      id: `log-${uuidv4().substring(0, 8)}`,
      timestamp: Date.now(),
      formattedTime: new Date().toLocaleTimeString(),
      ip: player.ip,
      action: `PORT SCAN detectado a partir de ${player.ip}`,
    });

    dbHelpers.saveServer(server);
    return { success: true, server };
  }

  public onPasswordCracked(userId: string, targetIp: string): boolean {
    const player = this.getOrCreatePlayer(userId);
    const server = this.servers.get(targetIp);
    if (!server) return false;

    server.security.isBreached = true;
    if (!player.hackedIps.includes(targetIp)) {
      player.hackedIps.push(targetIp);
      player.reputation += server.rewardRep || 50;
    }

    if (!server.logs) server.logs = [];
    server.logs.unshift({
      id: `log-${uuidv4().substring(0, 8)}`,
      timestamp: Date.now(),
      formattedTime: new Date().toLocaleTimeString(),
      ip: player.ip,
      action: `ACESSO ROOT CONCEDIDO via exploit por ${player.ip}`,
    });

    this.savePlayerState(userId);
    dbHelpers.saveServer(server);
    return true;
  }

  public downloadFile(userId: string, targetIp: string, fileId: string): { success: boolean; file?: SoftwareItem; message?: string } {
    const player = this.getOrCreatePlayer(userId);
    const server = this.servers.get(targetIp);
    if (!server) return { success: false, message: 'Servidor não encontrado' };

    const file = server.files.find(f => f.id === fileId);
    if (!file) return { success: false, message: 'Arquivo não encontrado no host remoto' };

    const usedStorage = player.software.reduce((acc, s) => acc + s.sizeMb, 0);
    if (usedStorage + file.sizeMb > player.hardware.hdd.capacityMb) {
      return { success: false, message: 'Espaço em disco insuficiente (HDD Cheio)!' };
    }

    const existing = player.software.find(s => s.name === file.name);
    if (existing) {
      if (file.version > existing.version) {
        existing.version = file.version;
        existing.sizeMb = file.sizeMb;
      }
    } else {
      player.software.push({
        ...file,
        id: `soft-${uuidv4().substring(0, 8)}`,
        isInstalled: true,
      });
    }

    if (!server.logs) server.logs = [];
    server.logs.unshift({
      id: `log-${uuidv4().substring(0, 8)}`,
      timestamp: Date.now(),
      formattedTime: new Date().toLocaleTimeString(),
      ip: player.ip,
      action: `Download de arquivo: ${file.name} (${file.sizeMb}MB) por ${player.ip}`,
    });

    this.savePlayerState(userId);
    dbHelpers.saveServer(server);
    return { success: true, file };
  }

  public uploadFile(userId: string, targetIp: string, softwareId: string): { success: boolean; message: string; minerHashRate?: number } {
    const player = this.getOrCreatePlayer(userId);
    const server = this.servers.get(targetIp);
    if (!server) return { success: false, message: 'Servidor não encontrado' };

    const soft = player.software.find(s => s.id === softwareId);
    if (!soft) return { success: false, message: 'Software local não encontrado' };

    if (!server.activeMiners) server.activeMiners = [];
    if (!server.files) server.files = [];
    if (!server.logs) server.logs = [];

    if (soft.type === 'miner') {
      const existingMinerIndex = server.activeMiners.findIndex(m => m.ownerId === player.id);
      const hashRate = Number((server.hardware.cpuPower * soft.version * 2.5).toFixed(2));
      const targetCoin = player.miningTargetCoin || 'btc';

      if (existingMinerIndex !== -1) {
        server.activeMiners[existingMinerIndex].minerLevel = Math.max(server.activeMiners[existingMinerIndex].minerLevel, soft.version);
        server.activeMiners[existingMinerIndex].hashRate = hashRate;
        server.activeMiners[existingMinerIndex].coinId = targetCoin;
      } else {
        server.activeMiners.push({
          ownerId: player.id,
          minerLevel: soft.version,
          hashRate,
          coinId: targetCoin,
        });
      }

      server.logs.unshift({
        id: `log-${uuidv4().substring(0, 8)}`,
        timestamp: Date.now(),
        formattedTime: new Date().toLocaleTimeString(),
        ip: player.ip,
        action: `PROCESSO DAEMON INJETADO: CryptoMinerX v${soft.version} iniciado em background por ${player.ip}`,
      });

      this.savePlayerState(userId);
      dbHelpers.saveServer(server);

      return {
        success: true,
        message: `CryptoMinerX v${soft.version.toFixed(1)} instalado com sucesso! Renda passiva de ${hashRate} GH/s ativada neste servidor.`,
        minerHashRate: hashRate
      };
    }

    server.files.push({
      ...soft,
      id: `file-${uuidv4().substring(0, 8)}`,
      isInstalled: true,
    });

    server.logs.unshift({
      id: `log-${uuidv4().substring(0, 8)}`,
      timestamp: Date.now(),
      formattedTime: new Date().toLocaleTimeString(),
      ip: player.ip,
      action: `Upload de arquivo: ${soft.name} (v${soft.version}) por ${player.ip}`,
    });

    this.savePlayerState(userId);
    dbHelpers.saveServer(server);
    return { success: true, message: `Upload de ${soft.name} concluído com sucesso.` };
  }

  // --- DDoS Calculation & Execution ---

  public calculateDDoSChance(userId: string, targetIp: string): { chance: number; playerPower: number; targetDefense: number } {
    const player = this.getOrCreatePlayer(userId);
    const server = this.servers.get(targetIp);
    if (!server) return { chance: 0, playerPower: 0, targetDefense: 0 };

    const botnet = player.software.find(s => s.type === 'ddos');
    const botnetVer = botnet ? botnet.version : 1.0;

    // VPS Amplifier Bonus
    const vpsAmplifiers = (player.vpsList || []).filter(v => v.activeModule === 'botnet_amplifier');
    const vpsBoost = vpsAmplifiers.reduce((acc, v) => acc + v.moduleLevel * 15, 0);

    const playerPower = Math.round((botnetVer * player.hardware.network.speedMbps * 10) + vpsBoost);
    const targetDefense = Math.round(server.security.firewallLevel * server.hardware.networkMbps * 4);

    const chance = Math.min(95, Math.max(5, Math.round((playerPower / (playerPower + targetDefense * 0.7)) * 100)));
    return { chance, playerPower, targetDefense };
  }

  public ddosAttack(userId: string, targetIp: string): { success: boolean; message: string; downtimeSec?: number } {
    const player = this.getOrCreatePlayer(userId);
    const server = this.servers.get(targetIp);
    if (!server) return { success: false, message: 'Servidor alvo não encontrado.' };

    const { chance } = this.calculateDDoSChance(userId, targetIp);
    const roll = Math.random() * 100;

    if (roll > chance) {
      if (!server.logs) server.logs = [];
      server.logs.unshift({
        id: `log-${uuidv4().substring(0, 8)}`,
        timestamp: Date.now(),
        formattedTime: new Date().toLocaleTimeString(),
        ip: player.ip,
        action: `ATAQUE DDOS BLOQUEADO: Defesas de firewall absorveram o ataque originado de ${player.ip}`,
      });
      dbHelpers.saveServer(server);
      return {
        success: false,
        message: `Ataque DDoS falhou (${chance}% de chance)! O Firewall e a infraestrutura do host ${server.hostname} repeliram sua Botnet.`
      };
    }

    server.isOnline = false;
    const downtimeSec = 60;

    if (!server.logs) server.logs = [];
    server.logs.unshift({
      id: `log-${uuidv4().substring(0, 8)}`,
      timestamp: Date.now(),
      formattedTime: new Date().toLocaleTimeString(),
      ip: player.ip,
      action: `ALERTA CRÍTICO: ATAQUE DDOS BEM-SUCEDIDO! Servidor sobrecarregado e offline a partir de ${player.ip}`,
    });

    player.reputation += 120;
    this.addNews(`ALERTA: Servidor ${server.hostname} (${targetIp}) foi DERRUBADO por um ataque massivo de DDoS!`, 'POLICE');

    this.savePlayerState(userId);
    dbHelpers.saveServer(server);

    setTimeout(() => {
      const srv = this.servers.get(targetIp);
      if (srv) {
        srv.isOnline = true;
        srv.logs.unshift({
          id: `log-${uuidv4().substring(0, 8)}`,
          timestamp: Date.now(),
          formattedTime: new Date().toLocaleTimeString(),
          ip: '127.0.0.1',
          action: 'Serviços de rede recuperados. Servidor voltou a ficar ONLINE.',
        });
        dbHelpers.saveServer(srv);
      }
    }, downtimeSec * 1000);

    return {
      success: true,
      message: `Ataque DDoS bem-sucedido (${chance}% de chance)! O servidor ${server.hostname} foi DERRUBADO e está OFFLINE por ${downtimeSec} segundos!`,
      downtimeSec
    };
  }

  public deleteLocalSoftware(userId: string, softwareId: string): { success: boolean; message: string; softwareName?: string } {
    const player = this.getOrCreatePlayer(userId);
    const index = player.software.findIndex(s => s.id === softwareId);
    if (index === -1) {
      return { success: false, message: 'Software não encontrado no inventário local.' };
    }

    const [deleted] = player.software.splice(index, 1);
    this.savePlayerState(userId);

    return {
      success: true,
      message: `${deleted.name} foi desinstalado e liberou ${deleted.sizeMb}MB de espaço.`,
      softwareName: deleted.name
    };
  }

  public deleteRemoteFile(userId: string, targetIp: string, fileId: string): { success: boolean; message?: string } {
    const player = this.getOrCreatePlayer(userId);
    const server = this.servers.get(targetIp);
    if (!server) return { success: false, message: 'Servidor não encontrado' };

    const index = server.files.findIndex(f => f.id === fileId);
    if (index === -1) return { success: false, message: 'Arquivo não encontrado' };

    const [deleted] = server.files.splice(index, 1);
    if (!server.logs) server.logs = [];
    server.logs.unshift({
      id: `log-${uuidv4().substring(0, 8)}`,
      timestamp: Date.now(),
      formattedTime: new Date().toLocaleTimeString(),
      ip: player.ip,
      action: `Arquivo removido: ${deleted.name} por ${player.ip}`,
    });

    dbHelpers.saveServer(server);
    return { success: true, message: `${deleted.name} apagado do servidor.` };
  }

  public wipeRemoteLogs(targetIp: string): { success: boolean; message?: string } {
    const server = this.servers.get(targetIp);
    if (!server) return { success: false, message: 'Servidor não encontrado' };

    server.logs = [];
    dbHelpers.saveServer(server);
    return { success: true, message: 'Todos os logs do servidor remoto foram apagados.' };
  }

  public editLogEntry(targetIp: string, logId: string, newContent: string): { success: boolean; message?: string } {
    const server = this.servers.get(targetIp);
    if (!server) return { success: false, message: 'Servidor não encontrado' };

    if (!server.logs) server.logs = [];
    const log = server.logs.find(l => l.id === logId);
    if (!log) return { success: false, message: 'Registro de log não encontrado' };

    log.action = newContent;
    dbHelpers.saveServer(server);
    return { success: true, message: 'Registro de log modificado com sucesso.' };
  }

  public compileSoftware(userId: string, softwareId: string): { success: boolean; software?: SoftwareItem; message?: string } {
    const player = this.getOrCreatePlayer(userId);
    const soft = player.software.find(s => s.id === softwareId);
    if (!soft) return { success: false, message: 'Software não encontrado' };

    soft.version = Number((soft.version + 0.1).toFixed(1));
    soft.sizeMb = Math.round(soft.sizeMb * 1.05);
    player.reputation += 25;

    this.savePlayerState(userId);
    return { success: true, software: soft, message: `${soft.name} evoluiu para v${soft.version}!` };
  }

  public bankTransfer(
    userId: string,
    sourceAccNum: string,
    destAccNum: string,
    amount: number,
    bankIp: string
  ): { success: boolean; message: string } {
    const player = this.getOrCreatePlayer(userId);
    const server = this.servers.get(bankIp);
    if (!server || !server.bankAccounts) {
      return { success: false, message: 'Servidor bancário não encontrado' };
    }

    let sourceAcc = server.bankAccounts.find(a => a.accountNumber === sourceAccNum);
    let isPlayerSource = false;

    if (!sourceAcc) {
      const playerAcc = player.bankAccounts?.find(a => a.accountNumber === sourceAccNum);
      if (playerAcc) {
        sourceAcc = playerAcc;
        isPlayerSource = true;
      }
    }

    if (!sourceAcc) return { success: false, message: 'Conta de origem não encontrada' };

    const availableBalance = isPlayerSource ? player.cash : sourceAcc.balance;
    if (availableBalance < amount) return { success: false, message: 'Saldo em conta insuficiente' };

    let destAcc = server.bankAccounts.find(a => a.accountNumber === destAccNum);
    let isPlayerDest = false;

    if (!destAcc) {
      const playerAcc = player.bankAccounts?.find(a => a.accountNumber === destAccNum);
      if (playerAcc) {
        destAcc = playerAcc;
        isPlayerDest = true;
      }
    }

    if (!destAcc) {
      for (const s of this.servers.values()) {
        if (s.bankAccounts) {
          const found = s.bankAccounts.find(a => a.accountNumber === destAccNum);
          if (found) {
            destAcc = found;
            break;
          }
        }
      }
    }

    if (!destAcc) {
      return { success: false, message: 'Conta de destino não existe' };
    }

    if (isPlayerSource) {
      player.cash -= amount;
      sourceAcc.balance = player.cash;
      if (player.bankAccounts && player.bankAccounts.length > 0) {
        player.bankAccounts[0].balance = player.cash;
      }
    } else {
      sourceAcc.balance -= amount;
    }

    if (isPlayerDest) {
      let finalAmount = amount;
      if (player.unlockedStoryPerks?.some(p => p.id === 'perk-narco-laundering')) {
        finalAmount = Math.round(amount * 1.30);
      }
      player.cash += finalAmount;
      destAcc.balance = player.cash;
      if (player.bankAccounts && player.bankAccounts.length > 0) {
        player.bankAccounts[0].balance = player.cash;
      }
      player.reputation += Math.round(amount / 50);
      this.addNews(`Transferência anônima de $${finalAmount.toLocaleString()} interceptada na rede financeira!`, 'ECONOMY');
    } else {
      destAcc.balance += amount;
    }

    if (!server.logs) server.logs = [];
    server.logs.unshift({
      id: `log-${uuidv4().substring(0, 8)}`,
      timestamp: Date.now(),
      formattedTime: new Date().toLocaleTimeString(),
      ip: player.ip,
      action: `TRANSFERÊNCIA BANCÁRIA: $${amount} de ${sourceAccNum} para ${destAccNum}`,
    });

    this.savePlayerState(userId);
    dbHelpers.saveServer(server);

    return { success: true, message: `Transferido $${amount.toLocaleString()} de ${sourceAccNum} para ${destAccNum}` };
  }

  public buyCrypto(userId: string, usdAmount: number): { success: boolean; message: string } {
    return this.tradeCoin(userId, 'btc', 'buy', usdAmount);
  }

  public sellCrypto(userId: string, cryptoAmount: number): { success: boolean; message: string } {
    return this.tradeCoin(userId, 'btc', 'sell', undefined, cryptoAmount);
  }

  public upgradeHardware(userId: string, type: 'cpu' | 'gpu' | 'ram' | 'hdd' | 'network' | 'vpn' | 'cooling'): { success: boolean; message: string } {
    const player = this.getOrCreatePlayer(userId);
    const currentLevel = player.hardware[type]?.level || 1;
    let tiers: any[] = [];
    if (type === 'cpu') tiers = CPU_TIERS;
    else if (type === 'gpu') tiers = GPU_TIERS;
    else if (type === 'ram') tiers = RAM_TIERS;
    else if (type === 'hdd') tiers = HDD_TIERS;
    else if (type === 'network') tiers = NETWORK_TIERS;
    else if (type === 'vpn') tiers = VPN_TIERS;
    else if (type === 'cooling') tiers = COOLING_TIERS;

    const nextTier = tiers.find(t => t.level === currentLevel + 1);
    if (!nextTier) {
      return { success: false, message: `${type.toUpperCase()} já está no nível máximo!` };
    }

    if (player.cash < nextTier.cost) {
      return { success: false, message: `Dinheiro insuficiente ($${nextTier.cost.toLocaleString()} necessário)` };
    }

    player.cash -= nextTier.cost;
    player.hardware[type] = { ...nextTier };
    player.reputation += 100;

    this.savePlayerState(userId);
    return { success: true, message: `Upgrade concluído: ${nextTier.name}` };
  }

  public cleanInfection(userId: string, infectionId: string) {
    const player = this.getOrCreatePlayer(userId);
    const result = this.defenseEngine.cleanSingleInfection(player, infectionId);
    this.savePlayerState(userId);
    return {
      ...result,
      player: this.getPlayer(userId),
    };
  }

  public generateProceduralServer(userId: string = 'user-zero-cool-1'): VirtualServer {
    const targetPool = [
      // 1. Corporações e Tech
      { name: 'Pear Inc. Cloud Storage', domain: 'cloud.pear-inc.com', type: 'corporate' as const, desc: 'Datacenter corporativo da fabricante de smartphones de luxo.' },
      { name: 'Goolag Search Indexer', domain: 'crawler.goolag.net', type: 'corporate' as const, desc: 'Robôs de indexação de busca contendo histórico de bilhões de buscas confidenciais.' },
      { name: 'MicroSoftware AzureCluster', domain: 'azuresync.micro-soft.io', type: 'corporate' as const, desc: 'Cluster em nuvem rodando versões pré-lançamento do sistema operacional.' },
      { name: 'MegaFlix Video Stream Relay', domain: 'cdn-east.megaflix.stream', type: 'corporate' as const, desc: 'Servidor de distribuição de streaming de filmes e séries não lançadas.' },
      { name: 'TikTak Viral Algorithm', domain: 'brain.tiktak.app', type: 'corporate' as const, desc: 'Servidor de inteligência artificial que controla as tendências mundiais de dança.' },
      { name: 'Amazônia Prime Warehouse Hub', domain: 'logistics.amazonia-prime.com', type: 'corporate' as const, desc: 'Sistema automatizado de logística e entrega com drones autônomos.' },
      { name: 'ZapZap Secret Group Backups', domain: 'groups-leak.zapzap.org', type: 'corporate' as const, desc: 'Banco de dados de grupos de mensagens com fofocas políticas e contratos vazados.' },
      { name: 'Fakebook Meta Relay', domain: 'ads-profiler.fakebook.social', type: 'corporate' as const, desc: 'Rede neural de coleta de dados biométricos e fotos antigas de usuários.' },
      { name: 'UberJumento Express API', domain: 'api.uberjumento.tech', type: 'corporate' as const, desc: 'Startup de transporte animal sob demanda rodando em servidor instável.' },
      { name: 'Space-Y Orbital Uplink', domain: 'starlink-node7.space-y.org', type: 'corporate' as const, desc: 'Antena de satélite espacial transmitindo telemetria quântica de foguetes.' },

      // 2. Bancos e Finanças
      { name: 'Banco Urubu do Pix', domain: 'multiplicador.urubu-pix.finance', type: 'bank' as const, desc: 'Esquema de pirâmide financeira com cofres abarrotados de transferências PIX.' },
      { name: 'WallStreet DarkPool Exchange', domain: 'nyse-darkpool.trader.fin', type: 'bank' as const, desc: 'Plataforma oculta de negociação de ações de grandes fundos de investimento.' },
      { name: 'Swiss Panama Secret Vault', domain: 'reserves.swiss-offshore.ch', type: 'bank' as const, desc: 'Cofre bancário suíço guardando reservas de ditadores e bilionários.' },
      { name: 'Banco Intergaláctico de Cripto', domain: 'vault.galaxy-bank.io', type: 'bank' as const, desc: 'Servidor financeiro processando milhões de dólares em stablecoins sintéticas.' },

      // 3. Universidades e Pesquisa
      { name: 'MIT Quantum AI Laboratory', domain: 'ai-core.mit-cyber.edu', type: 'university' as const, desc: 'Supercomputador universitário treinando modelos de inteligência artificial militar.' },
      { name: 'USP Hacker Department', domain: 'sec-lab.poli.usp.br', type: 'university' as const, desc: 'Laboratório acadêmico de segurança cibernética e testes de invasão de rede.' },
      { name: 'Oxford Genome Vault', domain: 'dna-vault.oxford-bio.ac.uk', type: 'university' as const, desc: 'Banco de dados genético confidencial com sequências de DNA sintético.' },

      // 4. Dark Web, Warez & Cartéis
      { name: 'SilkRoad Onion Node', domain: 'market.silkroad-tor.onion', type: 'darkweb' as const, desc: 'Nó clandestino da rede Onion com catálogo de ferramentas proibidas e exploits.' },
      { name: 'WarezScene MegaArchive', domain: '0day-releases.warezscene.to', type: 'darkweb' as const, desc: 'Repositório lendário de programas craqueados e códigos-fonte vazados.' },
      { name: 'Cartel Sinaloa CyberComm', domain: 'narco-relay.sinaloa.darknet', type: 'cartel' as const, desc: 'Servidor de comunicações encriptadas do Cartel. Cuidado: Rastreamento violento!' },
      { name: 'BlackHat Syndicate Exploit Repo', domain: 'zero-days.nullsec-forum.to', type: 'darkweb' as const, desc: 'Repositório de exploits de dia zero vendidos a preço de ouro.' },

      // 5. Governo e Agências
    // 5. Governo, Militares & Agências Aeroespaciais
      { name: 'Receita Federal Sonegação C&C', domain: 'malha-fina.receita-gov.br', type: 'government' as const, desc: 'Servidor governamental cruzando declarações de imposto de renda e contas no exterior.' },
      { name: 'DARPA Experimental BlackSite', domain: 'blackops.darpa-mil.gov', type: 'government' as const, desc: 'Projetos ultrassecretos do departamento de defesa com criptografia quântica.' },
      { name: 'Interpol Cybercrime Division', domain: 'red-notices.interpol.int', type: 'government' as const, desc: 'Banco de dados global de mandados de prisão contra hackers procurados.' },
      { name: 'NASA Quantum Laser Relay', domain: 'dsn-node9.nasa-space.gov', type: 'government' as const, desc: 'Antena de comunicação quântica com satélites no espaço profundo. Hasher v45.0+!' },
      { name: 'Pentágono Nuclear CyberGrid', domain: 'norad-core.defense-gov.mil', type: 'government' as const, desc: 'Supercomputador militar de contenção balística. Segurança de nível 50.0!' },
    ];

    const pick = targetPool[Math.floor(Math.random() * targetPool.length)];
    const nodeSuffix = Math.floor(Math.random() * 900 + 100);
    const ip = `${Math.floor(Math.random() * 200 + 11)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 250 + 2)}`;

    // Tiered hasher and firewall levels by target category
    let hasherLevel = 1.5;
    let firewallLevel = 1.2;
    if (pick.type === 'government') {
      hasherLevel = Number((Math.random() * 25 + 25).toFixed(1)); // v25.0 - v50.0
      firewallLevel = Number(Math.max(1.0, hasherLevel - Math.random() * 3).toFixed(1));
    } else if (pick.type === 'cartel' || pick.type === 'bank') {
      hasherLevel = Number((Math.random() * 15 + 12).toFixed(1)); // v12.0 - v27.0
      firewallLevel = Number(Math.max(1.0, hasherLevel - Math.random() * 2).toFixed(1));
    } else if (pick.type === 'corporate') {
      hasherLevel = Number((Math.random() * 14 + 6).toFixed(1)); // v6.0 - v20.0
      firewallLevel = Number(Math.max(1.0, hasherLevel - Math.random() * 2).toFixed(1));
    } else {
      hasherLevel = Number((Math.random() * 4 + 1.2).toFixed(1)); // v1.2 - v5.2
      firewallLevel = Number(Math.max(1.0, hasherLevel - Math.random() * 1).toFixed(1));
    }

    const isHighTier = hasherLevel >= 15.0;
    const isCartelOrBank = pick.type === 'cartel' || pick.type === 'bank';

    const hostnameSlug = pick.domain.split('.')[0] + `-node${nodeSuffix}`;
    const hostname = `${hostnameSlug}.${pick.domain.split('.').slice(1).join('.')}`;

    const srv: VirtualServer = {
      id: `srv-${uuidv4().substring(0, 8)}`,
      ip,
      hostname: `${pick.name} (#${nodeSuffix})`,
      domain: hostname,
      type: pick.type,
      isOnline: true,
      description: pick.desc,
      hardware: {
        cpuPower: Number((hasherLevel * 0.7 + 2.5).toFixed(1)),
        ramGb: isHighTier ? 256 : (isCartelOrBank ? 64 : 16),
        hddMb: isHighTier ? 150000 : (isCartelOrBank ? 25000 : 5000),
        networkMbps: isHighTier ? 5000 : (isCartelOrBank ? 1000 : 100),
      },
      security: {
        hasherLevel,
        firewallLevel,
        password: `key_${Math.floor(Math.random() * 90000 + 10000)}`,
        isBreached: false,
        openPorts: [
          { port: 80, service: 'HTTP', open: true, version: 'Nginx 1.24' },
          { port: 22, service: 'SSH', open: true, version: 'OpenSSH 9.0' },
          ...(isCartelOrBank ? [{ port: 443, service: 'TLS_VAULT', open: true, version: 'SecureVault v3' }] : []),
          ...(hasherLevel >= 30 ? [{ port: 9999, service: 'QUANTUM_PORT', open: true, version: 'QuantumGateway v5' }] : []),
        ],
      },
      files: [
        {
          id: `file-${uuidv4().substring(0, 8)}`,
          name: `dados_confidenciais_${nodeSuffix}.dat`,
          type: 'warez',
          version: Number(hasherLevel.toFixed(1)),
          sizeMb: Math.round(hasherLevel * 15 + 20),
          isInstalled: false,
        },
        ...(hasherLevel >= 6.0 ? [{
          id: `file-${uuidv4().substring(0, 8)}`,
          name: `CrackMaster_v${hasherLevel.toFixed(1)}.crc`,
          type: 'cracker' as const,
          version: Number(hasherLevel.toFixed(1)),
          sizeMb: Math.round(hasherLevel * 2 + 10),
          isInstalled: false,
        }] : []),
      ],
      bankAccounts: isCartelOrBank ? [
        {
          accountNumber: `ACC-${Math.floor(Math.random() * 89999 + 10000)}`,
          bankIp: '12.189.44.10',
          bankName: 'MegaBank Global',
          balance: Math.round(hasherLevel * 15000 + Math.random() * 25000),
          password: `secret_${nodeSuffix}`,
          ownerName: pick.name,
        }
      ] : undefined,
      logs: [],
      activeMiners: [],
      rewardCash: Math.round(hasherLevel * 3500 + 1000),
      rewardRep: Math.round(hasherLevel * 450 + 150),
    };

    this.servers.set(ip, srv);
    dbHelpers.saveServer(srv);

    const player = this.getOrCreatePlayer(userId);
    if (!player.discoveredIps.includes(ip)) {
      player.discoveredIps.push(ip);
      this.savePlayerState(userId);
    }
    return srv;
  }

  private startMiningTicker() {
    setInterval(() => {
      for (const { userId, player } of this.players.values()) {
        if (!player.cryptoWallet) player.cryptoWallet = { btc: 0, eth: 0, doge: 0, shdw: 0, pepe: 0 };
        const targetCoin = player.miningTargetCoin || 'btc';
        const coin = this.cryptoEngine.getCoin(targetCoin);
        const coinPrice = coin ? coin.priceUsd : 68000;

        const localGpuMult = player.hardware.gpu ? player.hardware.gpu.miningMultiplier : 1.0;

        let totalMinedUsd = 0;
        for (const server of this.servers.values()) {
          if (!server.activeMiners) server.activeMiners = [];
          const miner = server.activeMiners.find(m => m.ownerId === player.id);
          if (miner) {
            const usdGained = (server.hardware.cpuPower * miner.minerLevel * 0.005 * localGpuMult);
            totalMinedUsd += usdGained;
          }
        }

        if (totalMinedUsd > 0) {
          const coinGained = totalMinedUsd / coinPrice;
          player.cryptoWallet[targetCoin] = Number(((player.cryptoWallet[targetCoin] || 0) + coinGained).toFixed(targetCoin === 'pepe' ? 2 : 6));
          if (targetCoin === 'btc') player.crypto = player.cryptoWallet.btc;
          this.savePlayerState(userId);
        }
      }
    }, 5000);
  }

  public collectVpsRevenue(userId: string): { success: boolean; totalCollected: number; message: string } {
    const player = this.getOrCreatePlayer(userId);
    const res = this.datacenterEngine.collectAutomaticMinuteYield(player);
    this.savePlayerState(userId);
    return {
      success: res.totalCollected > 0,
      totalCollected: res.totalCollected,
      message: res.totalCollected > 0
        ? `Recolhimento Concluído: +$${res.totalCollected.toLocaleString()} USD coletados de ${res.vpsYields.length} servidores VPS!`
        : 'Nenhum servidor VPS gerou rendimentos para recolher no momento.',
    };
  }

  private startVpsAndInvasionTicker() {
    // Automated Datacenter Revenue Collection every 1 minute (60s)
    setInterval(() => {
      for (const { userId, player } of this.players.values()) {
        const res = this.datacenterEngine.collectAutomaticMinuteYield(player);
        if (res.totalCollected > 0) {
          this.savePlayerState(userId);

          if (this.proxyTraceEngine['io']) {
            this.proxyTraceEngine['io'].emit('vps_payout_collected', {
              userId,
              totalCollected: res.totalCollected,
              vpsYields: res.vpsYields,
              player: this.getPlayer(userId),
              message: `Recolhimento Automático Datacenter (1 min): +$${res.totalCollected.toLocaleString()} USD depositados em sua conta!`,
            });
          }
        }
      }
    }, 60000);
  }

  private startWorldNewsTicker() {
    const headlines = [
      'Cola-Coca processa hacker que vazou receita do xarope de refrigerante.',
      'Pear Inc. é multada por vender celulares que não incluem o aparelho na embalagem.',
      'Space-Y lança satélite de mineração e atinge novo recorde de hash rate.',
      'Usuários do Goolag descobrem que histórico de navegação de 2012 ainda estava salvo.',
      'Pizzaria do Zé sofre ataque DDoS por clientes querendo pizza de graça.',
      'Botnets anônimas derrubam servidores corporativos em ataques DDoS coordenados.',
      'Mercado Negro da Darknet anuncia chegada de novos lotes de exploits militares!',
      'Guerra de Clãs esquenta pelo controle do Satélite de Wall Street e Cluster Quântico!',
    ];

    setInterval(() => {
      if (Math.random() > 0.6) {
        const h = headlines[Math.floor(Math.random() * headlines.length)];
        this.addNews(h, 'SYSTEM');
      }
    }, 45000);
  }

  private startNpcSecurityTicker() {
    setInterval(() => {
      const fcb = this.servers.get('198.51.100.24');
      if (fcb && fcb.logs) {
        for (const { userId, player } of this.players.values()) {
          const playerLog = fcb.logs.find(l => l.ip === player.ip);
          if (playerLog && Date.now() - playerLog.timestamp > 120000) {
            const fine = Math.min(player.cash, 1000);
            player.cash -= fine;
            this.addNews(`ALERTA: FBI rastreou atividade ilegal até o IP ${player.ip}! Multa de $${fine} aplicada.`, 'POLICE');
            fcb.logs = fcb.logs.filter(l => l.ip !== player.ip);
            this.savePlayerState(userId);
            dbHelpers.saveServer(fcb);
          }
        }
      }
    }, 30000);
  }

  public plantSpyware(userId: string, targetIp: string): { success: boolean; message: string; server?: VirtualServer } {
    const server = this.servers.get(targetIp);
    if (!server) return { success: false, message: 'Servidor alvo não encontrado.' };
    const player = this.getOrCreatePlayer(userId);

    const spywareSoft = player.software.find(s => s.type === 'spyware');
    const spywareLevel = spywareSoft ? spywareSoft.version : 1.0;

    if (!server.activeSpyware) server.activeSpyware = [];
    let implant = server.activeSpyware.find(s => s.ownerId === player.id);

    if (implant) {
      implant.spywareLevel = spywareLevel;
      implant.installedAt = Date.now();
    } else {
      implant = {
        ownerId: player.id,
        spywareLevel,
        installedAt: Date.now(),
        discoveredAccounts: [],
        discoveredCrypto: [],
      };
      server.activeSpyware.push(implant);
    }

    // Initial immediate sniff if bank accounts already exist on target
    if (server.bankAccounts && server.bankAccounts.length > 0) {
      for (const acc of server.bankAccounts) {
        if (!implant.discoveredAccounts?.some(a => a.accountNumber === acc.accountNumber)) {
          implant.discoveredAccounts?.push({ ...acc });
        }
      }
    } else if (server.type === 'bank' || server.type === 'corporate' || server.type === 'cartel' || Math.random() < 0.5) {
      // Generate immediate discovered account or crypto
      const victimName = `Vítima Infiltrada (${server.hostname})`;
      const accNum = `ACC-${Math.floor(Math.random() * 89999 + 10000)}`;
      const bal = Math.round((server.security.hasherLevel * 4500 + 1200 + Math.random() * 8000));
      implant.discoveredAccounts?.push({
        accountNumber: accNum,
        bankIp: '12.189.44.10',
        bankName: 'MegaBank Central',
        balance: bal,
        password: `spy_${Math.random().toString(36).substring(2, 6)}`,
        ownerName: victimName,
      });
    }

    // Also chance to sniff a private crypto wallet
    if (Math.random() < 0.40) {
      const btcAmt = Number((Math.random() * 0.08 + 0.015).toFixed(4));
      implant.discoveredCrypto?.push({
        symbol: 'BTC',
        amount: btcAmt,
        address: `bc1q${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 6)}`,
        password: `wallet_${Math.random().toString(36).substring(2, 6)}`,
      });
    }

    dbHelpers.saveServer(server);
    this.savePlayerState(userId);

    return {
      success: true,
      message: `Spyware Trojan v${spywareLevel.toFixed(1)} implantado com sucesso em ${server.hostname}! Keylogger ativo capturando credenciais financeiras.`,
      server,
    };
  }

  public executeMassBankHeist(userId: string, targetIp: string): { success: boolean; stolenAmount?: number; message: string; server?: VirtualServer } {
    const server = this.servers.get(targetIp);
    if (!server) return { success: false, message: 'Servidor alvo não encontrado.' };
    if (server.type !== 'bank') return { success: false, message: 'Este alvo não é uma instituição financeira bancária!' };
    if (!server.security.isBreached) return { success: false, message: 'Acesso ROOT necessário antes de executar o Mega-Assalto!' };

    const player = this.getOrCreatePlayer(userId);

    // Calculate massive stolen funds based on bank level
    let bankLoot = Math.round(server.security.hasherLevel * 18000 + 45000 + Math.random() * 25000);
    if (player.unlockedStoryPerks?.some(p => p.id === 'perk-narco-laundering')) {
      bankLoot = Math.round(bankLoot * 1.30);
    }
    player.cash += bankLoot;
    if (player.bankAccounts && player.bankAccounts.length > 0) {
      player.bankAccounts[0].balance = player.cash;
    }
    player.reputation += 1500;

    // Reset bank accounts balance
    if (server.bankAccounts) {
      server.bankAccounts.forEach(acc => { acc.balance = 0; });
    }

    dbHelpers.saveServer(server);
    this.savePlayerState(userId);

    // Broadcast Global Breaking News
    this.addNews(
      `🚨 MEGA-ASSALTO A BANCO: O banco ${server.hostname} (${server.ip}) foi saqueado por invasores! Desvio de $${bankLoot.toLocaleString()} USD confirmado! FBI iniciou cerco policial imediato!`,
      'SYSTEM'
    );

    // IMMEDIATELY TRIGGER POLICE RAID ON PLAYER!
    this.contractsAndRaidEngine.triggerPoliceRaid(
      player,
      'FBI Cyber Division',
      `MEGA-ASSALTO BANCÁRIO DETECTADO: Infiltração na Database Central de ${server.hostname} e Desvio Ilegal de $${bankLoot.toLocaleString()} USD!`
    );

    return {
      success: true,
      stolenAmount: bankLoot,
      message: `MEGA-ASSALTO CONCLUÍDO COM SUCESSO! +$${bankLoot.toLocaleString()} USD e +1.500 REP desviados da base central! ⚠️ ALERTA: O FBI DEFLAGROU UM MANDADO DE PRISÃO DE EMERGÊNCIA!`,
      server,
    };
  }

  public siphonVictimCrypto(userId: string, targetIp: string, address: string): { success: boolean; amount?: number; message: string; server?: VirtualServer } {
    const server = this.servers.get(targetIp);
    if (!server || !server.activeSpyware) return { success: false, message: 'Servidor ou spyware não encontrado.' };
    const player = this.getOrCreatePlayer(userId);

    const implant = server.activeSpyware.find(s => s.ownerId === player.id);
    if (!implant || !implant.discoveredCrypto) return { success: false, message: 'Nenhuma carteira descoberta por spyware neste servidor.' };

    const walletIndex = implant.discoveredCrypto.findIndex(w => w.address === address);
    if (walletIndex === -1) return { success: false, message: 'Carteira não encontrada.' };

    const wallet = implant.discoveredCrypto[walletIndex];
    const drainedAmount = wallet.amount;

    if (!player.cryptoWallet) player.cryptoWallet = { btc: 0, eth: 0, doge: 0, shdw: 0, pepe: 0 };
    player.cryptoWallet.btc = Number(((player.cryptoWallet.btc || 0) + drainedAmount).toFixed(6));
    player.crypto = player.cryptoWallet.btc;
    player.reputation += Math.round(drainedAmount * 800);

    // Remove drained wallet
    implant.discoveredCrypto.splice(walletIndex, 1);

    dbHelpers.saveServer(server);
    this.savePlayerState(userId);

    return {
      success: true,
      amount: drainedAmount,
      message: `Carteira interceptada drenada com sucesso! +${drainedAmount} BTC transferidos para sua conta anônima!`,
      server,
    };
  }

  public siphonVictimAccount(userId: string, targetIp: string, accountNumber: string): { success: boolean; amount?: number; message: string; server?: VirtualServer } {
    const server = this.servers.get(targetIp);
    if (!server || !server.activeSpyware) return { success: false, message: 'Servidor ou spyware não encontrado.' };
    const player = this.getOrCreatePlayer(userId);

    const implant = server.activeSpyware.find(s => s.ownerId === player.id);
    if (!implant || !implant.discoveredAccounts) return { success: false, message: 'Nenhuma conta bancária interceptada neste servidor.' };

    const accIndex = implant.discoveredAccounts.findIndex(a => a.accountNumber === accountNumber);
    if (accIndex === -1) return { success: false, message: 'Conta bancária não encontrada.' };

    const account = implant.discoveredAccounts[accIndex];
    let drainedCash = account.balance;
    if (player.unlockedStoryPerks?.some(p => p.id === 'perk-narco-laundering')) {
      drainedCash = Math.round(drainedCash * 1.30);
    }

    player.cash += drainedCash;
    if (player.bankAccounts && player.bankAccounts.length > 0) {
      player.bankAccounts[0].balance = player.cash;
    }
    player.reputation += 120;
    account.balance = 0;

    // Remove account once emptied
    implant.discoveredAccounts.splice(accIndex, 1);

    dbHelpers.saveServer(server);
    this.savePlayerState(userId);

    return {
      success: true,
      amount: drainedCash,
      message: `Desvio bancário concluído! +$${drainedCash.toLocaleString()} USD transferidos da conta da vítima (${account.ownerName}) via Pix/Wire!`,
      server,
    };
  }

  private startSpywareSnifferTicker() {
    setInterval(() => {
      const playersByPlayerId = new Map<string, { userId: string; player: Player }>();
      for (const entry of this.players.values()) {
        if (entry?.player?.id) {
          playersByPlayerId.set(entry.player.id, entry);
        }
      }

      for (const server of this.servers.values()) {
        if (!server.activeSpyware || server.activeSpyware.length === 0) continue;

        for (const implant of server.activeSpyware) {
          const owner = playersByPlayerId.get(implant.ownerId);
          if (!owner) continue;

          // Chance to intercept credentials based on spyware level
          const roll = Math.random();
          if (roll < 0.25) {
            // Sniff new bank account
            if (!implant.discoveredAccounts) implant.discoveredAccounts = [];
            if (implant.discoveredAccounts.length < 5) {
              const accNum = `ACC-${Math.floor(Math.random() * 89999 + 10000)}`;
              const bal = Math.round((server.security.hasherLevel * 3000 + 800 + Math.random() * 5000));
              const victimAcc = {
                accountNumber: accNum,
                bankIp: '12.189.44.10',
                bankName: 'MegaBank Central',
                balance: bal,
                password: `spy_${Math.random().toString(36).substring(2, 6)}`,
                ownerName: `Vítima Interceptada (${server.hostname})`,
              };
              implant.discoveredAccounts.push(victimAcc);
              dbHelpers.saveServer(server);

              if (this.proxyTraceEngine['io']) {
                this.proxyTraceEngine['io'].emit('spyware_credential_intercepted', {
                  playerId: owner.player.id,
                  targetIp: server.ip,
                  targetHostname: server.hostname,
                  credentialType: 'bank_account',
                  account: victimAcc,
                  message: `🕵️ SPYWARE ALERTA: Novas credenciais bancárias interceptadas em ${server.hostname}! Saldo: $${bal.toLocaleString()} USD disponível para desvio!`,
                });
              }
            }
          } else if (roll < 0.35) {
            // Sniff new crypto wallet
            if (!implant.discoveredCrypto) implant.discoveredCrypto = [];
            if (implant.discoveredCrypto.length < 3) {
              const btcAmt = Number((Math.random() * 0.05 + 0.01).toFixed(4));
              const victimCrypto = {
                symbol: 'BTC',
                amount: btcAmt,
                address: `bc1q${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 6)}`,
                password: `wallet_${Math.random().toString(36).substring(2, 6)}`,
              };
              implant.discoveredCrypto.push(victimCrypto);
              dbHelpers.saveServer(server);

              if (this.proxyTraceEngine['io']) {
                this.proxyTraceEngine['io'].emit('spyware_credential_intercepted', {
                  playerId: owner.player.id,
                  targetIp: server.ip,
                  targetHostname: server.hostname,
                  credentialType: 'crypto_wallet',
                  crypto: victimCrypto,
                  message: `🕵️ SPYWARE ALERTA: Carteira de Bitcoins interceptada em ${server.hostname}! Saldo: +${btcAmt} BTC pronto para drenagem!`,
                });
              }
            }
          }
        }
      }
    }, 15000);
  }

  // --- Campaign, Factions & Story Mode ---

  public getStoryChapters(userId: string): StoryChapter[] {
    const player = this.getOrCreatePlayer(userId);
    return this.storyEngine.getChapters(player, this.servers);
  }

  public setFactionAlignment(userId: string, faction: FactionType): { success: boolean; player: Player; message: string } {
    const player = this.getOrCreatePlayer(userId);
    player.activeFactionAlignment = faction;
    this.savePlayerState(userId);
    return {
      success: true,
      player,
      message: `Você agora está alinhado oficialmente com a facção ${faction.toUpperCase()}!`,
    };
  }

  public submitStoryChoice(
    userId: string,
    chapterId: string,
    choiceId: string
  ): { success: boolean; player: Player; message: string; chapterId: string } {
    const player = this.getOrCreatePlayer(userId);
    const result = this.storyEngine.completeChapterChoice(player, this.servers, chapterId, choiceId);

    if (!result.success || !result.choice) {
      return { success: false, player, message: result.message, chapterId };
    }

    const choice = result.choice;
    if (!player.completedStoryChapters.includes(chapterId)) {
      player.completedStoryChapters.push(chapterId);
    }

    // Apply Rewards
    if (choice.rewardCash) player.cash += choice.rewardCash;
    if (choice.rewardBtc) {
      if (!player.cryptoWallet) player.cryptoWallet = { btc: 0, eth: 0, doge: 0, shdw: 0, pepe: 0 };
      player.cryptoWallet.btc = Number(((player.cryptoWallet.btc || 0) + choice.rewardBtc).toFixed(6));
      player.crypto = player.cryptoWallet.btc;
    }
    if (choice.rewardRep) player.reputation += choice.rewardRep;
    if (choice.rewardSoftware) {
      player.software.push(choice.rewardSoftware);
    }
    if (choice.rewardPerk) {
      if (!player.unlockedStoryPerks) player.unlockedStoryPerks = [];
      if (!player.unlockedStoryPerks.some(p => p.id === choice.rewardPerk!.id)) {
        player.unlockedStoryPerks.push(choice.rewardPerk);
      }
    }
    if (choice.factionRepShift) {
      if (!player.factionReputation) {
        player.factionReputation = { anonymous: 0, russian_bears: 0, cartel: 0, lone_wolf: 0 };
      }
      player.factionReputation[choice.factionRepShift.faction] = (player.factionReputation[choice.factionRepShift.faction] || 0) + choice.factionRepShift.amount;
    }
    if (choice.nextChapterId) {
      player.activeStoryChapterId = choice.nextChapterId;
    }

    this.savePlayerState(userId);

    // Send dark chat confirmation message
    this.darkChatEngine.addMessage(
      player.activeFactionAlignment === 'russian_bears' ? 'chan-bear' : player.activeFactionAlignment === 'cartel' ? 'chan-cartel' : player.activeFactionAlignment === 'lone_wolf' ? 'chan-broker' : 'chan-anon',
      'HQ de Inteligência',
      'Comandante de Operações',
      '🌐',
      `🎯 Capítulo Concluído! Decisão registrada: "${choice.label}". Recompensas creditadas em sua conta!`
    );

    return {
      success: true,
      player,
      message: result.message,
      chapterId,
    };
  }

  public getDarkChatChannels(): DarkChatChannel[] {
    return this.darkChatEngine.getChannels();
  }

  public sendDarkChatMessage(userId: string, channelId: string, text: string): { success: boolean; message: DarkChatMessage; channels: DarkChatChannel[] } {
    const player = this.getOrCreatePlayer(userId);
    const msg = this.darkChatEngine.addMessage(
      channelId,
      player.username,
      'Operador',
      '💻',
      text
    );
    return {
      success: true,
      message: msg,
      channels: this.darkChatEngine.getChannels(),
    };
  }

  public notifyContractorTrigger(
    player: Player,
    trigger: 'crack' | 'download' | 'spyware' | 'wipe_logs' | 'bank_heist' | 'ddos',
    targetIp: string,
    targetHostname: string
  ) {
    const reaction = this.darkChatEngine.sendContractorReaction(
      trigger,
      targetIp,
      targetHostname,
      player.activeFactionAlignment || 'anonymous'
    );

    if (reaction && this.proxyTraceEngine['io']) {
      this.proxyTraceEngine['io'].emit('dark_chat_message_received', {
        channelId: reaction.channelId,
        message: reaction,
        channels: this.darkChatEngine.getChannels(),
      });
    }
  }

  // --- Admin Access & Control Center ---
  public verifyIsAdmin(adminUserId: string): boolean {
    const user = dbHelpers.getUserById(adminUserId);
    if (!user) return false;
    const userRow = db.prepare('SELECT role FROM users WHERE id = ?').get(adminUserId) as any;
    return userRow?.role === 'admin' || user.username.toLowerCase() === 'zero_cool';
  }

  public getAdminUsersList(adminUserId: string): { success: boolean; users?: AdminUserData[]; message?: string } {
    if (!this.verifyIsAdmin(adminUserId)) {
      return { success: false, message: 'Acesso negado: Requer privilégios de Administrador.' };
    }

    const rawUsers = dbHelpers.getAllUsersForAdmin();
    const onlineUserIds = new Set(this.players.keys());

    const users = rawUsers.map(u => ({
      ...u,
      isOnline: onlineUserIds.has(u.id),
    }));

    return { success: true, users };
  }

  public adminUpdatePlayer(
    adminUserId: string,
    targetUserId: string,
    updates: {
      cash?: number;
      cryptoWallet?: Record<string, number>;
      reputation?: number;
      rank?: string;
      role?: 'admin' | 'player';
      isBanned?: boolean;
      banReason?: string;
    }
  ): { success: boolean; message: string; player?: Player; updatedUser?: AdminUserData } {
    if (!this.verifyIsAdmin(adminUserId)) {
      return { success: false, message: 'Acesso negado: Requer privilégios de Administrador.' };
    }

    const player = this.getOrCreatePlayer(targetUserId);

    if (updates.cash !== undefined) {
      player.cash = Math.max(0, updates.cash);
      if (player.bankAccounts && player.bankAccounts.length > 0) {
        player.bankAccounts[0].balance = player.cash;
      }
    }

    if (updates.cryptoWallet) {
      player.cryptoWallet = { ...player.cryptoWallet, ...updates.cryptoWallet };
      if (player.cryptoWallet.btc !== undefined) {
        player.crypto = player.cryptoWallet.btc;
      }
    }

    if (updates.reputation !== undefined) {
      player.reputation = Math.max(0, updates.reputation);
    }

    if (updates.rank) {
      player.rank = updates.rank;
    }

    if (updates.role) {
      player.role = updates.role;
      dbHelpers.updateUserRole(targetUserId, updates.role);
    }

    if (updates.isBanned !== undefined) {
      player.isBanned = updates.isBanned;
      player.banReason = updates.banReason || '';
      dbHelpers.setUserBanStatus(targetUserId, updates.isBanned, updates.banReason);
    }

    this.savePlayerState(targetUserId);

    return {
      success: true,
      message: `Jogador "${player.username}" atualizado com sucesso pelo Admin!`,
      player,
    };
  }

  public adminResetUserPassword(
    adminUserId: string,
    targetUserId: string,
    newPasswordPlain: string
  ): { success: boolean; message: string } {
    if (!this.verifyIsAdmin(adminUserId)) {
      return { success: false, message: 'Acesso negado: Requer privilégios de Administrador.' };
    }

    const user = dbHelpers.getUserById(targetUserId);
    if (!user) return { success: false, message: 'Usuário não encontrado.' };

    const ok = dbHelpers.updateUserPassword(targetUserId, newPasswordPlain);
    if (!ok) return { success: false, message: 'Falha ao redefinir a senha no banco de dados.' };

    return {
      success: true,
      message: `Senha do usuário "${user.username}" redefinida com sucesso!`,
    };
  }

  public adminSetUserBan(
    adminUserId: string,
    targetUserId: string,
    isBanned: boolean,
    reason?: string
  ): { success: boolean; message: string } {
    if (!this.verifyIsAdmin(adminUserId)) {
      return { success: false, message: 'Acesso negado: Requer privilégios de Administrador.' };
    }

    const user = dbHelpers.getUserById(targetUserId);
    if (!user) return { success: false, message: 'Usuário não encontrado.' };

    const ok = dbHelpers.setUserBanStatus(targetUserId, isBanned, reason);
    if (!ok) return { success: false, message: 'Falha ao alterar status de banimento.' };

    const player = this.getPlayer(targetUserId);
    if (player) {
      player.isBanned = isBanned;
      player.banReason = reason || '';
      this.savePlayerState(targetUserId);
    }

    return {
      success: true,
      message: isBanned
        ? `Usuário "${user.username}" foi BANIDO com sucesso.`
        : `Banimento do usuário "${user.username}" foi REVOGADO com sucesso.`,
    };
  }

  public adminDeleteUser(
    adminUserId: string,
    targetUserId: string
  ): { success: boolean; message: string } {
    if (!this.verifyIsAdmin(adminUserId)) {
      return { success: false, message: 'Acesso negado: Requer privilégios de Administrador.' };
    }

    if (adminUserId === targetUserId) {
      return { success: false, message: 'Você não pode deletar sua própria conta de Administrador.' };
    }

    const user = dbHelpers.getUserById(targetUserId);
    if (!user) return { success: false, message: 'Usuário não encontrado.' };

    this.players.delete(targetUserId);
    const ok = dbHelpers.deleteUser(targetUserId);

    return {
      success: ok,
      message: ok
        ? `Usuário "${user.username}" e seus dados foram excluídos permanentemente do banco de dados.`
        : 'Erro ao excluir usuário.',
    };
  }

  public adminResetWorldServers(adminUserId: string): { success: boolean; message: string; servers: VirtualServer[] } {
    if (!this.verifyIsAdmin(adminUserId)) {
      return { success: false, message: 'Acesso negado: Requer privilégios de Administrador.', servers: this.getAllServers() };
    }

    dbHelpers.resetAllServers();
    this.servers.clear();
    const freshServers = dbHelpers.getAllServers();
    freshServers.forEach(s => this.servers.set(s.ip, s));

    return {
      success: true,
      message: 'Todos os servidores do mundo foram restaurados para o estado de fábrica original!',
      servers: freshServers,
    };
  }
}
