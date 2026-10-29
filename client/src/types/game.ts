export type SoftwareType =
  | 'cracker'
  | 'hasher'
  | 'firewall'
  | 'portscan'
  | 'miner'
  | 'ddos'
  | 'antivirus'
  | 'collector'
  | 'warez'
  | 'exploit'
  | 'spyware';

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface SoftwareItem {
  id: string;
  name: string;
  type: SoftwareType;
  version: number;
  sizeMb: number;
  isInstalled: boolean;
  isRunning?: boolean;
  hidden?: boolean;
  rarity?: ItemRarity;
}

export interface HardwareSpec {
  name: string;
  level: number;
  cost: number;
}

export interface CpuSpec extends HardwareSpec {
  clockSpeedGhz: number;
}

export interface GpuSpec extends HardwareSpec {
  tflops: number;
  miningMultiplier: number;
}

export interface RamSpec extends HardwareSpec {
  capacityGb: number;
  maxTasks: number;
}

export interface HddSpec extends HardwareSpec {
  capacityMb: number;
  usedMb: number;
}

export interface NetworkSpec extends HardwareSpec {
  speedMbps: number;
}

export interface VpnSpec extends HardwareSpec {
  nodesCount: number;
  traceDelaySec: number;
  encryptionType: string;
}

export interface CoolingSpec extends HardwareSpec {
  tempReductionPct: number;
  maxSafeTasks: number;
}

export interface PlayerHardware {
  cpu: CpuSpec;
  gpu: GpuSpec;
  ram: RamSpec;
  hdd: HddSpec;
  network: NetworkSpec;
  vpn: VpnSpec;
  cooling?: CoolingSpec;
}

export interface BankAccount {
  accountNumber: string;
  bankIp: string;
  bankName: string;
  balance: number;
  password?: string;
  ownerName?: string;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  formattedTime: string;
  ip: string;
  action: string;
  isSelf?: boolean;
}

export interface PortInfo {
  port: number;
  service: string;
  open: boolean;
  version: string;
}

export type ServerType =
  | 'personal'
  | 'bank'
  | 'government'
  | 'corporate'
  | 'darkweb'
  | 'isp'
  | 'university'
  | 'honeypot'
  | 'cartel';

export interface VirtualServer {
  id: string;
  ip: string;
  hostname: string;
  domain?: string;
  type: ServerType;
  isOnline: boolean;
  hardware: {
    cpuPower: number;
    ramGb: number;
    hddMb: number;
    networkMbps: number;
  };
  security: {
    hasherLevel: number;
    firewallLevel: number;
    password: string;
    isBreached: boolean;
    rootPassword?: string;
    openPorts: PortInfo[];
  };
  files: SoftwareItem[];
  bankAccounts?: BankAccount[];
  logs: LogEntry[];
  activeMiners: Array<{
    ownerId: string;
    minerLevel: number;
    hashRate: number;
    coinId?: string;
  }>;
  activeSpyware?: Array<{
    ownerId: string;
    spywareLevel: number;
    installedAt: number;
    discoveredAccounts?: BankAccount[];
    discoveredCrypto?: Array<{ symbol: string; amount: number; address: string; password?: string }>;
  }>;
  rewardCash?: number;
  rewardRep?: number;
  description?: string;
}

export type ProcessType =
  | 'crack'
  | 'download'
  | 'upload'
  | 'scan'
  | 'compile'
  | 'wipelog'
  | 'editlog'
  | 'ddos'
  | 'upgrade_hardware'
  | 'mine'
  | 'antivirus_scan'
  | 'plant_spyware'
  | 'mass_bank_heist';

export type ProcessStatus = 'running' | 'completed' | 'canceled' | 'failed';

export interface GameProcess {
  id: string;
  playerId: string;
  type: ProcessType;
  targetIp?: string;
  targetFileId?: string;
  targetFileName?: string;
  progress: number;
  durationMs: number;
  startTime: number;
  endTime: number;
  status: ProcessStatus;
  details?: Record<string, any>;
}

export type MissionDifficulty = 'Easy' | 'Medium' | 'Hard' | 'Elite' | 'Legendary';
export type MissionType =
  | 'steal_file'
  | 'wipe_server'
  | 'ddos_target'
  | 'hack_bank'
  | 'plant_virus'
  | 'trace_hacker';
