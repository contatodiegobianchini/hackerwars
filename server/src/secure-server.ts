import express from 'express';
import jwt from 'jsonwebtoken';
import { Server as SocketIOServer, Socket } from 'socket.io';
import bcrypt from 'bcryptjs';
import { createRequire } from 'node:module';
import { db, dbHelpers } from './database/sqlite.js';
import { GameWorld } from './engine/GameWorld.js';

const require = createRequire(import.meta.url);
const httpModule = require('node:http');

let capturedServer: any = null;
const originalCreateServer = httpModule.createServer;

httpModule.createServer = function hardenedCreateServer(...args: any[]) {
  capturedServer = originalCreateServer.apply(this, args);
  return capturedServer;
};

type AuthClaims = {
  userId: string;
  username: string;
  role?: 'admin' | 'player';
};

const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_USERNAME = 'Diegodev';
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN?.trim();
const ALLOWED_ORIGINS = new Set(
  [FRONTEND_ORIGIN, 'https://hackerwars.vercel.app', 'http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173']
    .filter((origin): origin is string => Boolean(origin))
);

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
    if (!decoded || typeof decoded.userId !== 'string' || typeof decoded.username !== 'string') return null;
    const user = dbHelpers.getUserById(decoded.userId);
    if (!user || user.username.toLowerCase() !== decoded.username.toLowerCase()) return null;
    return decoded;
  } catch {
    return null;
  }
};

const originAllowed = (origin?: string): boolean => {
  if (!origin) return true;
  return ALLOWED_ORIGINS.has(origin);
};

const corsPath = require.resolve('cors');
const originalCors = require(corsPath);
const hardenedCors = (options: any = {}) => originalCors({
  ...options,
  origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
    callback(null, originAllowed(origin));
  },
});
const corsModule = require.cache[corsPath];
if (corsModule) corsModule.exports = hardenedCors;

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

  // Enforce HTTPS only after TLS is terminated upstream (Render/Vercel proxy).
  if (req.get('x-forwarded-proto') === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000');
  }

  const isAuthEndpoint = req.path === '/api/auth/login' || req.path === '/api/auth/register';
  if (isAuthEndpoint) {
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
    if (req.path === '/api/auth/login') {
      const originalJson = res.json.bind(res);
      res.json = (body: any) => res.statusCode === 401
        ? originalJson({ error: 'Credenciais inválidas.' })
        : originalJson(body);
    }
  }

  if (req.method === 'OPTIONS') {
    const origin = req.headers.origin as string | undefined;
    if (originAllowed(origin)) {
      if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Max-Age', '600');
    }
    return res.sendStatus(originAllowed(origin) ? 204 : 403);
  }
  next();
};
