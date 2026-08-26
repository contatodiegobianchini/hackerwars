import express from 'express';
import jwt from 'jsonwebtoken';
import { Server as SocketIOServer, Socket } from 'socket.io';
import bcrypt from 'bcryptjs';
import { db, dbHelpers } from './database/sqlite.js';
import { GameWorld } from './engine/GameWorld.js';

type AuthClaims = {
  userId: string;
  username: string;
  role?: 'admin' | 'player';
};

const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_USERNAME = 'Diegodev';

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be configured and contain at least 32 characters.');
}

if (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 20) {
  throw new Error('ADMIN_PASSWORD must be configured and contain at least 20 characters.');
}

const verifyJwt = (token: unknown): AuthClaims | null => {
  if (typeof token !== 'string' || token.length < 20) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as AuthClaims;
    if (!decoded || typeof decoded.userId !== 'string' || typeof decoded.username !== 'string') {
      return null;
    }

    const user = dbHelpers.getUserById(decoded.userId);
    if (!user || user.username.toLowerCase() !== decoded.username.toLowerCase()) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
};

// Harden Express before the application creates routes.
const expressAny = express as any;
const originalUse = expressAny.application.use;
let securityMiddlewareInstalled = false;

const rateState = new Map<string, { windowStart: number; count: number }>();
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 12;

const securityMiddleware = (req: any, res: any, next: any) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  if (req.path === '/api/auth/login' || req.path === '/api/auth/register') {
    const now = Date.now();
    const key = `${req.ip}:${req.path}`;
    const current = rateState.get(key);

    if (!current || now - current.windowStart >= RATE_WINDOW_MS) {
      rateState.set(key, { windowStart: now, count: 1 });
    } else {
      current.count += 1;
      if (current.count > RATE_LIMIT) {
        res.setHeader('Retry-After', '60');
        return res.status(429).json({ error: 'Muitas tentativas. Aguarde um minuto e tente novamente.' });
      }
    }
  }

  next();
};

expressAny.application.use = function patchedUse(this: any, ...args: any[]) {
  if (!securityMiddlewareInstalled) {
    securityMiddlewareInstalled = true;
    originalUse.call(this, securityMiddleware);
  }

  return originalUse.apply(this, args);
};

const originalJson = expressAny.json;
expressAny.json = (options: any = {}) => originalJson({ limit: '100kb', ...options });

// Harden Socket.IO before index.ts registers its connection handler.
const socketServerAny = SocketIOServer as any;
const originalServerOn = socketServerAny.prototype.on;
socketServerAny.prototype.on = function patchedServerOn(this: any, event: string, listener: (...args: any[]) => void) {
  if (event !== 'connection') {
    return originalServerOn.call(this, event, listener);
  }

  const securedListener = (socket: Socket, ...args: any[]) => {
    const claims = verifyJwt(socket.handshake.auth?.token);
    if (!claims) {
      socket.emit('auth_error', { message: 'Autenticação do socket inválida.' });
      socket.disconnect(true);
      return;
    }

    socket.data.user = claims;
    return listener(socket, ...args);
  };

  return originalServerOn.call(this, event, securedListener);
};

const socketPrototypeAny = Socket.prototype as any;
const originalSocketOn = socketPrototypeAny.on;
socketPrototypeAny.on = function patchedSocketOn(this: any, event: string, listener: (...args: any[]) => void) {
  // The server must derive identity from the verified JWT, never from client input.
  if (event === 'set_user_session') {
    return this;
  }

  return originalSocketOn.call(this, event, listener);
};

// Patch admin authorization to be DB-backed and exclusive to Diegodev.
GameWorld.prototype.verifyIsAdmin = function secureVerifyIsAdmin(adminUserId: string): boolean {
  const user = dbHelpers.getUserById(adminUserId);
  if (!user) return false;
  const row = db.prepare('SELECT role FROM users WHERE id = ?').get(adminUserId) as { role?: string } | undefined;
  return user.username.toLowerCase() === ADMIN_USERNAME.toLowerCase() && row?.role === 'admin';
};

// Prevent the existing admin panel from promoting anyone other than Diegodev.
const originalUpdateUserRole = dbHelpers.updateUserRole;
dbHelpers.updateUserRole = (userId: string, role: 'admin' | 'player'): boolean => {
  const user = dbHelpers.getUserById(userId);
  if (!user) return false;
  const safeRole = role === 'admin' && user.username.toLowerCase() !== ADMIN_USERNAME.toLowerCase()
    ? 'player'
    : role;
  return originalUpdateUserRole(userId, safeRole);
};

// Normalize the database to exactly one administrator before index.ts starts.
db.prepare("UPDATE users SET role = 'player'").run();
const existingAdmin = dbHelpers.getUserByUsername(ADMIN_USERNAME);

if (existingAdmin) {
  const hash = bcrypt.hashSync(ADMIN_PASSWORD, 12);
  db.prepare("UPDATE users SET password_hash = ?, role = 'admin', is_banned = 0, ban_reason = NULL WHERE id = ?").run(hash, existingAdmin.id);
  db.prepare("UPDATE players SET data = json_set(data, '$.username', ?, '$.role', 'admin', '$.isBanned', false), updated_at = ? WHERE user_id = ?").run(ADMIN_USERNAME, Date.now(), existingAdmin.id);
} else {
  const { userId } = dbHelpers.createUser(ADMIN_USERNAME, bcrypt.hashSync(ADMIN_PASSWORD, 12));
  db.prepare("UPDATE users SET role = 'admin', is_banned = 0, ban_reason = NULL WHERE id = ?").run(userId);
  db.prepare("UPDATE players SET data = json_set(data, '$.username', ?, '$.role', 'admin', '$.isBanned', false), updated_at = ? WHERE user_id = ?").run(ADMIN_USERNAME, Date.now(), userId);
}

// Disable the legacy demo administrator entirely.
db.prepare("DELETE FROM users WHERE lower(username) = 'zero_cool'").run();

await import('./index.js');
