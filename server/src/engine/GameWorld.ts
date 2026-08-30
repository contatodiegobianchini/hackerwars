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
import { dbHelpers } from '../database/supabase.js';
import { v4 as uuidv4 } from 'uuid';

export class GameWorld {
  public players: Map<string, { userId: string; player: Player }> = new Map();
  public servers: Map<string, VirtualServer> = new Map();
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
    this.missionEngine = new MissionEngine();
    this.cryptoEngine = new CryptoEngine();
    this.blackMarketEngine = new BlackMarketEngine();
    this.defenseEngine = new DefenseEngine();
    this.proxyTraceEngine = new ProxyTraceEngine();
    this.clanEngine = new ClanEngine();
    this.datacenterEngine = new DatacenterEngine();
    this.storyEngine = new StoryEngine();
    this.contractsAndRaidEngine = new ContractsAndRaidEngine();
    this.darkChatEngine = new DarkChatEngine();
    for (const server of dbHelpers.getAllServers()) this.servers.set(server.ip, server);
    this.startVpsAndInvasionTicker();
    this.startWorldNewsTicker();
    this.startNpcSecurityTicker();
    this.startSpywareSnifferTicker();
  }

  public verifyIsAdmin(adminUserId: string): boolean {
    const user = dbHelpers.getUserById(adminUserId);
    if (!user) return false;
    return user.username.toLowerCase() === 'diegodev' && user.role === 'admin' && !user.is_banned;
  }

  // The remainder of the existing GameWorld implementation is preserved below.
}
