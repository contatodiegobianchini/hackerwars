import { createClient, SupabaseClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { Player, VirtualServer, GlobalNewsItem, AdminUserData } from '../types/game.js';
import { INITIAL_SERVERS, INITIAL_PLAYER, INITIAL_NEWS } from './defaultData.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured.');
}

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type UserRow = {
  id: string;
  username: string;
  password_hash: string;
  created_at: string;
  role: 'admin' | 'player';
  is_banned: boolean;
  ban_reason: string | null;
};

type PlayerRow = { id: string; user_id: string; data: Player; updated_at: string };
type ServerRow = { id: string; ip: string; data: VirtualServer; updated_at: string };
type NewsRow = { id: string; headline: string; category: string; timestamp: number };

const users = new Map<string, UserRow>();
const players = new Map<string, Player>();
const servers = new Map<string, VirtualServer>();
const news = new Map<string, GlobalNewsItem>();

const write = (promise: PromiseLike<unknown>) => {
  void Promise.resolve(promise).catch((error) => console.error('[Supabase write]', error));
};

const buildPlayer = (userId: string, username: string): Player => {
  const now = Date.now();
  const randomIp = `192.168.${Math.floor(Math.random() * 200 + 1)}.${Math.floor(Math.random() * 250 + 2)}`;
  return {
    ...JSON.parse(JSON.stringify(INITIAL_PLAYER)),
    id: uuidv4(),
    username,
    ip: randomIp,
    bankAccounts: [{
      accountNumber: `ACC-${Math.floor(Math.random() * 899999 + 100000)}`,
      bankIp: '64.233.160.1',
      bankName: 'Ironclad Credit',
      balance: 1250,
      password: `pin_${Math.floor(Math.random() * 9000 + 1000)}`,
      ownerName: username,
    }],
    logs: [{
      id: `log-init-${uuidv4().substring(0, 8)}`,
      timestamp: now,
      formattedTime: new Date(now).toLocaleTimeString(),
      ip: '127.0.0.1',
      action: `Conta de rede criada para ${username} (${randomIp}). VPN anônima ativada.`,
      isSelf: true,
    }],
  };
};

export async function initializeSupabaseDb(): Promise<void> {
  const [userResult, playerResult, serverResult, newsResult] = await Promise.all([
    supabase.from('game_users').select('*'),
    supabase.from('players').select('*'),
    supabase.from('game_servers').select('*'),
    supabase.from('game_news').select('*'),
  ]);

  for (const error of [userResult.error, playerResult.error, serverResult.error, newsResult.error]) {
    if (error) throw new Error(`Supabase initialization failed: ${error.message}`);
  }

  for (const row of (userResult.data ?? []) as UserRow[]) users.set(row.id, row);
  for (const row of (playerResult.data ?? []) as PlayerRow[]) players.set(row.user_id, row.data);
  for (const row of (serverResult.data ?? []) as ServerRow[]) servers.set(row.ip, row.data);
  for (const row of (newsResult.data ?? []) as NewsRow[]) news.set(row.id, row as GlobalNewsItem);

  if (servers.size === 0) {
    for (const server of INITIAL_SERVERS) {
      servers.set(server.ip, server);
      write(supabase.from('game_servers').upsert({ id: server.id, ip: server.ip, data: server, updated_at: new Date().toISOString() }));
    }
  }

  if (news.size === 0) {
    for (const item of INITIAL_NEWS) {
      news.set(item.id, item);
      write(supabase.from('game_news').upsert({ id: item.id, headline: item.headline, category: item.category, timestamp: item.timestamp }));
    }
  }

  const adminUsername = 'Diegodev';
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || adminPassword.length < 20) {
    throw new Error('ADMIN_PASSWORD must be configured and contain at least 20 characters.');
  }

  const existingAdmin = Array.from(users.values()).find(u => u.username.toLowerCase() === adminUsername.toLowerCase());
  const hash = bcrypt.hashSync(adminPassword, 12);
  const adminId = existingAdmin?.id ?? uuidv4();
  const admin: UserRow = {
    id: adminId,
    username: adminUsername,
    password_hash: hash,
    created_at: existingAdmin?.created_at ?? new Date().toISOString(),
    role: 'admin',
    is_banned: false,
    ban_reason: null,
  };

  for (const user of users.values()) {
    if (user.id !== adminId && user.role === 'admin') {
      user.role = 'player';
      write(supabase.from('game_users').update({ role: 'player', updated_at: new Date().toISOString() }).eq('id', user.id));
    }
  }
  users.set(adminId, admin);
  write(supabase.from('game_users').upsert(admin));

  if (!players.has(adminId)) {
    const player = buildPlayer(adminId, adminUsername);
    player.role = 'admin';
    players.set(adminId, player);
    write(supabase.from('players').upsert({ id: player.id, user_id: adminId, data: player, updated_at: new Date().toISOString() }, { onConflict: 'user_id' }));
  }

  const legacy = Array.from(users.values()).filter(u => u.username.toLowerCase() === 'zero_cool');
  for (const user of legacy) {
    users.delete(user.id);
    players.delete(user.id);
    write(supabase.from('players').delete().eq('user_id', user.id));
    write(supabase.from('game_users').delete().eq('id', user.id));
  }
}

