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
import { getAuthToken, setAuthToken, removeAuthToken } from '../utils/tokenStorage.js';
import confetti from 'canvas-confetti';

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
  setCurrentView: (view: GameView) => void;
  toggleTerminal: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
  toggleSoundtrack: () => void;
  setJumpscareVideoPlaying: (playing: boolean) => void;
  triggerCartelJumpscareTest: () => void;
  clearLockdown: () => void;
  defendPoliceRaid: (method: 'bribe' | 'purge_evidence' | 'blackout_jammer') => void;
  dismissRaidAlert: () => void;
  triggerTestRaid: () => void;
  claimDarknetContract: (contractId: string) => void;
  placeAuctionBid: (auctionId: string, bidAmountUsd: number) => void;
  buyoutAuction: (auctionId: string) => void;
  toggleSound: () => void;
  addToast: (title: string, message: string, type?: ToastItem['type']) => void;
  removeToast: (id: string) => void;
  checkAuth: () => Promise<void>;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  openLootbox: (crateId: string, paymentMethod: 'usd' | 'btc') => void;
  clearLootReward: () => void;
  tradeCrypto: (coinId: string, action: 'buy' | 'sell', usdAmount?: number, coinAmount?: number) => void;
  setMiningCoin: (coinId: string) => void;
  toggleProxyHop: (hopIp: string) => void;
  clearProxyChain: () => void;
  runAntivirusScan: () => void;
  cleanInfection: (infectionId: string) => void;
  toggleHoneypot: () => void;
  defendNpcInvasion: (method: 'firewall' | 'honeypot' | 'killswitch') => void;
  dismissInvasionAlert: () => void;
  createClan: (name: string, tag: string, description: string) => void;
  joinClan: (clanId: string) => void;
  leaveClan: (clanId: string) => void;
  depositClanVault: (clanId: string, amountUsd: number, amountBtc: number) => void;
  attackClanTerritory: (clanId: string, nodeId: string) => void;
  rentVps: (tier: 'micro' | 'beast' | 'quantum') => void;
  setVpsModule: (vpsId: string, moduleType: any) => void;
  upgradeVpsModule: (vpsId: string) => void;
  submitStoryChoice: (chapterId: string, choiceId: string) => void;
  setFactionAlignment: (faction: FactionType) => void;
  setActiveDarkChatChannelId: (id: string) => void;
  sendDarkChatMessage: (channelId: string, text: string) => void;
  initSocket: () => void;
  connectToTarget: (ip: string) => void;
  disconnectTarget: () => void;
  startProcess: (type: ProcessType, params: { targetIp?: string; targetFileId?: string; targetFileName?: string; softwareId?: string; details?: any }) => void;
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
  adminUsers: AdminUserData[];
  adminGetUsers: () => void;
  adminUpdatePlayer: (targetUserId: string, updates: any) => void;
  adminResetPassword: (targetUserId: string, newPassword: string) => void;
  adminSetBan: (targetUserId: string, isBanned: boolean, reason?: string) => void;
  adminDeleteUser: (targetUserId: string) => void;
  adminBroadcastNews: (headline: string, category?: string) => void;
  adminResetServers: () => void;
  executeTerminalCommand: (rawInput: string) => string;
}

