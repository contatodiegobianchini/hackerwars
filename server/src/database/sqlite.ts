import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { Player, VirtualServer, GlobalNewsItem, AdminUserData } from '../types/game.js';
import { INITIAL_SERVERS, INITIAL_PLAYER, INITIAL_NEWS } from './defaultData.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const DB_DIR = path.resolve(process.cwd(), 'server', 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const dbPath = path.join(DB_DIR, 'game.db');
export const db = new Database(dbPath);

// Enable WAL mode for high performance
db.pragma('journal_mode = WAL');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    role TEXT DEFAULT 'player',
    is_banned INTEGER DEFAULT 0,
    ban_reason TEXT
  );

  CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    data TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS servers (
    id TEXT PRIMARY KEY,
    ip TEXT UNIQUE NOT NULL,
    data TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS news (
    id TEXT PRIMARY KEY,
    headline TEXT NOT NULL,
    category TEXT NOT NULL,
    timestamp INTEGER NOT NULL
  );
`);

// Safe migrations for existing databases
try {
  db.exec(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'player'`);
} catch {}
try {
  db.exec(`ALTER TABLE users ADD COLUMN is_banned INTEGER DEFAULT 0`);
} catch {}
try {
  db.exec(`ALTER TABLE users ADD COLUMN ban_reason TEXT`);
} catch {}

