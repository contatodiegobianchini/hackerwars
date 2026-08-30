import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import {
  Player,
  VirtualServer,
  GameProcess,
  Mission,
  CryptoMarketState,
  GlobalNewsItem,
  ProcessType,
  LootboxCrate,
  LootboxReward,
  Clan,
  TerritoryNode,
  StoryChapter,
  PlayerVps,
  NpcInvasionEvent,
  PoliceTraceState,
  PoliceRaidEvent,
  DarknetContract,
  DarknetAuctionItem,
  DarkChatChannel,
  DarkChatMessage,
  FactionType,
  AdminUserData
} from '../types/game.js';
import { sounds } from '../utils/audio.js';
import { soundtrack } from '../utils/soundtrack.js';
import confetti from 'canvas-confetti';

const HACKERWARS_BACKEND_URL = (import.meta.env.VITE_API_URL || 'https://hackerwars-api.onrender.com').replace(/\/$/, '');
const HACKERWARS_SOCKET_URL = (import.meta.env.VITE_SOCKET_URL || HACKERWARS_BACKEND_URL).replace(/\/$/, '');

export type GameView =
  | 'my_server'
  | 'target_server'
  | 'software'
  | 'processes'
  | 'known_servers'
  | 'missions'
  | 'black_market'
  | 'bank'
  | 'crypto'
  | 'hardware'
  | 'datacenter'
  | 'clans'
  | 'campaign'
  | 'dark_chat'
  | 'antivirus'
  | 'logs'
  | 'leaderboard'
  | 'tutorial'
  | 'admin_panel';

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  timestamp: number;
}

export interface AuthUser {
  id: string;
  username: string;
}

interface GameState {
  currentUser: AuthUser | null;
  token: string | null;
  isAuthLoading: boolean;

  player: Player | null;
  servers: VirtualServer[];
  allServers: VirtualServer[];
  activeConnection: VirtualServer | null;
  processes: GameProcess[];
  missions: Mission[];
  cryptoState: CryptoMarketState | null;
  crates: LootboxCrate[];
  activeLootReward: LootboxReward | null;
  isOpeningLootbox: boolean;
  clans: Clan[];
  territoryNodes: TerritoryNode[];
  storyChapters: StoryChapter[];
  darkChatChannels: DarkChatChannel[];
  activeDarkChatChannelId: string;
  vpsCatalog: any[];
  activeTrace: PoliceTraceState | null;
  activeInvasion: NpcInvasionEvent | null;
  activeRaid: PoliceRaidEvent | null;
  contracts: DarknetContract[];
  auctions: DarknetAuctionItem[];
  isTerminalOpen: boolean;
  isJumpscareVideoPlaying: boolean;
  isSoundtrackPlaying: boolean;
  isMobileMenuOpen: boolean;

  news: GlobalNewsItem[];
  toasts: ToastItem[];
  socket: Socket | null;
  soundEnabled: boolean;
  currentView: GameView;

  // View Navigation & Terminal
  setCurrentView: (view: GameView) => void;
  toggleTerminal: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;

  // Soundtrack & Audio
  toggleSoundtrack: () => void;

  // Cartel & Lockdown
  setJumpscareVideoPlaying: (playing: boolean) => void;
  triggerCartelJumpscareTest: () => void;
  clearLockdown: () => void;

  // Police Raids & Warrants
  defendPoliceRaid: (method: 'bribe' | 'purge_evidence' | 'blackout_jammer') => void;
  dismissRaidAlert: () => void;
  triggerTestRaid: () => void;

  // Darknet Contracts & Auctions
  claimDarknetContract: (contractId: string) => void;
  placeAuctionBid: (auctionId: string, bidAmountUsd: number) => void;
  buyoutAuction: (auctionId: string) => void;

  // Settings & Notifications
  toggleSound: () => void;
  addToast: (title: string, message: string, type?: ToastItem['type']) => void;
  removeToast: (id: string) => void;

  // Auth Methods
  checkAuth: () => Promise<void>;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;

  // Black Market & Lootboxes
  openLootbox: (crateId: string, paymentMethod: 'usd' | 'btc') => void;
  clearLootReward: () => void;

  // Multi-Crypto Trading
  tradeCrypto: (coinId: string, action: 'buy' | 'sell', usdAmount?: number, coinAmount?: number) => void;
  setMiningCoin: (coinId: string) => void;

  // Proxy Bouncing & Police Trace
  toggleProxyHop: (hopIp: string) => void;
  clearProxyChain: () => void;

  // Defense, Antivirus & Honeypot
  runAntivirusScan: () => void;
  cleanInfection: (infectionId: string) => void;
  toggleHoneypot: () => void;
  defendNpcInvasion: (method: 'firewall' | 'honeypot' | 'killswitch') => void;
  dismissInvasionAlert: () => void;

  // Clans & Territory Wars
  createClan: (name: string, tag: string, description: string) => void;
  joinClan: (clanId: string) => void;
  leaveClan: (clanId: string) => void;
  depositClanVault: (clanId: string, amountUsd: number, amountBtc: number) => void;
  attackClanTerritory: (clanId: string, nodeId: string) => void;

  // Datacenter & VPS
  rentVps: (tier: 'micro' | 'beast' | 'quantum') => void;
  setVpsModule: (vpsId: string, moduleType: any) => void;
  upgradeVpsModule: (vpsId: string) => void;

  // Story Campaign & Factions
  submitStoryChoice: (chapterId: string, choiceId: string) => void;
  setFactionAlignment: (faction: FactionType) => void;