export const useGameStore = create<GameState>((set, get) => ({
  currentUser: null,
  token: typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('hacker_token') : null,
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
  setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
  toggleMobileMenu: () => { sounds.click(); set(state => ({ isMobileMenuOpen: !state.isMobileMenuOpen })); },
  toggleTerminal: () => { sounds.click(); set(state => ({ isTerminalOpen: !state.isTerminalOpen })); },
  toggleSoundtrack: () => { const active = soundtrack.toggleMute(); set({ isSoundtrackPlaying: active }); },
  setJumpscareVideoPlaying: (playing) => set({ isJumpscareVideoPlaying: playing }),
  triggerCartelJumpscareTest: () => { get().socket?.emit('trigger_cartel_jumpscare'); },
  clearLockdown: () => { get().socket?.emit('clear_lockdown'); },
  toggleSound: () => { const next = !get().soundEnabled; sounds.enabled = next; set({ soundEnabled: next }); },
  addToast: (title, message, type = 'info') => { const id = `toast-${Date.now()}-${Math.random()}`; const newToast = { id, title, message, type, timestamp: Date.now() }; if (type === 'success') sounds.success(); else if (type === 'danger' || type === 'warning') sounds.alert(); else sounds.click(); set(state => ({ toasts: [...state.toasts, newToast] })); setTimeout(() => get().removeToast(id), 4500); },
  removeToast: (id) => set(state => ({ toasts: state.toasts.filter(t => t.id !== id) })),

  checkAuth: async () => {
    const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('hacker_token') : null;
    if (!token) { set({ isAuthLoading: false, currentUser: null, token: null }); return; }
    try {
      const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        const user = { id: data.user.id || data.user.userId, username: data.user.username };
        set({ token, currentUser: user, player: data.player, isAuthLoading: false });
        get().initSocket();
        get().socket?.emit('set_user_session', { userId: user.id });
      } else {
        sessionStorage.removeItem('hacker_token');
        set({ token: null, currentUser: null, isAuthLoading: false });
      }
    } catch { set({ isAuthLoading: false }); }
  },

  login: async (username, password) => {
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Falha ao autenticar' };
      sessionStorage.setItem('hacker_token', data.token);
      set({ token: data.token, currentUser: data.user, player: data.player });
      const { socket } = get();
      if (socket) socket.emit('set_user_session', { userId: data.user.id }); else get().initSocket();
      get().addToast('Bem-vindo!', `Sessão iniciada como ${data.user.username}`, 'success');
      sounds.cash();
      return { success: true };
    } catch { return { success: false, error: 'Erro de conexão com o servidor' }; }
  },

  register: async (username, password) => {
    try {
      const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Falha ao registrar conta' };
      sessionStorage.setItem('hacker_token', data.token);
      set({ token: data.token, currentUser: data.user, player: data.player });
      const { socket } = get();
      if (socket) socket.emit('set_user_session', { userId: data.user.id }); else get().initSocket();
      get().addToast('Conta Criada!', `Terminal e IP atribuídos para ${data.user.username}`, 'success');
      sounds.success();
      return { success: true };
    } catch { return { success: false, error: 'Erro de conexão com o servidor' }; }
  },

  logout: () => { sessionStorage.removeItem('hacker_token'); get().socket?.disconnect(); set({ token: null, currentUser: null, player: null, socket: null, activeConnection: null, currentView: 'my_server' }); sounds.alert(); },

  openLootbox: (crateId, paymentMethod) => { const { socket } = get(); if (socket) { set({ isOpeningLootbox: true }); sounds.taskStart(); socket.emit('open_lootbox', { crateId, paymentMethod }); } },
  clearLootReward: () => set({ activeLootReward: null, isOpeningLootbox: false }),
  tradeCrypto: (coinId, action, usdAmount, coinAmount) => { get().socket?.emit('trade_crypto', { coinId, action, usdAmount, coinAmount }); },
  setMiningCoin: (coinId) => { get().socket?.emit('set_mining_coin', { coinId }); },
  toggleProxyHop: (hopIp) => { get().socket?.emit('toggle_proxy_hop', { hopIp }); },
  clearProxyChain: () => { get().socket?.emit('clear_proxy_chain'); },
  runAntivirusScan: () => { const { startProcess, player } = get(); if (!player) return; const av = player.software.find(s => s.type === 'antivirus'); startProcess('antivirus_scan', { targetFileName: `${av?.name || 'AegisScanner'} (Varredura Completa)` }); },
  cleanInfection: (infectionId) => { get().socket?.emit('clean_infection', { infectionId }); },
  toggleHoneypot: () => { get().socket?.emit('toggle_honeypot'); },
  defendNpcInvasion: (method) => { get().socket?.emit('defend_npc_invasion', { method }); },
  dismissInvasionAlert: () => set({ activeInvasion: null }),
  defendPoliceRaid: (method) => { get().socket?.emit('defend_police_raid', { method }); },
  dismissRaidAlert: () => set({ activeRaid: null }),
  triggerTestRaid: () => { get().socket?.emit('trigger_test_raid'); },
  claimDarknetContract: (contractId) => { get().socket?.emit('claim_darknet_contract', { contractId }); },
  placeAuctionBid: (auctionId, bidAmountUsd) => { get().socket?.emit('place_auction_bid', { auctionId, bidAmountUsd }); },
  buyoutAuction: (auctionId) => { get().socket?.emit('buyout_auction', { auctionId }); },
  createClan: (name, tag, description) => { get().socket?.emit('create_clan', { name, tag, description }); },
  joinClan: (clanId) => { get().socket?.emit('join_clan', { clanId }); },
  leaveClan: (clanId) => { get().socket?.emit('leave_clan', { clanId }); },
  depositClanVault: (clanId, amountUsd, amountBtc) => { get().socket?.emit('deposit_clan_vault', { clanId, amountUsd, amountBtc }); },
  attackClanTerritory: (clanId, nodeId) => { get().socket?.emit('attack_clan_territory', { clanId, nodeId }); },
  rentVps: (tier) => { get().socket?.emit('rent_vps', { tier }); },
  setVpsModule: (vpsId, moduleType) => { get().socket?.emit('set_vps_module', { vpsId, moduleType }); },
  upgradeVpsModule: (vpsId) => { get().socket?.emit('upgrade_vps_module', { vpsId }); },
  submitStoryChoice: (chapterId, choiceId) => { get().socket?.emit('submit_story_choice', { chapterId, choiceId }); },
  setFactionAlignment: (faction) => { get().socket?.emit('set_faction_alignment', { faction }); },
  setActiveDarkChatChannelId: (id) => set({ activeDarkChatChannelId: id }),
  sendDarkChatMessage: (channelId, text) => { get().socket?.emit('send_dark_chat_message', { channelId, text }); },

  initSocket: () => {
    const existing = get().socket;
    const user = get().currentUser;
    if (existing) { if (user?.id && existing.connected) existing.emit('set_user_session', { userId: user.id }); return; }
    const token = get().token || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('hacker_token') : null);
    const socket = io('/', { transports: ['websocket', 'polling'], auth: { token } });
    socket.on('connect', () => { const u = get().currentUser; if (u?.id) socket.emit('set_user_session', { userId: u.id }); soundtrack.start(); });
    socket.on('init_state', (data) => set({ player: data.player, servers: data.servers, allServers: data.allServers, missions: data.missions, cryptoState: data.cryptoState, crates: data.crates || [], clans: data.clans || [], territoryNodes: data.territoryNodes || [], contracts: data.contracts || [], auctions: data.auctions || [], activeRaid: data.activeRaid || null, vpsCatalog: data.vpsCatalog || [], storyChapters: data.storyChapters || [], darkChatChannels: data.darkChatChannels || [], activeTrace: data.activeTrace || null, news: data.news, processes: data.processes || [] }));
    socket.on('world_sync', (data) => set(state => ({ cryptoState: data.cryptoState || state.cryptoState, clans: data.clans || state.clans, territoryNodes: data.territoryNodes || state.territoryNodes, contracts: data.contracts || state.contracts, auctions: data.auctions || state.auctions, news: data.news || state.news })));

    socket.on('admin_users_list', (res: { success: boolean; users?: AdminUserData[]; message?: string }) => { if (res.success && res.users) set({ adminUsers: res.users }); });

    socket.on('admin_action_result', (res: { success: boolean; message: string; player?: Player; targetPlayer?: Player }) => {
      // Never replace the authenticated player's session with the player being edited.
      // Target player data belongs to the admin table only.
      if (res.targetPlayer && res.targetPlayer.id === get().currentUser?.id) {
        set({ player: res.targetPlayer });
      }
      get().addToast('Painel Admin', res.message, res.success ? 'success' : 'danger');
      if (res.success) { sounds.success(); confetti({ particleCount: 50, spread: 60 }); get().adminGetUsers(); }
    });

    socket.on('lootbox_result', (res) => { set({ isOpeningLootbox: false }); if (res.success && res.reward) { set({ player: res.player, activeLootReward: res.reward }); sounds.cash(); confetti({ particleCount: res.reward.rarity === 'legendary' ? 120 : 70, spread: 80, colors: ['#f59e0b', '#8b5cf6', '#3b82f6'] }); get().addToast(`Lootbox Aberta! [${res.reward.rarity.toUpperCase()}]`, res.reward.title, 'success'); } else get().addToast('Erro no Black Market', res.message || 'Falha ao abrir caixa', 'danger'); });
    socket.on('crypto_result', (res) => { if (res.success) { set({ player: res.player, cryptoState: res.cryptoState || get().cryptoState }); get().addToast('Transação Cripto', res.message, 'success'); sounds.cash(); } else get().addToast('Erro Cripto', res.message, 'danger'); });
    socket.on('mining_coin_updated', (res) => { if (res.success) { set({ player: res.player }); get().addToast('Mineração Reconfigurada', res.message, 'success'); } });
    socket.on('processes_updated', (processes) => set({ processes }));
    socket.on('process_started', (res) => { if (res.success) get().addToast('Tarefa Iniciada', 'Processo adicionado à fila de execução.', 'info'); else get().addToast('Erro ao iniciar processo', res.message || 'Limite de RAM atingido', 'warning'); });
    socket.on('process_completed', (data) => { set(state => ({ player: data.player, activeConnection: data.server && state.activeConnection?.ip === data.server.ip ? data.server : state.activeConnection, servers: data.server ? state.servers.map(s => s.ip === data.server.ip ? data.server : s) : state.servers, allServers: data.server ? (state.allServers.some(s => s.ip === data.server.ip) ? state.allServers.map(s => s.ip === data.server.ip ? data.server : s) : [...state.allServers, data.server]) : state.allServers })); get().addToast('Processo Concluído', data.message, 'success'); });
    socket.on('target_connected', (res) => { if (res.success && res.server) set(state => ({ activeConnection: res.server, player: res.player, currentView: 'target_server', activeTrace: res.traceState || null, servers: state.servers.some(s => s.ip === res.server.ip) ? state.servers : [...state.servers, res.server], allServers: state.allServers.some(s => s.ip === res.server.ip) ? state.allServers.map(s => s.ip === res.server.ip ? res.server : s) : [...state.allServers, res.server] })); else get().addToast('Falha na Conexão', res.message || 'Host inalcançável', 'danger'); });
    socket.on('local_software_deleted', (res) => { if (res.success) set({ player: res.player }); get().addToast('Software Desinstalado', res.message, res.success ? 'info' : 'danger'); });
    socket.on('bank_result', (res) => { if (res.success) set(state => ({ player: res.player, activeConnection: res.server || state.activeConnection, allServers: res.server ? state.allServers.map(s => s.ip === res.server?.ip ? res.server : s) : state.allServers })); get().addToast(res.success ? 'Transferência Concluída' : 'Erro Bancário', res.message, res.success ? 'success' : 'danger'); });
    socket.on('hardware_result', (res) => { if (res.success) set({ player: res.player }); get().addToast(res.success ? 'Hardware Atualizado' : 'Falha no Upgrade', res.message, res.success ? 'success' : 'warning'); });
    socket.on('mission_accepted', (res) => { if (res.success) set({ player: res.player, missions: res.missions }); else get().addToast('Missão', res.message || 'Não foi possível aceitar a missão', 'warning'); });
    socket.on('mission_claimed', (res) => { if (res.success) { set({ player: res.player, missions: res.missions }); get().addToast('Missão Concluída!', res.message, 'success'); sounds.cash(); confetti({ particleCount: 80, spread: 70 }); } else get().addToast('Objetivo Incompleto', res.message, 'warning'); });
    socket.on('faction_alignment_result', (res) => { if (res.player) set({ player: res.player }); if (res.darkChatChannels) set({ darkChatChannels: res.darkChatChannels }); get().addToast('Facção Atualizada!', res.message, res.success ? 'success' : 'danger'); });
    socket.on('story_choice_result', (res) => { if (res.player) set({ player: res.player }); if (res.storyChapters) set({ storyChapters: res.storyChapters }); if (res.darkChatChannels) set({ darkChatChannels: res.darkChatChannels }); get().addToast('Modo História', res.message, res.success ? 'success' : 'danger'); });
    socket.on('disconnect', () => { /* Socket.IO reconnects automatically. */ });
    set({ socket });
  },

  connectToTarget: (ip) => get().socket?.emit('connect_target', { ip }),
  disconnectTarget: () => { get().socket?.emit('disconnect_target'); set({ activeConnection: null, currentView: 'my_server' }); },
  startProcess: (type, params) => { const socket = get().socket; if (socket) socket.emit('start_process', { type, ...params }); },
  cancelProcess: (processId) => { get().socket?.emit('cancel_process', { processId }); },
  bankTransfer: (sourceAcc, destAcc, amount, bankIp) => { get().socket?.emit('bank_transfer', { sourceAcc, destAcc, amount, bankIp }); },
  upgradeHardware: (type) => { get().socket?.emit('upgrade_hardware', { type }); },
  acceptMission: (missionId) => { get().socket?.emit('accept_mission', { missionId }); },
  claimMission: (missionId) => { get().socket?.emit('claim_mission', { missionId }); },
  deleteLocalSoftware: (softwareId) => { get().socket?.emit('delete_local_software', { softwareId }); },
  deleteRemoteFile: (targetIp, fileId) => { get().socket?.emit('delete_remote_file', { targetIp, fileId }); },
  wipeRemoteLogs: (targetIp) => { get().socket?.emit('wipe_remote_logs', { targetIp }); },
  editLog: (targetIp, logId, newText) => { get().socket?.emit('edit_log', { targetIp, logId, newText }); },
  discoverRandomIp: () => { get().socket?.emit('discover_random_ip'); },
  siphonVictimCrypto: (targetIp, address) => { get().socket?.emit('siphon_victim_crypto', { targetIp, address }); },
  siphonVictimAccount: (targetIp, accountNumber) => { get().socket?.emit('siphon_victim_account', { targetIp, accountNumber }); },
  adminGetUsers: () => { get().socket?.emit('admin_get_users'); },
  adminUpdatePlayer: (targetUserId, updates) => { get().socket?.emit('admin_update_player', { targetUserId, updates }); },
  adminResetPassword: (targetUserId, newPassword) => { get().socket?.emit('admin_reset_password', { targetUserId, newPassword }); },
  adminSetBan: (targetUserId, isBanned, reason) => { get().socket?.emit('admin_set_ban', { targetUserId, isBanned, reason }); },
  adminDeleteUser: (targetUserId) => { get().socket?.emit('admin_delete_user', { targetUserId }); },
  adminBroadcastNews: (headline, category) => { get().socket?.emit('admin_broadcast_news', { headline, category }); },
  adminResetServers: () => { get().socket?.emit('admin_reset_servers'); },

  executeTerminalCommand: (rawInput) => {
    const input = rawInput.trim();
    if (!input) return '';
    if (input === 'help') return 'Comandos: help, status, scan [IP], connect [IP], processes, whoami, clear, logout';
    if (input === 'clear') return '__CLEAR__';
    if (input === 'whoami') return get().currentUser ? `Usuário: ${get().currentUser?.username}` : 'Não autenticado';
    if (input === 'status') { const p = get().player; if (!p) return 'Player não carregado.'; return `IP: ${p.ip}\nRank: ${p.rank}\nCash: $${p.cash.toLocaleString()}\nReputação: ${p.reputation}`; }
    if (input === 'processes') return get().processes.length ? get().processes.map(p => `${p.id} | ${p.type} | ${Math.round(p.progress)}%`).join('\n') : 'Nenhum processo ativo.';
    if (input.startsWith('scan ')) { get().startProcess('scan', { targetIp: input.substring(5).trim() }); return 'Port scan iniciado...'; }
    if (input.startsWith('connect ')) { get().connectToTarget(input.substring(8).trim()); return 'Conectando...'; }
    if (input === 'logout') { get().logout(); return 'Sessão encerrada.'; }
    return `Comando desconhecido: ${input}`;
  }
}));
