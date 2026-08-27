import express, { Request, Response } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { GameWorld } from './engine/GameWorld.js';
import { ProcessEngine } from './engine/ProcessEngine.js';
import { VPS_CATALOG } from './engine/DatacenterEngine.js';
import { db, dbHelpers } from './database/sqlite.js';

const JWT_SECRET = process.env.JWT_SECRET || 'hacker-wars-secret-key-2026';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const gameWorld = new GameWorld();
const processEngine = new ProcessEngine(gameWorld);
processEngine.setSocketServer(io);
gameWorld.defenseEngine.setSocketServer(io);
gameWorld.proxyTraceEngine.setSocketServer(io);

// JWT Middleware helper
const verifyToken = (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido ou inválido' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; username: string };
    (req as any).user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Sessão expirada ou inválida' });
  }
};

// --- Auth Endpoints ---
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Nome de usuário e senha são obrigatórios.' });
  }

  const cleanUsername = username.trim().toLowerCase();
  if (cleanUsername.length < 3 || cleanUsername.length > 20) {
    return res.status(400).json({ error: 'O nome de usuário deve ter entre 3 e 20 caracteres.' });
  }

  if (password.length < 4) {
    return res.status(400).json({ error: 'A senha deve ter pelo menos 4 caracteres.' });
  }

  const existing = dbHelpers.getUserByUsername(cleanUsername);
  if (existing) {
    return res.status(409).json({ error: 'Este nome de usuário já está em uso na rede.' });
  }

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);
  const { userId, player } = dbHelpers.createUser(cleanUsername, hash);

  const token = jwt.sign({ userId, username: cleanUsername }, JWT_SECRET, { expiresIn: '30d' });

  gameWorld.addNews(`Novo hacker registrou-se na rede: ${cleanUsername} (${player.ip})`, 'SYSTEM');

  return res.json({
    token,
    user: { id: userId, username: cleanUsername },
    player,
  });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Informe usuário e senha.' });
  }

  const cleanUsername = username.trim().toLowerCase();
  const user = dbHelpers.getUserByUsername(cleanUsername);

  if (!user) {
    return res.status(401).json({ error: 'Credenciais inválidas. Usuário não encontrado.' });
  }

  const userRow = db.prepare('SELECT is_banned, ban_reason, role FROM users WHERE id = ?').get(user.id) as any;
  if (userRow && userRow.is_banned === 1) {
    return res.status(403).json({
      error: `CONTA BANIDA: ${userRow.ban_reason || 'Violação das regras do jogo e diretrizes da rede.'}`
    });
  }

  const isValid = bcrypt.compareSync(password, user.password_hash);
  if (!isValid) {
    return res.status(401).json({ error: 'Senha incorreta.' });
  }

  const player = gameWorld.getPlayer(user.id);
  if (userRow) {
    player.role = userRow.role || 'player';
    player.isBanned = false;
  }
  const token = jwt.sign({ userId: user.id, username: user.username, role: player.role }, JWT_SECRET, { expiresIn: '30d' });

  return res.json({
    token,
    user: { id: user.id, username: user.username, role: player.role },
    player,
  });
});

app.get('/api/auth/me', verifyToken, (req: Request, res: Response) => {
  const decoded = (req as any).user;
  const player = gameWorld.getPlayer(decoded.userId);
  return res.json({
    user: { id: decoded.userId, username: decoded.username },
    player,
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'online', db: 'supabase', timestamp: Date.now() });
});

// Periodic world sync broadcast
setInterval(() => {
  io.emit('world_sync', {
    cryptoState: gameWorld.cryptoEngine.getState(),
    clans: gameWorld.clanEngine.getClans(),
    territoryNodes: gameWorld.clanEngine.getTerritoryNodes(),
    contracts: gameWorld.contractsAndRaidEngine.getContracts(),
    auctions: gameWorld.contractsAndRaidEngine.getAuctions(),
    news: gameWorld.getNews(),
  });
}, 3000);

gameWorld.defenseEngine.setSocketServer(io);
gameWorld.proxyTraceEngine.setSocketServer(io);
gameWorld.contractsAndRaidEngine.setSocketServer(io);

io.on('connection', (socket) => {
  let currentUserId = 'user-zero-cool-1';

  const handshakeToken = socket.handshake.auth?.token;
  if (handshakeToken) {
    try {
      const decoded = jwt.verify(handshakeToken, JWT_SECRET) as { userId: string; username: string };
      currentUserId = decoded.userId;
    } catch {}
  }

  const sendInitState = (userId: string) => {
    const player = gameWorld.getPlayer(userId);
    socket.emit('init_state', {
      player,
      servers: gameWorld.getDiscoveredServers(userId),
      allServers: gameWorld.getAllServers(),
      missions: gameWorld.missionEngine.getAvailableMissions(),
      cryptoState: gameWorld.cryptoEngine.getState(),
      crates: gameWorld.blackMarketEngine.getCrates(),
      clans: gameWorld.clanEngine.getClans(),
      territoryNodes: gameWorld.clanEngine.getTerritoryNodes(),
      contracts: gameWorld.contractsAndRaidEngine.getContracts(),
      auctions: gameWorld.contractsAndRaidEngine.getAuctions(),
      activeRaid: gameWorld.contractsAndRaidEngine.getActiveRaid(userId),
      vpsCatalog: VPS_CATALOG,
      storyChapters: gameWorld.getStoryChapters(userId),
      darkChatChannels: gameWorld.getDarkChatChannels(),
      activeTrace: gameWorld.proxyTraceEngine.getTraceState(userId),
      news: gameWorld.getNews(),
      processes: processEngine.getActiveProcesses(userId),
    });
  };

  socket.on('set_user_session', ({ userId }: { userId: string }) => {
    currentUserId = userId;
    sendInitState(currentUserId);
  });

  sendInitState(currentUserId);

  // ... existing Socket.IO game event handlers remain unchanged ...
});

export { app, server, io };