  // DarkIRC Encrypted Chat
  setActiveDarkChatChannelId: (id: string) => void;
  sendDarkChatMessage: (channelId: string, text: string) => void;

  // Socket & Actions
  initSocket: () => void;
  connectToTarget: (ip: string) => void;
  disconnectTarget: () => void;
  startProcess: (type: ProcessType, params: {
    targetIp?: string;
    targetFileId?: string;
    targetFileName?: string;
    softwareId?: string;
    details?: any;
  }) => void;
  cancelProcess: (processId: string) => void;
  bankTransfer: (sourceAcc: string, destAcc: string, amount: number, bankIp: string) => void;
  upgradeHardware: (type: 'cpu' | 'gpu' | 'ram' | 'hdd' | 'network' | 'vpn' | 'cooling') => void;
  acceptMission: (missionId: string) => void;
  claimMission: (missionId: string) => void;
  deleteLocalSoftware: (softwareId: string) => void;
  deleteRemoteFile: (targetIp: string, fileId: string) => void;
  wipeRemoteLogs: (targetIp: string) => void;
  editLog: (targetIp: string, logId: string, newText: string) => void;
  discoverRandomIp: () => void;
  siphonVictimCrypto: (targetIp: string, address: string) => void;
  siphonVictimAccount: (targetIp: string, accountNumber: string) => void;

  // Admin Access & Database Controls
  adminUsers: AdminUserData[];
  adminGetUsers: () => void;
  adminUpdatePlayer: (targetUserId: string, updates: any) => void;
  adminResetPassword: (targetUserId: string, newPassword: string) => void;
  adminSetBan: (targetUserId: string, isBanned: boolean, reason?: string) => void;
  adminDeleteUser: (targetUserId: string) => void;
  adminBroadcastNews: (headline: string, category?: string) => void;
  adminResetServers: () => void;

  // Interactive CLI Terminal Execution
  executeTerminalCommand: (rawInput: string) => string;
}