export type MissionStatus = 'available' | 'active' | 'completed' | 'failed';

export interface Mission {
  id: string;
  title: string;
  employer: string;
  description: string;
  type: MissionType;
  targetIp: string;
  targetDomain?: string;
  requiredFileName?: string;
  rewardCash: number;
  rewardCrypto: number;
  rewardRep: number;
  difficulty: MissionDifficulty;
  status: MissionStatus;
  timeLimitMs?: number;
}

export interface CryptoCoin {
  id: string;
  name: string;
  symbol: string;
  priceUsd: number;
  change24h: number;
  priceHistory: number[];
  volatility: number;
  description: string;
  color: string;
}

// --- Player Defense & Infection ---
export interface InfectionItem {
  id: string;
  name: string;
  type: 'trojan' | 'rogue_miner' | 'spyware';
  level: number;
  drainUsdPerMin: number;
  detected: boolean;
}

export interface NpcInvasionEvent {
  id: string;
  attackerName: string;
  attackerIp: string;
  attackerLevel: number;
  targetPlayerId: string;
  progress: number;
  timeRemainingSec: number;
  status: 'incoming' | 'blocked' | 'breached' | 'trapped';
  rewardCash: number;
}

// --- Proxy Chain & Live Police Trace ---
export interface ProxyHop {
  ip: string;
  hostname: string;
  latencyMs: number;
  isClean: boolean;
}

export interface PoliceTraceState {
  isActive: boolean;
  targetIp: string;
  targetName: string;
  progressPercent: number;
  totalSeconds: number;
  secondsRemaining: number;
  hops: ProxyHop[];
  dangerLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

// --- Clans & Territory Wars ---
export interface ClanMember {
  playerId: string;
  username: string;
  role: 'Leader' | 'Officer' | 'Member';
  reputationContributed: number;
  joinedAt: number;
}

export interface TerritoryNode {
  id: string;
  name: string;
  ip: string;
  type: 'DNS_ROOT' | 'FINANCIAL_SATELLITE' | 'DARKNET_HUB' | 'QUANTUM_CORE';
  controllingClanId?: string;
  controllingClanTag?: string;
  defensePower: number;
  bonusDescription: string;
}

export interface Clan {
  id: string;
  name: string;
  tag: string;
  description: string;
  leaderId: string;
  leaderName: string;
  vaultCash: number;
  vaultBtc: number;
  totalReputation: number;
  members: ClanMember[];
  sharedSoftware: SoftwareItem[];
  controlledNodes: string[];
}

// --- Cloud Datacenter & VPS Hosting ---
export type VpsModuleType = 'mining_rig' | 'botnet_amplifier' | 'phishing_honeypot';

export interface PlayerVps {
  id: string;
  name: string;
  ip: string;
  location: string;
  tier: 'micro' | 'beast' | 'quantum';
  costMonthly: number;
  cpuPower: number;
  networkMbps: number;
  activeModule: VpsModuleType;
  moduleLevel: number;
  passivelyGeneratedUsd: number;
}

// --- Campaign, Factions & Story Mode ---
export type FactionType = 'anonymous' | 'russian_bears' | 'cartel' | 'lone_wolf';

export interface StoryPerk {
  id: string;
  name: string;
  description: string;
  faction: FactionType;
  icon?: string;
}

export interface StoryObjective {
  id: string;
  text: string;
  type: 'scan' | 'crack' | 'download' | 'spyware' | 'wipe_logs' | 'bank_heist' | 'ddos';
  targetIp: string;
  targetFileName?: string;
  completed: boolean;
}

export interface StoryChoice {
  id: string;
  label: string;
  outcomeText: string;
  factionRepShift?: { faction: FactionType; amount: number };
  rewardCash?: number;
  rewardBtc?: number;
  rewardRep?: number;
  rewardSoftware?: SoftwareItem;
  rewardPerk?: StoryPerk;
  nextChapterId?: string;
}

export interface StoryChapter {
  id: string;
  chapterNumber: number;
  title: string;
  faction: FactionType;
  factionName: string;
  briefing: string;
  dialogue: Array<{ speaker: string; text: string; role?: string; avatar?: string }>;
  targetIp?: string;
  targetHostname?: string;
  objectives: StoryObjective[];
  choices: StoryChoice[];
  isCompleted: boolean;
  unlocked: boolean;
}

export interface DarkChatMessage {
  id: string;
  channelId: string;
  sender: string;
  role: string;
  avatar: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
  actionButton?: {
    label: string;
    actionType: 'connect' | 'scan' | 'crack' | 'plant_spyware' | 'mass_heist';
    targetIp?: string;
    payload?: any;
  };
}

export interface DarkChatChannel {
  id: string;
  name: string;
  faction: FactionType;
  description: string;
  avatar: string;
  unreadCount: number;
  messages: DarkChatMessage[];
}

export interface Player {
  id: string;
  username: string;
  ip: string;
  cash: number;
  crypto: number;
  cryptoWallet: Record<string, number>;
  miningTargetCoin?: string;
  reputation: number;
  rank: string;
  hardware: PlayerHardware;
  bankAccounts: BankAccount[];
  software: SoftwareItem[];
  logs: LogEntry[];
  activeMissions: Mission[];
  discoveredIps: string[];
  hackedIps: string[];

