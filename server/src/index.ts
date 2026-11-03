import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { GameWorld } from './engine/GameWorld.js';
import { ProcessEngine } from './engine/ProcessEngine.js';
import { initializeSupabaseDb } from './database/supabase.js';
import { createAuthRouter } from './routes/authRoutes.js';
import { createHealthRouter } from './routes/healthRoutes.js';
import { createShopRouter, createStripeWebhookRouter } from './routes/shopRoutes.js';
import { setupSocketListeners } from './sockets/index.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be configured and contain at least 32 characters.');
}

const app = express();
app.use(cors());

await initializeSupabaseDb();

const gameWorld = new GameWorld();

// The Stripe webhook needs the raw body, so it goes before the JSON parser.
app.use('/api/shop/webhook', createStripeWebhookRouter(gameWorld));
app.use(express.json());
const processEngine = new ProcessEngine(gameWorld);

app.use('/api/auth', createAuthRouter(gameWorld));
app.use('/api/health', createHealthRouter());
app.use('/api/shop', createShopRouter(gameWorld));

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

processEngine.setSocketServer(io);
gameWorld.defenseEngine.setSocketServer(io);
gameWorld.proxyTraceEngine.setSocketServer(io);
gameWorld.contractsAndRaidEngine.setSocketServer(io);

setupSocketListeners(io, gameWorld, processEngine);

export { app, server, io, gameWorld, processEngine };