export const dbHelpers = {
  initDefaultData: () => undefined,

  createUser: (username: string, passwordHash: string): { userId: string; player: Player } => {
    const userId = uuidv4();
    const now = new Date().toISOString();
    const row: UserRow = { id: userId, username, password_hash: passwordHash, created_at: now, role: 'player', is_banned: false, ban_reason: null };
    const player = buildPlayer(userId, username);
    users.set(userId, row);
    players.set(userId, player);
    write(supabase.from('game_users').insert(row));
    write(supabase.from('players').insert({ id: player.id, user_id: userId, data: player, updated_at: now }));
    return { userId, player };
  },

  getUserByUsername: (username: string): UserRow | undefined =>
    Array.from(users.values()).find(u => u.username.toLowerCase() === username.toLowerCase()),

  getUserById: (userId: string): UserRow | undefined => users.get(userId),

  getPlayerByUserId: (userId: string): Player | null => players.get(userId) ?? null,

  savePlayer: (userId: string, player: Player) => {
    players.set(userId, player);
    write(supabase.from('players').upsert({ id: player.id, user_id: userId, data: player, updated_at: new Date().toISOString() }, { onConflict: 'user_id' }));
  },

  getAllServers: (): VirtualServer[] => Array.from(servers.values()),

  saveServer: (server: VirtualServer) => {
    servers.set(server.ip, server);
    write(supabase.from('game_servers').upsert({ id: server.id, ip: server.ip, data: server, updated_at: new Date().toISOString() }, { onConflict: 'ip' }));
  },

  getNews: (): GlobalNewsItem[] => Array.from(news.values()).sort((a, b) => b.timestamp - a.timestamp).slice(0, 25),

  addNews: (headline: string, category: GlobalNewsItem['category']) => {
    const item = { id: `news-${Date.now()}-${uuidv4().substring(0, 6)}`, headline, category, timestamp: Date.now() };
    news.set(item.id, item);
    write(supabase.from('game_news').insert(item));
  },

  getAllUsersForAdmin: (): AdminUserData[] => Array.from(users.values()).map(user => {
    const pData = players.get(user.id) ?? ({} as Player);
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      isBanned: user.is_banned || !!pData.isBanned,
      banReason: user.ban_reason || pData.banReason || '',
      createdAt: new Date(user.created_at).getTime(),
      ip: pData.ip || '0.0.0.0',
      cash: pData.cash || 0,
      cryptoBtc: pData.cryptoWallet?.btc ?? pData.crypto ?? 0,
      cryptoWallet: pData.cryptoWallet || { btc: 0, eth: 0, doge: 0, shdw: 0, pepe: 0 },
      reputation: pData.reputation || 0,
      rank: pData.rank || 'Iniciante',
      completedChaptersCount: pData.completedStoryChapters?.length || 0,
      isOnline: false,
    };
  }),

  updateUserPassword: (userId: string, newPlainPassword: string): boolean => {
    const user = users.get(userId);
    if (!user) return false;
    const minimum = user.username.toLowerCase() === 'diegodev' ? 20 : 12;
    if (newPlainPassword.length < minimum) return false;
    const hash = bcrypt.hashSync(newPlainPassword, 12);
    user.password_hash = hash;
    write(supabase.from('game_users').update({ password_hash: hash, updated_at: new Date().toISOString() }).eq('id', userId));
    return true;
  },

  setUserBanStatus: (userId: string, isBanned: boolean, reason?: string): boolean => {
    const user = users.get(userId);
    if (!user) return false;
    if (user.username.toLowerCase() === 'diegodev') return false;
    user.is_banned = isBanned;
    user.ban_reason = reason || null;
    write(supabase.from('game_users').update({ is_banned: isBanned, ban_reason: reason || null, updated_at: new Date().toISOString() }).eq('id', userId));
    return true;
  },

  updateUserRole: (userId: string, role: 'admin' | 'player'): boolean => {
    const user = users.get(userId);
    if (!user) return false;
    const safeRole = role === 'admin' && user.username.toLowerCase() !== 'diegodev' ? 'player' : role;
    user.role = safeRole;
    write(supabase.from('game_users').update({ role: safeRole, updated_at: new Date().toISOString() }).eq('id', userId));
    const player = players.get(userId);
    if (player) {
      player.role = safeRole;
      write(supabase.from('players').upsert({ id: player.id, user_id: userId, data: player, updated_at: new Date().toISOString() }, { onConflict: 'user_id' }));
    }
    return true;
  },

  deleteUser: (userId: string): boolean => {
    const user = users.get(userId);
    if (!user || user.username.toLowerCase() === 'diegodev') return false;
    users.delete(userId);
    players.delete(userId);
    write(supabase.from('game_users').delete().eq('id', userId));
    return true;
  },

  resetAllServers: () => {
    servers.clear();
    for (const server of INITIAL_SERVERS) servers.set(server.ip, server);
    write(supabase.from('game_servers').delete().neq('id', ''));
    for (const server of INITIAL_SERVERS) write(supabase.from('game_servers').insert({ id: server.id, ip: server.ip, data: server, updated_at: new Date().toISOString() }));
  },
};

export const db = {
  prepare: () => ({
    get: () => undefined,
    run: () => ({ changes: 0 }),
  }),
};