  // Advanced Expansion Fields
  infections: InfectionItem[];
  honeypotActive: boolean;
  honeypotActiveUntil?: number;
  honeypotCooldownUntil?: number;
  activeProxyChain: string[];
  clanId?: string;
  vpsList: PlayerVps[];
  completedStoryChapters: string[];
  factionReputation: Record<FactionType, number>;
  activeFactionAlignment?: FactionType;
  unlockedStoryPerks: StoryPerk[];
  activeStoryChapterId?: string;
  lockdownUntil?: number;

  // Admin and Account Status
  role?: 'admin' | 'player';
  isBanned?: boolean;
  banReason?: string;
}

export interface AdminUserData {
  id: string;
  username: string;
  role: 'admin' | 'player';
  isBanned: boolean;
  banReason?: string;
  createdAt: number;
  ip: string;
  cash: number;
  cryptoBtc: number;
  cryptoWallet: Record<string, number>;
  reputation: number;
  rank: string;
  completedChaptersCount: number;
  isOnline: boolean;
}

export interface CryptoMarketState {
  btcPrice: number;
  coins: Record<string, CryptoCoin>;
  priceHistory: number[];
  change24h: number;
  totalNetworkHashrate: number;
}

export interface LootboxCrate {
  id: string;
  name: string;
  description: string;
  priceUsd: number;
  priceBtc: number;
  tier: 'basic' | 'advanced' | 'elite';
  icon: string;
  accentColor: string;
  odds: {
    common: number;
    uncommon: number;
    rare: number;
    epic: number;
    legendary: number;
  };
}

export interface LootboxReward {
  rarity: ItemRarity;
  type: 'software' | 'cash' | 'crypto' | 'reputation';
  title: string;
  description: string;
  software?: SoftwareItem;
  cashAmount?: number;
  cryptoAmount?: { symbol: string; amount: number; coinId: string };
  repAmount?: number;
}

export interface GlobalNewsItem {
  id: string;
  timestamp: number;
  headline: string;
  category: 'BREACH' | 'ECONOMY' | 'CLAN' | 'POLICE' | 'SYSTEM';
}

export interface PoliceRaidEvent {
  id: string;
  agencyName: string; // 'FBI Cyber Division' | 'Interpol Red Notice' | 'Receita Federal'
  warrantReason: string;
  timeRemainingSec: number;
  bribeCostUsd: number;
  status: 'incoming' | 'bribed' | 'purged' | 'seized';
}

export interface DarknetContract {
  id: string;
  title: string;
  targetIp: string;
  targetHostname: string;
  type: 'steal_file' | 'plant_miner' | 'ddos_shutdown' | 'siphon_bank';
  targetFileName?: string;
  rewardCash: number;
  rewardCryptoBtc?: number;
  rewardRep: number;
  requiredCrackerLevel: number;
  description: string;
  completed?: boolean;
}

export interface DarknetAuctionItem {
  id: string;
  title: string;
  itemType: 'software' | 'hardware' | 'crypto_drive' | 'zero_day';
  itemData: any;
  currentBidUsd: number;
  highestBidder: string;
  minNextBidUsd: number;
  buyoutUsd: number;
  endsAt: number;
  description: string;
}