// Helper functions for Users and Players
export const dbHelpers = {
  // Create default admin / demo user if not exists
  initDefaultData: () => {
    // 1. Seed demo user "zero_cool" / "password123"
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get('zero_cool') as any;
    if (!existingUser) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync('password123', salt);
      const userId = 'user-zero-cool-1';
      const now = Date.now();

      db.prepare('INSERT INTO users (id, username, password_hash, created_at, role) VALUES (?, ?, ?, ?, ?)').run(
        userId,
        'zero_cool',
        hash,
        now,
        'admin'
      );

      const demoPlayer: Player = {
        ...INITIAL_PLAYER,
        id: `player-${userId}`,
        username: 'zero_cool',
        role: 'admin',
      };

      db.prepare('INSERT INTO players (id, user_id, data, updated_at) VALUES (?, ?, ?, ?)').run(
        demoPlayer.id,
        userId,
        JSON.stringify(demoPlayer),
        now
      );
    } else {
      // Ensure existing zero_cool user has admin role
      db.prepare("UPDATE users SET role = 'admin' WHERE username = 'zero_cool'").run();
    }

    // 2. Seed default servers if table is empty
    const countServers = db.prepare('SELECT COUNT(*) as count FROM servers').get() as { count: number };
    if (countServers.count === 0) {
      const insertServerStmt = db.prepare('INSERT INTO servers (id, ip, data, updated_at) VALUES (?, ?, ?, ?)');
      INITIAL_SERVERS.forEach(srv => {
        insertServerStmt.run(srv.id, srv.ip, JSON.stringify(srv), Date.now());
      });
    }

    // 3. Seed default news
    const countNews = db.prepare('SELECT COUNT(*) as count FROM news').get() as { count: number };
    if (countNews.count === 0) {
      const insertNewsStmt = db.prepare('INSERT INTO news (id, headline, category, timestamp) VALUES (?, ?, ?, ?)');
      INITIAL_NEWS.forEach(n => {
        insertNewsStmt.run(n.id, n.headline, n.category, n.timestamp);
      });
    }
  },

  createUser: (username: string, passwordHash: string): { userId: string; player: Player } => {
    const userId = `user-${uuidv4().substring(0, 8)}`;
    const playerId = `player-${userId}`;
    const now = Date.now();

    // Assign dynamic IP for new player
    const randomIp = `192.168.${Math.floor(Math.random() * 200 + 1)}.${Math.floor(Math.random() * 250 + 2)}`;

    const newPlayer: Player = {
      ...JSON.parse(JSON.stringify(INITIAL_PLAYER)),
      id: playerId,
      username: username,
      ip: randomIp,
      bankAccounts: [
        {
          accountNumber: `ACC-${Math.floor(Math.random() * 899999 + 100000)}`,
          bankIp: '64.233.160.1',
          bankName: 'Ironclad Credit',
          balance: 1250,
          password: `pin_${Math.floor(Math.random() * 9000 + 1000)}`,
          ownerName: username,
        }
      ],
      logs: [
        {
          id: `log-init-${uuidv4().substring(0, 8)}`,
          timestamp: now,
          formattedTime: new Date(now).toLocaleTimeString(),
          ip: '127.0.0.1',
          action: `Conta de rede criada para ${username} (${randomIp}). VPN anônima ativada.`,
          isSelf: true,
        }
      ]
    };

    const insertUser = db.prepare('INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)');
    const insertPlayer = db.prepare('INSERT INTO players (id, user_id, data, updated_at) VALUES (?, ?, ?, ?)');

    const transaction = db.transaction(() => {
      insertUser.run(userId, username, passwordHash, now);
      insertPlayer.run(playerId, userId, JSON.stringify(newPlayer), now);
    });

    transaction();

    return { userId, player: newPlayer };
  },

  getUserByUsername: (username: string): { id: string; username: string; password_hash: string; created_at: number } | undefined => {
    return db.prepare('SELECT id, username, password_hash, created_at FROM users WHERE username = ?').get(username) as any;
  },

  getUserById: (userId: string): { id: string; username: string; created_at: number } | undefined => {
    return db.prepare('SELECT id, username, created_at FROM users WHERE id = ?').get(userId) as any;
  },

  getPlayerByUserId: (userId: string): Player | null => {
    const row = db.prepare('SELECT data FROM players WHERE user_id = ?').get(userId) as { data: string } | undefined;
    if (!row) return null;
    try {
      return JSON.parse(row.data);
    } catch {
      return null;
    }
  },

  savePlayer: (userId: string, player: Player) => {
    const now = Date.now();
    db.prepare('UPDATE players SET data = ?, updated_at = ? WHERE user_id = ?').run(
      JSON.stringify(player),
      now,
      userId
    );
  },

  getAllServers: (): VirtualServer[] => {
    const rows = db.prepare('SELECT data FROM servers').all() as { data: string }[];
    return rows.map(r => JSON.parse(r.data));
  },

  saveServer: (server: VirtualServer) => {
    const now = Date.now();
    const existing = db.prepare('SELECT id FROM servers WHERE ip = ?').get(server.ip);
    if (existing) {
      db.prepare('UPDATE servers SET data = ?, updated_at = ? WHERE ip = ?').run(
        JSON.stringify(server),
        now,
        server.ip
      );
    } else {
      db.prepare('INSERT INTO servers (id, ip, data, updated_at) VALUES (?, ?, ?, ?)').run(
        server.id,
        server.ip,
        JSON.stringify(server),
        now
      );
    }
  },

  getNews: (): GlobalNewsItem[] => {
    const rows = db.prepare('SELECT * FROM news ORDER BY timestamp DESC LIMIT 25').all() as any[];
    return rows.map(r => ({
      id: r.id,
      headline: r.headline,
      category: r.category,
      timestamp: r.timestamp,
    }));
  },

  addNews: (headline: string, category: GlobalNewsItem['category']) => {
    const id = `news-${Date.now()}`;
    const timestamp = Date.now();
    db.prepare('INSERT INTO news (id, headline, category, timestamp) VALUES (?, ?, ?, ?)').run(
      id,
      headline,
      category,
      timestamp
    );
  },

  // --- Admin Database Management ---
  getAllUsersForAdmin: (): AdminUserData[] => {
    const rows = db.prepare(`
      SELECT
        u.id,
        u.username,
        COALESCE(u.role, 'player') as role,
        COALESCE(u.is_banned, 0) as is_banned,
        u.ban_reason,
        u.created_at,
        p.data as player_data
      FROM users u
      LEFT JOIN players p ON u.id = p.user_id
      ORDER BY u.created_at DESC
    `).all() as any[];

    return rows.map(r => {
      let pData: any = {};
      try {
        pData = JSON.parse(r.player_data || '{}');
      } catch {}

      return {
        id: r.id,
        username: r.username,
        role: (r.role || 'player') as 'admin' | 'player',
        isBanned: r.is_banned === 1 || !!pData.isBanned,
        banReason: r.ban_reason || pData.banReason || '',
        createdAt: r.created_at,
        ip: pData.ip || '0.0.0.0',
        cash: pData.cash || 0,
        cryptoBtc: pData.cryptoWallet?.btc ?? pData.crypto ?? 0,
        cryptoWallet: pData.cryptoWallet || { btc: 0, eth: 0, doge: 0, shdw: 0, pepe: 0 },
        reputation: pData.reputation || 0,
        rank: pData.rank || 'Iniciante',
        completedChaptersCount: pData.completedStoryChapters?.length || 0,
        isOnline: false,
      };
    });
  },

  updateUserPassword: (userId: string, newPlainPassword: string): boolean => {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(newPlainPassword, salt);
    const res = db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, userId);
    return res.changes > 0;
  },

  setUserBanStatus: (userId: string, isBanned: boolean, reason?: string): boolean => {
    const res = db.prepare('UPDATE users SET is_banned = ?, ban_reason = ? WHERE id = ?').run(
      isBanned ? 1 : 0,
      reason || null,
      userId
    );
    const playerRow = db.prepare('SELECT data FROM players WHERE user_id = ?').get(userId) as any;
    if (playerRow) {
      try {
        const p = JSON.parse(playerRow.data);
        p.isBanned = isBanned;
        p.banReason = reason || '';
        db.prepare('UPDATE players SET data = ? WHERE user_id = ?').run(JSON.stringify(p), userId);
      } catch {}
    }
    return res.changes > 0;
  },

  updateUserRole: (userId: string, role: 'admin' | 'player'): boolean => {
    const res = db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, userId);
    const playerRow = db.prepare('SELECT data FROM players WHERE user_id = ?').get(userId) as any;
    if (playerRow) {
      try {
        const p = JSON.parse(playerRow.data);
        p.role = role;
        db.prepare('UPDATE players SET data = ? WHERE user_id = ?').run(JSON.stringify(p), userId);
      } catch {}
    }
    return res.changes > 0;
  },

  deleteUser: (userId: string): boolean => {
    db.prepare('DELETE FROM players WHERE user_id = ?').run(userId);
    const res = db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    return res.changes > 0;
  },

  resetAllServers: () => {
    db.prepare('DELETE FROM servers').run();
    const insertServerStmt = db.prepare('INSERT INTO servers (id, ip, data, updated_at) VALUES (?, ?, ?, ?)');
    INITIAL_SERVERS.forEach(srv => {
      insertServerStmt.run(srv.id, srv.ip, JSON.stringify(srv), Date.now());
    });
  }
};

// Initialize DB schema & seeds
dbHelpers.initDefaultData();