export const useGameStore = create<GameState>((set, get) => ({
  currentUser: null,
  token: localStorage.getItem('hacker_token'),
  isAuthLoading: true,

  player: null,
  servers: [],
  allServers: [],
  activeConnection: null,
  processes: [],
  missions: [],
  cryptoState: null,
  crates: [],
  activeLootReward: null,
  isOpeningLootbox: false,
  clans: [],
  territoryNodes: [],
  storyChapters: [],
  darkChatChannels: [],
  activeDarkChatChannelId: 'chan-anon',
  vpsCatalog: [],
  activeTrace: null,
  activeInvasion: null,
  activeRaid: null,
  contracts: [],
  auctions: [],
  adminUsers: [],
  isTerminalOpen: false,
  isJumpscareVideoPlaying: false,
  isSoundtrackPlaying: true,
  isMobileMenuOpen: false,

  news: [],
  toasts: [],
  socket: null,
  soundEnabled: true,
  currentView: 'my_server',

  setCurrentView: (view) => {
    sounds.click();
    set({ currentView: view, isMobileMenuOpen: false });
  },

  setMobileMenuOpen: (open) => {
    set({ isMobileMenuOpen: open });
  },

  toggleMobileMenu: () => {
    sounds.click();
    set(state => ({ isMobileMenuOpen: !state.isMobileMenuOpen }));
  },

  toggleTerminal: () => {
    sounds.click();
    set(state => ({ isTerminalOpen: !state.isTerminalOpen }));
  },

  toggleSoundtrack: () => {
    const active = soundtrack.toggleMute();
    set({ isSoundtrackPlaying: active });
  },

  setJumpscareVideoPlaying: (playing) => {
    set({ isJumpscareVideoPlaying: playing });
  },

  triggerCartelJumpscareTest: () => {
    const { socket } = get();
    if (socket) {
      socket.emit('trigger_cartel_jumpscare');
    }
  },

  clearLockdown: () => {
    const { socket } = get();
    if (socket) {
      socket.emit('clear_lockdown');
    }
  },

  toggleSound: () => {
    const next = !get().soundEnabled;
    sounds.enabled = next;
    set({ soundEnabled: next });
  },

  addToast: (title, message, type = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastItem = { id, title, message, type, timestamp: Date.now() };

    if (type === 'success') sounds.success();
    else if (type === 'danger' || type === 'warning') sounds.alert();
    else sounds.click();

    set(state => ({ toasts: [...state.toasts, newToast] }));
    setTimeout(() => {
      get().removeToast(id);
    }, 4500);
  },

  removeToast: (id) => {
    set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
  },

  checkAuth: async () => {
    const token = localStorage.getItem('hacker_token');
    if (!token) {
      set({ isAuthLoading: false, currentUser: null, token: null });
      return;
    }

    try {
      const res = await fetch(`${HACKERWARS_BACKEND_URL}/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const user = {
          id: data.user.id || data.user.userId,
          username: data.user.username,
        };
        set({
          token,
          currentUser: user,
          player: data.player,
          isAuthLoading: false
        });
        get().initSocket();
        const { socket } = get();
        if (socket) {
        }
      } else {
        localStorage.removeItem('hacker_token');
        set({ token: null, currentUser: null, isAuthLoading: false });
      }
    } catch {
      set({ isAuthLoading: false });
    }
  },

  login: async (username, password) => {
    try {
      const res = await fetch(`${HACKERWARS_BACKEND_URL}/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Falha ao autenticar' };
      }

      localStorage.setItem('hacker_token', data.token);
      set({
        token: data.token,
        currentUser: data.user,
        player: data.player,
      });

      const { socket } = get();
      if (socket) {
      } else {
        get().initSocket();
      }

      get().addToast('Bem-vindo!', `Sessão iniciada como ${data.user.username}`, 'success');
      sounds.cash();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: 'Erro de conexão com o servidor' };
    }
  },

  register: async (username, password) => {
    try {
      const res = await fetch(`${HACKERWARS_BACKEND_URL}/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Falha ao registrar conta' };
      }

      localStorage.setItem('hacker_token', data.token);
      set({
        token: data.token,
        currentUser: data.user,
        player: data.player,
      });

      const { socket } = get();
      if (socket) {
      } else {
        get().initSocket();
      }

      get().addToast('Conta Criada!', `Terminal e IP atribuídos para ${data.user.username}`, 'success');
      sounds.success();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: 'Erro de conexão com o servidor' };
    }
  },

  logout: () => {
    localStorage.removeItem('hacker_token');
    const { socket } = get();
    if (socket) {
      socket.disconnect();
    }
    set({
      token: null,
      currentUser: null,
      player: null,
      socket: null,
      activeConnection: null,
      currentView: 'my_server'
    });
    sounds.alert();
  },

  // --- Black Market Lootboxes ---
  openLootbox: (crateId, paymentMethod) => {
    const { socket } = get();
    if (socket) {
      set({ isOpeningLootbox: true });
      sounds.taskStart();
      socket.emit('open_lootbox', { crateId, paymentMethod });
    }
  },

  clearLootReward: () => {
    set({ activeLootReward: null, isOpeningLootbox: false });
  },

  // --- Multi-Crypto Trading ---
  tradeCrypto: (coinId, action, usdAmount, coinAmount) => {
    const { socket } = get();
    if (socket) {
      socket.emit('trade_crypto', { coinId, action, usdAmount, coinAmount });
    }
  },

  setMiningCoin: (coinId) => {
    const { socket } = get();
    if (socket) {
      socket.emit('set_mining_coin', { coinId });
    }
  },

  // --- Proxy Bouncing ---
  toggleProxyHop: (hopIp) => {
    const { socket } = get();
    if (socket) {
      socket.emit('toggle_proxy_hop', { hopIp });
    }
  },

  clearProxyChain: () => {
    const { socket } = get();
    if (socket) {
      socket.emit('clear_proxy_chain');
    }
  },

  // --- Defense, Antivirus & Honeypot ---
  runAntivirusScan: () => {
    const { startProcess, player } = get();
    if (!player) return;
    const av = player.software.find(s => s.type === 'antivirus');
    startProcess('antivirus_scan', {
      targetFileName: `${av?.name || 'AegisScanner'} (Varredura Completa)`,
    });
  },

  cleanInfection: (infectionId: string) => {
    const { socket } = get();
    if (socket) {
      sounds.taskStart();
      socket.emit('clean_infection', { infectionId });
    }
  },

  toggleHoneypot: () => {
    const { socket } = get();
    if (socket) {
      sounds.taskStart();
      socket.emit('toggle_honeypot');
    }
  },

  defendNpcInvasion: (method) => {
    const { socket } = get();
    if (socket) {
      socket.emit('defend_npc_invasion', { method });
    }
  },

  dismissInvasionAlert: () => {
    set({ activeInvasion: null });
  },

  // --- Police Raids & Warrants ---
  defendPoliceRaid: (method) => {
    const { socket } = get();
    if (socket) {
      socket.emit('defend_police_raid', { method });
    }
  },

  dismissRaidAlert: () => {
    set({ activeRaid: null });
  },

  triggerTestRaid: () => {
    const { socket } = get();
    if (socket) {
      socket.emit('trigger_test_raid');
    }
  },

  // --- Darknet Contracts & Auctions ---
  claimDarknetContract: (contractId) => {
    const { socket } = get();
    if (socket) {
      sounds.taskStart();
      socket.emit('claim_darknet_contract', { contractId });
    }
  },

  placeAuctionBid: (auctionId, bidAmountUsd) => {
    const { socket } = get();
    if (socket) {
      sounds.taskStart();
      socket.emit('place_auction_bid', { auctionId, bidAmountUsd });
    }
  },

  buyoutAuction: (auctionId) => {
    const { socket } = get();
    if (socket) {
      sounds.taskStart();
      socket.emit('buyout_auction', { auctionId });
    }
  },

  // --- Clans & Territory Wars ---
  createClan: (name, tag, description) => {
    const { socket } = get();
    if (socket) {
      socket.emit('create_clan', { name, tag, description });
    }
  },

  joinClan: (clanId) => {
    const { socket } = get();
    if (socket) {
      socket.emit('join_clan', { clanId });
    }
  },

  leaveClan: (clanId) => {
    const { socket } = get();
    if (socket) {
      socket.emit('leave_clan', { clanId });
    }
  },

  depositClanVault: (clanId, amountUsd, amountBtc) => {
    const { socket } = get();
    if (socket) {
      socket.emit('deposit_clan_vault', { clanId, amountUsd, amountBtc });
    }
  },

  attackClanTerritory: (clanId, nodeId) => {
    const { socket } = get();
    if (socket) {
      sounds.taskStart();
      socket.emit('attack_clan_territory', { clanId, nodeId });
    }
  },

  // --- Datacenter & VPS ---
  rentVps: (tier) => {
    const { socket } = get();
    if (socket) {
      socket.emit('rent_vps', { tier });
    }
  },

  setVpsModule: (vpsId, moduleType) => {
    const { socket } = get();
    if (socket) {
      socket.emit('set_vps_module', { vpsId, moduleType });
    }
  },

  upgradeVpsModule: (vpsId) => {
    const { socket } = get();
    if (socket) {
      socket.emit('upgrade_vps_module', { vpsId });
    }
  },

  // --- Story Campaign & Factions ---
  submitStoryChoice: (chapterId, choiceId) => {
    const { socket } = get();
    if (socket) {
      socket.emit('submit_story_choice', { chapterId, choiceId });
    }
  },

  setFactionAlignment: (faction) => {
    const { socket } = get();
    if (socket) {
      socket.emit('set_faction_alignment', { faction });
    }
  },

  // --- DarkIRC Encrypted Chat ---
  setActiveDarkChatChannelId: (id) => set({ activeDarkChatChannelId: id }),

  sendDarkChatMessage: (channelId, text) => {
    const { socket } = get();
    if (socket) {
      sounds.taskStart();
      socket.emit('send_dark_chat_message', { channelId, text });
    }
  },

  // --- Socket Initialization & Listener Bridges ---
  initSocket: () => {
    const existing = get().socket;
    const user = get().currentUser;
    if (existing) {
      return;
    }

    const token = get().token || localStorage.getItem('hacker_token');
    const socket = io(HACKERWARS_SOCKET_URL, {
      transports: ['websocket', 'polling'],
      auth: { token }
    });

    socket.on('connect', () => {
      const u = get().currentUser;
      soundtrack.start();
    });

    // Cartel Jumpscare & 5-Minute Lockdown
    socket.on('cartel_jumpscare_event', (data) => {
      set({
        player: data.player,
        isJumpscareVideoPlaying: true
      });
      sounds.alert();
    });

    socket.on('lockdown_cleared', (data) => {
      set({ player: data.player });
      get().addToast('Livre do Cartel!', data.message, 'success');
      sounds.success();
    });

    socket.on('init_state', (data) => {
      set({
        player: data.player,
        servers: data.servers,
        allServers: data.allServers,
        missions: data.missions,
        cryptoState: data.cryptoState,
        crates: data.crates || [],
        clans: data.clans || [],
        territoryNodes: data.territoryNodes || [],
        contracts: data.contracts || [],
        auctions: data.auctions || [],
        activeRaid: data.activeRaid || null,
        vpsCatalog: data.vpsCatalog || [],
        storyChapters: data.storyChapters || [],
        darkChatChannels: data.darkChatChannels || [],
        activeTrace: data.activeTrace || null,
        news: data.news,
        processes: data.processes || [],
      });
    });

    socket.on('world_sync', (data) => {
      set(state => ({
        cryptoState: data.cryptoState || state.cryptoState,
        clans: data.clans || state.clans,
        territoryNodes: data.territoryNodes || state.territoryNodes,
        contracts: data.contracts || state.contracts,
        auctions: data.auctions || state.auctions,
        news: data.news || state.news,
      }));
    });

    // Police Raids & Warrants
    socket.on('police_raid_alert', ({ raid }) => {
      set({ activeRaid: raid });
      sounds.alert();
      get().addToast('🚨 MANDADO DE PRISÃO!', `${raid.agencyName} iniciou mandado de busca! Defenda-se agora!`, 'danger');
    });

    socket.on('police_raid_tick', ({ raid }) => {
      set({ activeRaid: raid });
    });

    socket.on('police_raid_resolved', (res) => {
      set({ activeRaid: null });
      if (res.outcome === 'bribed') {
        get().addToast('Suborno Aceito', 'Propina aceita pelas autoridades. Mandado arquivado.', 'success');
        sounds.cash();
      } else if (res.outcome === 'purged') {
        get().addToast('Evidências Destruídas', 'Registros destruídos. Incursão cancelada.', 'info');
        sounds.success();
      } else {
        get().addToast('MANDADO EXECUTADO!', res.message || 'Ativos apreendidos pela polícia federal!', 'danger');
        sounds.alert();
      }
    });

    socket.on('police_raid_defend_result', (res) => {
      if (res.player) set({ player: res.player });
      get().addToast('Defesa de Mandado', res.message, res.success ? 'success' : 'danger');
    });

    // Darknet Contracts
    socket.on('darknet_contract_claimed', (res) => {
      if (res.player) set({ player: res.player });
      if (res.contracts) set({ contracts: res.contracts });
      get().addToast('Contrato Darknet', res.message, res.success ? 'success' : 'warning');
      if (res.success) {
        sounds.cash();
        confetti({ particleCount: 80, spread: 70 });
      }
    });

    // Darknet Auctions
    socket.on('auction_bid_result', (res) => {
      if (res.player) set({ player: res.player });
      if (res.auctions) set({ auctions: res.auctions });
      get().addToast('Leilão Darknet', res.message, res.success ? 'success' : 'warning');
      if (res.success) sounds.click();
    });

    socket.on('auction_buyout_result', (res) => {
      if (res.player) set({ player: res.player });
      if (res.auctions) set({ auctions: res.auctions });
      get().addToast('Leilão Darknet', res.message, res.success ? 'success' : 'warning');
      if (res.success) {
        sounds.cash();
        confetti({ particleCount: 90, spread: 80 });
      }
    });

    // NPC Invasions
    socket.on('npc_invasion_alert', ({ invasion }) => {
      set({ activeInvasion: invasion });
      sounds.alert();
      get().addToast('⚠️ ALERTA DE INVASÃO!', `${invasion.attackerName} (${invasion.attackerIp}) está quebrando seu firewall!`, 'danger');
    });

    socket.on('npc_invasion_tick', ({ invasion }) => {
      set({ activeInvasion: invasion });
    });

    socket.on('npc_invasion_resolved', (res) => {
      set({ activeInvasion: null });
      if (res.outcome === 'trapped') {
        get().addToast('ARMADILHA ATIVADA!', `Invasor capturado no Honeypot! +$${res.bounty} confiscados!`, 'success');
        confetti({ particleCount: 60, spread: 60 });
      } else if (res.outcome === 'blocked') {
        get().addToast('Invasão Bloqueada', 'Suas defesas repeliram o ataque.', 'info');
      } else {
        get().addToast('SERVIDOR VIOLADO!', `O invasor roubou $${res.stolenCash} e plantou um Trojan!`, 'danger');
      }
    });

    // Police Tracing
    socket.on('police_trace_start', (data: { userId?: string; state: any }) => {
      const currentPlayerId = get().player?.id;
      if (data.userId && currentPlayerId && data.userId !== currentPlayerId) return;
      set({ activeTrace: data.state });
    });

    socket.on('police_trace_tick', (data: { userId?: string; state: any }) => {
      const currentPlayerId = get().player?.id;
      if (data.userId && currentPlayerId && data.userId !== currentPlayerId) return;
      set({ activeTrace: data.state });
    });

    socket.on('police_trace_stopped', (data?: { userId?: string }) => {
      const currentPlayerId = get().player?.id;
      if (data?.userId && currentPlayerId && data.userId !== currentPlayerId) return;
      set({ activeTrace: null });
    });

    // Proxy Chain
    socket.on('proxy_chain_updated', (res) => {
      if (res.player) set({ player: res.player });
      if (res.message) get().addToast('Rota de Salto', res.message, 'info');
    });

    // Honeypot & Infections
    socket.on('infection_cleaned', (res) => {
      if (res.player) set({ player: res.player });
      get().addToast('Antivírus AegisScanner', res.message, res.success ? 'success' : 'warning');
      if (res.success) {
        sounds.success();
        confetti({ particleCount: 50, spread: 60 });
      }
    });

    socket.on('honeypot_toggled', (res) => {
      if (res.player) set({ player: res.player });
      get().addToast('Sistema de Honeypot', res.message, 'info');
    });

    // Clans
    socket.on('clan_action_result', (res) => {
      if (res.player) set({ player: res.player });
      if (res.clans) set({ clans: res.clans });
      if (res.territoryNodes) set({ territoryNodes: res.territoryNodes });
      get().addToast('Rede de Clãs', res.message, res.success ? 'success' : 'warning');
      if (res.conquered) {
        confetti({ particleCount: 90, spread: 80 });
      }
    });

    // Datacenter & VPS
    socket.on('vps_action_result', (res) => {
      if (res.player) set({ player: res.player });
      get().addToast('Datacenter Cloud', res.message, res.success ? 'success' : 'warning');
      if (res.success) sounds.success();
    });

    socket.on('vps_payout_collected', (res) => {
      if (res.player) set({ player: res.player });
      get().addToast('Rendimento do Datacenter', res.message, 'success');
      sounds.cash();
      confetti({ particleCount: 45, spread: 60 });
    });

    // Story Choices & Factions
    socket.on('story_choice_result', (res) => {
      if (res.player) set({ player: res.player });
      if (res.storyChapters) set({ storyChapters: res.storyChapters });
      if (res.darkChatChannels) set({ darkChatChannels: res.darkChatChannels });
      get().addToast('Modo História', res.message, 'success');
      sounds.cash();
      confetti({ particleCount: 70, spread: 70 });
    });

    socket.on('faction_alignment_result', (res) => {
      if (res.player) set({ player: res.player });
      if (res.darkChatChannels) set({ darkChatChannels: res.darkChatChannels });
      get().addToast('Facção Atualizada!', res.message, 'success');
      sounds.success();
      confetti({ particleCount: 80, spread: 80 });
    });

    // DarkIRC Encrypted Chat
    socket.on('dark_chat_message_received', (data) => {
      if (data.channels) set({ darkChatChannels: data.channels });
      if (data.message) {
        sounds.alert();
        get().addToast(`💬 ${data.message.sender} (${data.message.role})`, data.message.text.substring(0, 120), 'info');
      }
    });

    socket.on('dark_chat_message_sent', (res) => {
      if (res.channels) set({ darkChatChannels: res.channels });
    });

    // Admin Control Center
    socket.on('admin_users_list', (res: { success: boolean; users?: AdminUserData[]; message?: string }) => {
      if (res.success && res.users) {
        set({ adminUsers: res.users });
      }
    });

    socket.on('admin_action_result', (res: { success: boolean; message: string; player?: Player }) => {
      if (res.player) set({ player: res.player });
      get().addToast('Painel Admin', res.message, res.success ? 'success' : 'danger');
      if (res.success) {
        sounds.success();
        confetti({ particleCount: 50, spread: 60 });
      }
    });

    // Lootboxes
    socket.on('lootbox_result', (res) => {
      set({ isOpeningLootbox: false });
      if (res.success && res.reward) {
        set({ player: res.player, activeLootReward: res.reward });
        sounds.cash();
        confetti({
          particleCount: res.reward.rarity === 'legendary' ? 120 : 70,
          spread: 80,
          colors: ['#f59e0b', '#8b5cf6', '#3b82f6'],
        });
        get().addToast(`Lootbox Aberta! [${res.reward.rarity.toUpperCase()}]`, res.reward.title, 'success');
      } else {
        get().addToast('Erro no Black Market', res.message || 'Falha ao abrir caixa', 'danger');
      }
    });

    socket.on('crypto_result', (res) => {
      if (res.success) {
        set({ player: res.player, cryptoState: res.cryptoState || get().cryptoState });
        get().addToast('Transação Cripto', res.message, 'success');
        sounds.cash();
      } else {
        get().addToast('Erro Cripto', res.message, 'danger');
      }
    });

    socket.on('mining_coin_updated', (res) => {
      if (res.success) {
        set({ player: res.player });
        get().addToast('Mineração Reconfigurada', res.message, 'success');
      }
    });

    socket.on('processes_updated', (processes: GameProcess[]) => {
      set({ processes });
    });

    socket.on('process_started', (res) => {
      if (res.success) {
        sounds.taskStart();
        get().addToast('Tarefa Iniciada', 'Processo adicionado à fila de execução.', 'info');
      } else {
        get().addToast('Erro ao iniciar processo', res.message || 'Limite de RAM atingido', 'warning');
      }
    });

    socket.on('process_completed', (data: { process: GameProcess; message: string; player: Player; server?: VirtualServer }) => {
      set(state => {
        const updatedServer = data.server;
        return {
          player: data.player,
          activeConnection: updatedServer && state.activeConnection?.ip === updatedServer.ip ? updatedServer : state.activeConnection,
          servers: updatedServer ? state.servers.map(s => s.ip === updatedServer.ip ? updatedServer : s) : state.servers,
          allServers: updatedServer ? (
            state.allServers.some(s => s.ip === updatedServer.ip)
              ? state.allServers.map(s => s.ip === updatedServer.ip ? updatedServer : s)
              : [...state.allServers, updatedServer]
          ) : state.allServers,
        };
      });

      get().addToast('Processo Concluído', data.message, 'success');

      if (data.process.type === 'crack' || data.process.type === 'ddos' || data.process.type === 'antivirus_scan') {
        confetti({
          particleCount: 50,
          spread: 60,
          colors: ['#3b82f6', '#10b981', '#ef4444'],
        });
      }
    });

    socket.on('target_connected', (res) => {
      if (res.success && res.server) {
        set(state => ({
          activeConnection: res.server,
          player: res.player,
          currentView: 'target_server',
          activeTrace: res.traceState || null,
          servers: state.servers.some(s => s.ip === res.server.ip) ? state.servers : [...state.servers, res.server],
          allServers: state.allServers.some(s => s.ip === res.server.ip) ? state.allServers.map(s => s.ip === res.server.ip ? res.server : s) : [...state.allServers, res.server],
        }));
        get().addToast('Conectado', `Conexão estabelecida com ${res.server.hostname} (${res.server.ip})`, 'success');
        sounds.success();
      } else {
        get().addToast('Falha na Conexão', res.message || 'Host inalcançável', 'danger');
      }
    });

    socket.on('local_software_deleted', (res) => {
      if (res.success) {
        set({ player: res.player });
        get().addToast('Software Desinstalado', res.message, 'info');
        sounds.click();
      }
    });

    socket.on('bank_result', (res) => {
      if (res.success) {
        set(state => ({
          player: res.player,
          activeConnection: res.server || state.activeConnection,
          allServers: res.server ? state.allServers.map(s => s.ip === res.server?.ip ? res.server : s) : state.allServers,
        }));
        get().addToast('Transferência Concluída', res.message, 'success');
        sounds.cash();
      } else {
        get().addToast('Erro Bancário', res.message, 'danger');
      }
    });

    socket.on('hardware_result', (res) => {
      if (res.success) {
        set({ player: res.player });
        get().addToast('Hardware Atualizado', res.message, 'success');
        sounds.success();
      } else {
        get().addToast('Falha no Upgrade', res.message, 'warning');
      }
    });

    socket.on('mission_accepted', (res) => {
      if (res.success) {
        set({ player: res.player, missions: res.missions });
        get().addToast('Contrato Aceito', `Missão "${res.mission.title}" iniciada!`, 'info');
      }
    });

    socket.on('mission_claimed', (res) => {
      if (res.success) {
        set({ player: res.player, missions: res.missions });
        get().addToast('Missão Concluída!', res.message, 'success');
        sounds.cash();
        confetti({ particleCount: 80, spread: 70 });
      } else {
        get().addToast('Objetivo Incompleto', res.message, 'warning');
      }
    });

    socket.on('ip_discovered', (res) => {
      set(state => ({
        servers: res.servers,
        player: res.player,
        allServers: state.allServers.some(s => s.ip === res.server.ip) ? state.allServers : [...state.allServers, res.server],
      }));
      get().addToast('Novo Alvo Descoberto!', `${res.server.hostname} (${res.server.ip})`, 'info');
    });

    socket.on('file_operation_result', (res) => {
      if (res.server) {
        set(state => ({
          activeConnection: res.server,
          allServers: state.allServers.map(s => s.ip === res.server.ip ? res.server : s),
        }));
      }
      if (res.message) {
        get().addToast('Operação de Arquivo', res.message, res.success ? 'success' : 'danger');
      }
    });

    socket.on('log_edit_result', (res) => {
      if (res.server) {
        set(state => ({
          activeConnection: res.server,
          allServers: state.allServers.map(s => s.ip === res.server.ip ? res.server : s),
        }));
      }
      get().addToast('Editor de Logs', res.message || 'Log modificado', res.success ? 'success' : 'danger');
    });

    // Spyware & Infiltration events
    socket.on('spyware_credential_intercepted', (data) => {
      sounds.alert();
      get().addToast('🕵️ SPYWARE ALERTA', data.message, 'success');
      set(state => {
        const updatedServer = state.allServers.find(s => s.ip === data.targetIp);
        if (updatedServer && updatedServer.activeSpyware) {
          const implant = updatedServer.activeSpyware.find((s: any) => s.ownerId === state.player?.id);
          if (implant) {
            if (data.credentialType === 'bank_account' && data.account) {
              if (!implant.discoveredAccounts) implant.discoveredAccounts = [];
              if (!implant.discoveredAccounts.some((a: any) => a.accountNumber === data.account.accountNumber)) {
                implant.discoveredAccounts.push(data.account);
              }
            } else if (data.credentialType === 'crypto_wallet' && data.crypto) {
              if (!implant.discoveredCrypto) implant.discoveredCrypto = [];
              if (!implant.discoveredCrypto.some((c: any) => c.address === data.crypto.address)) {
                implant.discoveredCrypto.push(data.crypto);
              }
            }
          }
          return {
            allServers: [...state.allServers],
            activeConnection: state.activeConnection && state.activeConnection.ip === data.targetIp ? { ...state.activeConnection } : state.activeConnection,
          };
        }
        return { allServers: state.allServers };
      });
    });

    socket.on('victim_crypto_siphoned', (res) => {
      if (res.success) {
        set(state => ({
          player: res.player,
          activeConnection: res.server || state.activeConnection,
          allServers: res.server ? state.allServers.map(s => s.ip === res.server.ip ? res.server : s) : state.allServers,
        }));
        get().addToast('Cripto Drenada!', res.message, 'success');
        sounds.cash();
        confetti({ particleCount: 70, spread: 80, colors: ['#f59e0b', '#10b981'] });
      } else {
        get().addToast('Erro de Drenagem', res.message, 'danger');
      }
    });

    socket.on('victim_account_siphoned', (res) => {
      if (res.success) {
        set(state => ({
          player: res.player,
          activeConnection: res.server || state.activeConnection,
          allServers: res.server ? state.allServers.map(s => s.ip === res.server.ip ? res.server : s) : state.allServers,
        }));
        get().addToast('Desvio Bancário!', res.message, 'success');
        sounds.cash();
        confetti({ particleCount: 70, spread: 80, colors: ['#10b981', '#3b82f6'] });
      } else {
        get().addToast('Erro no Desvio', res.message, 'danger');
      }
    });

    set({ socket });
  },

  connectToTarget: (ip) => {
    const { socket } = get();
    if (socket) {
      sounds.taskStart();
      socket.emit('connect_target', { ip });
    }
  },

  disconnectTarget: () => {
    const { socket } = get();
    if (socket) {
      socket.emit('disconnect_target');
    }
    sounds.click();
    set({ activeConnection: null, activeTrace: null, currentView: 'my_server' });
    get().addToast('Desconectado', 'Sessão com host remoto encerrada.', 'info');
  },

  startProcess: (type, params) => {
    const { socket } = get();
    if (socket) {
      socket.emit('start_process', { type, ...params });
    }
  },

  cancelProcess: (processId) => {
    const { socket } = get();
    if (socket) {
      socket.emit('cancel_process', { processId });
    }
  },

  deleteLocalSoftware: (softwareId) => {
    const { socket } = get();
    if (socket) {
      socket.emit('delete_local_software', { softwareId });
    }
  },

  bankTransfer: (sourceAcc, destAcc, amount, bankIp) => {
    const { socket } = get();
    if (socket) {
      socket.emit('bank_transfer', { sourceAcc, destAcc, amount, bankIp });
    }
  },

  upgradeHardware: (type) => {
    const { socket } = get();
    if (socket) {
      socket.emit('upgrade_hardware', { type });
    }
  },

  acceptMission: (missionId) => {
    const { socket } = get();
    if (socket) {
      socket.emit('accept_mission', { missionId });
    }
  },

  claimMission: (missionId) => {
    const { socket } = get();
    if (socket) {
      socket.emit('claim_mission', { missionId });
    }
  },

  deleteRemoteFile: (targetIp, fileId) => {
    const { socket } = get();
    if (socket) {
      socket.emit('delete_remote_file', { targetIp, fileId });
    }
  },

  wipeRemoteLogs: (targetIp) => {
    const { startProcess } = get();
    startProcess('wipelog', { targetIp });
  },

  editLog: (targetIp, logId, newText) => {
    const { socket } = get();
    if (socket) {
      socket.emit('edit_log', { targetIp, logId, newText });
    }
  },

  discoverRandomIp: () => {
    const { socket } = get();
    if (socket) {
      sounds.taskStart();
      socket.emit('discover_random_ip');
    }
  },

  siphonVictimCrypto: (targetIp, address) => {
    const { socket } = get();
    if (socket) {
      sounds.taskStart();
      socket.emit('siphon_victim_crypto', { targetIp, address });
    }
  },

  siphonVictimAccount: (targetIp, accountNumber) => {
    const { socket } = get();
    if (socket) {
      sounds.taskStart();
      socket.emit('siphon_victim_account', { targetIp, accountNumber });
    }
  },

  // --- Admin Operations ---
  adminGetUsers: () => {
    const { socket } = get();
    if (socket) socket.emit('admin_get_users');
  },

  adminUpdatePlayer: (targetUserId, updates) => {
    const { socket } = get();
    if (socket) socket.emit('admin_update_player', { targetUserId, updates });
  },

  adminResetPassword: (targetUserId, newPassword) => {
    const { socket } = get();
    if (socket) socket.emit('admin_reset_password', { targetUserId, newPassword });
  },

  adminSetBan: (targetUserId, isBanned, reason) => {
    const { socket } = get();
    if (socket) socket.emit('admin_set_ban', { targetUserId, isBanned, reason });
  },

  adminDeleteUser: (targetUserId) => {
    const { socket } = get();
    if (socket) socket.emit('admin_delete_user', { targetUserId });
  },

  adminBroadcastNews: (headline, category) => {
    const { socket } = get();
    if (socket) socket.emit('admin_broadcast_news', { headline, category });
  },

  adminResetServers: () => {
    const { socket } = get();
    if (socket) socket.emit('admin_reset_servers');
  },

  // --- Interactive Terminal Execution CLI ---
  executeTerminalCommand: (rawInput: string) => {
    const input = rawInput.trim();
    if (!input) return '';

    const parts = input.split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    const { player, activeConnection, connectToTarget, disconnectTarget, startProcess, wipeRemoteLogs } = get();

    switch (cmd) {
      case 'help':
        return [
          '=== COMANDOS DISPONÍVEIS ===',
          'connect <ip/dominio>  - Conectar a um servidor remoto',
          'disconnect            - Encerrar conexão remota ativa',
          'scan [ip]             - Executar PortScan no alvo conectado',
          'crack                 - Iniciar quebra de senha (Bruteforce)',
          'ddos                  - Lançar ataque DDoS no alvo ativo',
          'download <fileId>     - Baixar arquivo do servidor remoto',
          'wipe                  - Apagar todos os logs do servidor remoto',
          'avscan                - Executar varredura de Antivírus no PC',
          'honeypot              - Ligar/Desligar armadilha Honeypot',
          'status                - Exibir status e IP do sistema local',
          'balance               - Consultar saldo USD e Bitcoin',
          'clear                 - Limpar tela do terminal',
        ].join('\n');

      case 'connect':
        if (!args[0]) return 'Uso: connect <ip ou dominio>';
        connectToTarget(args[0]);
        return `Iniciando conexão com ${args[0]}...`;

      case 'disconnect':
        if (!activeConnection) return 'Você não está conectado a nenhum host.';
        disconnectTarget();
        return 'Conexão encerrada com sucesso.';

      case 'scan':
        if (!activeConnection) return 'Conecte-se a um servidor antes de escanear.';
        startProcess('scan', { targetIp: activeConnection.ip });
        return `PortScan iniciado em ${activeConnection.ip}...`;

      case 'crack':
        if (!activeConnection) return 'Conecte-se a um servidor antes de tentar quebrar a senha.';
        startProcess('crack', { targetIp: activeConnection.ip });
        return `Ataque de força bruta (Crack) iniciado em ${activeConnection.ip}...`;

      case 'ddos':
        if (!activeConnection) return 'Conecte-se a um servidor para lançar ataque DDoS.';
        startProcess('ddos', { targetIp: activeConnection.ip, targetFileName: `DDoS em ${activeConnection.hostname}` });
        return `Ataque massivo DDoS lançado contra ${activeConnection.hostname}!`;

      case 'wipe':
        if (!activeConnection) return 'Conecte-se a um host remoto para apagar logs.';
        wipeRemoteLogs(activeConnection.ip);
        return `Processo de limpeza de logs iniciado em ${activeConnection.ip}...`;

      case 'avscan':
        get().runAntivirusScan();
        return 'AegisScanner Pro iniciado. Escaneando memória e disco...';

      case 'honeypot':
        get().toggleHoneypot();
        return 'Comando de chave do Honeypot enviado.';

      case 'test_cartel':
        get().triggerCartelJumpscareTest();
        return 'Iniciando simulação de rastreamento e retaliação do Cartel...';

      case 'test_invasion':
        const sk = get().socket;
        if (sk) sk.emit('trigger_npc_invasion');
        return 'Disparando simulação de ataque e invasão hacker no seu IP...';

      case 'free_me':
        get().clearLockdown();
        return 'Bloqueio de encolha suspenso para fins de teste.';

      case 'status':
        if (!player) return 'Perfil indisponível.';
        return `[SISTEMA LOCAL]\nUsuário: ${player.username}\nIP: ${player.ip}\nRank: ${player.rank} (${player.reputation} REP)\nHardware: ${player.hardware.cpu.clockSpeedGhz}GHz CPU | ${player.hardware.gpu?.tflops || 0.5} TFLOPS GPU | ${player.hardware.ram.maxTasks} Tasks RAM`;

      case 'balance':
        if (!player) return 'Perfil indisponível.';
        return `Saldo USD: $${player.cash.toLocaleString()} | Saldo BTC: ${player.crypto?.toFixed(4) || 0} BTC`;

      case 'ls':
        if (activeConnection) {
          const files = (activeConnection.files || []).map(f => ` - ${f.name} (${f.sizeMb}MB) [${f.type}]`).join('\n');
          return `Arquivos em ${activeConnection.hostname}:\n${files || '(Nenhum arquivo)'}`;
        }
        const local = (player?.software || []).map(s => ` - ${s.name} v${s.version.toFixed(1)} (${s.sizeMb}MB)`).join('\n');
        return `Softwares Locais:\n${local}`;

      default:
        return `Comando não reconhecido: "${cmd}". Digite "help" para ver os comandos disponíveis.`;
    }
  },
}));
