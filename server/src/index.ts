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

// Register
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

// Login
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

  // Check ban status
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

// Get Current User / Verify session
app.get('/api/auth/me', verifyToken, (req: Request, res: Response) => {
  const decoded = (req as any).user;
  const player = gameWorld.getPlayer(decoded.userId);
  return res.json({
    user: { id: decoded.userId, username: decoded.username },
    player,
  });
});

// API status endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'online', db: 'sqlite', timestamp: Date.now() });
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

// Socket.io Game Events
io.on('connection', (socket) => {
  let currentUserId = 'user-zero-cool-1';

  // Extract token from handshake if present
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

  // Set session user
  socket.on('set_user_session', ({ userId }: { userId: string }) => {
    currentUserId = userId;
    sendInitState(currentUserId);
  });

  // Initial State
  sendInitState(currentUserId);

  // --- Proxy Chain ---
  socket.on('toggle_proxy_hop', ({ hopIp }: { hopIp: string }) => {
    const result = gameWorld.toggleProxyHop(currentUserId, hopIp);
    socket.emit('proxy_chain_updated', {
      ...result,
      player: gameWorld.getPlayer(currentUserId),
    });
  });

  socket.on('clear_proxy_chain', () => {
    const result = gameWorld.clearProxyChain(currentUserId);
    socket.emit('proxy_chain_updated', {
      ...result,
      player: gameWorld.getPlayer(currentUserId),
    });
  });

  // --- Cartel & Lockdown ---
  socket.on('trigger_cartel_jumpscare', () => {
    const player = gameWorld.getPlayer(currentUserId);
    const durationMs = 5 * 60 * 1000;
    player.lockdownUntil = Date.now() + durationMs;
    gameWorld.savePlayerState(currentUserId);

    socket.emit('cartel_jumpscare_event', {
      player,
      lockdownUntil: player.lockdownUntil,
      lockdownDurationSec: 300,
      message: 'O Cartel rastreou seu IP e mandou sicários até seu esconderijo!',
    });
  });

  socket.on('clear_lockdown', () => {
    const player = gameWorld.getPlayer(currentUserId);
    player.lockdownUntil = undefined;
    gameWorld.savePlayerState(currentUserId);
    socket.emit('lockdown_cleared', {
      player,
      message: 'A poeira baixou. O Cartel abandonou as buscas e você está livre!',
    });
  });

  // --- Defense, Antivirus & Honeypot ---
  socket.on('clean_infection', ({ infectionId }: { infectionId: string }) => {
    const result = gameWorld.cleanInfection(currentUserId, infectionId);
    socket.emit('infection_cleaned', {
      ...result,
      player: gameWorld.getPlayer(currentUserId),
    });
  });

  socket.on('toggle_honeypot', () => {
    const result = gameWorld.toggleHoneypot(currentUserId);
    socket.emit('honeypot_toggled', {
      ...result,
      player: gameWorld.getPlayer(currentUserId),
    });
  });

  socket.on('defend_npc_invasion', ({ method }: { method: 'firewall' | 'honeypot' | 'killswitch' }) => {
    const player = gameWorld.getPlayer(currentUserId);
    const result = gameWorld.defenseEngine.defendInvasion(player, method);
    gameWorld.savePlayerState(currentUserId);
    socket.emit('npc_invasion_action_result', {
      ...result,
      player: gameWorld.getPlayer(currentUserId),
    });
  });

  socket.on('trigger_npc_invasion', () => {
    const player = gameWorld.getPlayer(currentUserId);
    gameWorld.defenseEngine.triggerNpcInvasion(player);
  });

  // --- Police Raid & Warrants ---
  socket.on('defend_police_raid', ({ method }: { method: 'bribe' | 'purge_evidence' | 'blackout_jammer' }) => {
    const player = gameWorld.getPlayer(currentUserId);
    const result = gameWorld.contractsAndRaidEngine.defendPoliceRaid(player, method);
    gameWorld.savePlayerState(currentUserId);
    socket.emit('police_raid_defend_result', {
      ...result,
      player: gameWorld.getPlayer(currentUserId),
    });
  });

  socket.on('trigger_test_raid', () => {
    const player = gameWorld.getPlayer(currentUserId);
    gameWorld.contractsAndRaidEngine.triggerPoliceRaid(
      player,
      'FBI Cyber Division',
      'Mandado de Busca e Apreensão: Violação ao Servidor Central do FBI e Tentativa de Exfiltração de Arquivos Militares.'
    );
  });

  // --- Darknet Contracts ---
  socket.on('claim_darknet_contract', ({ contractId }: { contractId: string }) => {
    const player = gameWorld.getPlayer(currentUserId);
    const result = gameWorld.contractsAndRaidEngine.claimContract(player, contractId);
    if (result.success) {
      gameWorld.savePlayerState(currentUserId);
    }
    socket.emit('darknet_contract_claimed', {
      ...result,
      player: gameWorld.getPlayer(currentUserId),
      contracts: gameWorld.contractsAndRaidEngine.getContracts(),
    });
  });

  // --- Darknet Auctions ---
  socket.on('place_auction_bid', ({ auctionId, bidAmountUsd }: { auctionId: string; bidAmountUsd: number }) => {
    const player = gameWorld.getPlayer(currentUserId);
    const result = gameWorld.contractsAndRaidEngine.placeBid(player, auctionId, bidAmountUsd);
    if (result.success) {
      gameWorld.savePlayerState(currentUserId);
    }
    socket.emit('auction_bid_result', {
      ...result,
      player: gameWorld.getPlayer(currentUserId),
      auctions: gameWorld.contractsAndRaidEngine.getAuctions(),
    });
  });

  socket.on('buyout_auction', ({ auctionId }: { auctionId: string }) => {
    const player = gameWorld.getPlayer(currentUserId);
    const result = gameWorld.contractsAndRaidEngine.buyoutAuction(player, auctionId);
    if (result.success) {
      gameWorld.savePlayerState(currentUserId);
    }
    socket.emit('auction_buyout_result', {
      ...result,
      player: gameWorld.getPlayer(currentUserId),
      auctions: gameWorld.contractsAndRaidEngine.getAuctions(),
    });
  });

  // --- Clans & Territory Wars ---
  socket.on('create_clan', ({ name, tag, description }: { name: string; tag: string; description: string }) => {
    const player = gameWorld.getPlayer(currentUserId);
    if (player.cash < 5000) {
      socket.emit('clan_action_result', { success: false, message: 'Necessário $5.000 USD para fundar um novo clã!' });
      return;
    }
    const result = gameWorld.clanEngine.createClan(player.id, player.username, name, tag, description);
    if (result.success && result.clan) {
      player.cash -= 5000;
      player.clanId = result.clan.id;
      gameWorld.savePlayerState(currentUserId);
      gameWorld.addNews(`NOVO CLÃ FUNDADO: [${result.clan.tag}] ${result.clan.name} liderado por ${player.username}!`, 'CLAN');
    }
    socket.emit('clan_action_result', {
      ...result,
      player: gameWorld.getPlayer(currentUserId),
      clans: gameWorld.clanEngine.getClans(),
    });
  });

  socket.on('join_clan', ({ clanId }: { clanId: string }) => {
    const player = gameWorld.getPlayer(currentUserId);
    const result = gameWorld.clanEngine.joinClan(player.id, player.username, clanId);
    if (result.success) {
      player.clanId = clanId;
      gameWorld.savePlayerState(currentUserId);
    }
    socket.emit('clan_action_result', {
      ...result,
      player: gameWorld.getPlayer(currentUserId),
      clans: gameWorld.clanEngine.getClans(),
    });
  });

  socket.on('leave_clan', ({ clanId }: { clanId: string }) => {
    const player = gameWorld.getPlayer(currentUserId);
    const result = gameWorld.clanEngine.leaveClan(player.id, clanId);
    if (result.success) {
      player.clanId = undefined;
      gameWorld.savePlayerState(currentUserId);
    }
    socket.emit('clan_action_result', {
      ...result,
      player: gameWorld.getPlayer(currentUserId),
      clans: gameWorld.clanEngine.getClans(),
    });
  });

  socket.on('deposit_clan_vault', ({ clanId, amountUsd, amountBtc }: { clanId: string; amountUsd: number; amountBtc: number }) => {
    const player = gameWorld.getPlayer(currentUserId);
    if (player.cash < amountUsd || (player.cryptoWallet.btc || 0) < amountBtc) {
      socket.emit('clan_action_result', { success: false, message: 'Saldo insuficiente para doar ao cofre do clã.' });
      return;
    }
    player.cash -= amountUsd;
    player.cryptoWallet.btc = Number(((player.cryptoWallet.btc || 0) - amountBtc).toFixed(6));
    player.crypto = player.cryptoWallet.btc;
    const result = gameWorld.clanEngine.depositVault(clanId, amountUsd, amountBtc);
    gameWorld.savePlayerState(currentUserId);
    socket.emit('clan_action_result', {
      ...result,
      player: gameWorld.getPlayer(currentUserId),
      clans: gameWorld.clanEngine.getClans(),
    });
  });

  socket.on('attack_clan_territory', ({ clanId, nodeId }: { clanId: string; nodeId: string }) => {
    const player = gameWorld.getPlayer(currentUserId);
    const botnet = player.software.find(s => s.type === 'ddos');
    const attackPower = Math.round((botnet?.version || 1.0) * player.hardware.network.speedMbps * 12);

    const result = gameWorld.clanEngine.attackTerritoryNode(clanId, nodeId, attackPower);
    if (result.conquered) {
      gameWorld.addNews(`GUERRA DE CLÃS: O clã [${player.clanId}] conquistou o nó territorial!`, 'CLAN');
    }
    socket.emit('clan_action_result', {
      ...result,
      territoryNodes: gameWorld.clanEngine.getTerritoryNodes(),
      clans: gameWorld.clanEngine.getClans(),
    });
  });

  // --- Datacenter & VPS ---
  socket.on('rent_vps', ({ tier }: { tier: 'micro' | 'beast' | 'quantum' }) => {
    const player = gameWorld.getPlayer(currentUserId);
    const result = gameWorld.datacenterEngine.rentVps(player, tier);
    gameWorld.savePlayerState(currentUserId);
    socket.emit('vps_action_result', {
      ...result,
      player: gameWorld.getPlayer(currentUserId),
    });
  });

  socket.on('set_vps_module', ({ vpsId, moduleType }: { vpsId: string; moduleType: any }) => {
    const player = gameWorld.getPlayer(currentUserId);
    const result = gameWorld.datacenterEngine.setVpsModule(player, vpsId, moduleType);
    gameWorld.savePlayerState(currentUserId);
    socket.emit('vps_action_result', {
      ...result,
      player: gameWorld.getPlayer(currentUserId),
    });
  });

  socket.on('upgrade_vps_module', ({ vpsId }: { vpsId: string }) => {
    const player = gameWorld.getPlayer(currentUserId);
    const result = gameWorld.datacenterEngine.upgradeVpsModule(player, vpsId);
    gameWorld.savePlayerState(currentUserId);
    socket.emit('vps_action_result', {
      ...result,
      player: gameWorld.getPlayer(currentUserId),
    });
  });

  // --- Story Campaign & Factions ---
  socket.on('submit_story_choice', ({ chapterId, choiceId }: { chapterId: string; choiceId: string }) => {
    const result = gameWorld.submitStoryChoice(currentUserId, chapterId, choiceId);
    socket.emit('story_choice_result', {
      ...result,
      storyChapters: gameWorld.getStoryChapters(currentUserId),
      darkChatChannels: gameWorld.getDarkChatChannels(),
    });
  });

  socket.on('set_faction_alignment', ({ faction }: { faction: any }) => {
    const result = gameWorld.setFactionAlignment(currentUserId, faction);
    socket.emit('faction_alignment_result', {
      ...result,
      darkChatChannels: gameWorld.getDarkChatChannels(),
    });
  });

  // --- DarkIRC Encrypted Chat ---
  socket.on('send_dark_chat_message', ({ channelId, text }: { channelId: string; text: string }) => {
    const result = gameWorld.sendDarkChatMessage(currentUserId, channelId, text);
    socket.emit('dark_chat_message_sent', result);
    io.emit('dark_chat_message_received', {
      channelId,
      message: result.message,
      channels: gameWorld.getDarkChatChannels(),
    });
  });

  // --- Black Market Lootboxes ---
  socket.on('open_lootbox', ({ crateId, paymentMethod }: { crateId: string; paymentMethod: 'usd' | 'btc' }) => {
    const result = gameWorld.openLootbox(currentUserId, crateId, paymentMethod);
    socket.emit('lootbox_result', {
      ...result,
      player: gameWorld.getPlayer(currentUserId),
    });
  });

  // --- Multi-Crypto Trading ---
  socket.on('trade_crypto', ({
    coinId,
    action,
    usdAmount,
    coinAmount,
  }: {
    coinId: string;
    action: 'buy' | 'sell';
    usdAmount?: number;
    coinAmount?: number;
  }) => {
    const result = gameWorld.tradeCoin(currentUserId, coinId, action, usdAmount, coinAmount);
    socket.emit('crypto_result', {
      ...result,
      player: gameWorld.getPlayer(currentUserId),
      cryptoState: gameWorld.cryptoEngine.getState(),
    });
  });

  // Set Mining Target Coin
  socket.on('set_mining_coin', ({ coinId }: { coinId: string }) => {
    const result = gameWorld.setMiningTargetCoin(currentUserId, coinId);
    socket.emit('mining_coin_updated', {
      ...result,
      player: gameWorld.getPlayer(currentUserId),
    });
  });

  // Connect to target IP / Domain
  socket.on('connect_target', ({ ip }: { ip: string }) => {
    const result = gameWorld.connectToServer(currentUserId, ip);
    socket.emit('target_connected', {
      ...result,
      player: gameWorld.getPlayer(currentUserId),
    });
  });

  // Disconnect target
  socket.on('disconnect_target', () => {
    gameWorld.disconnectServer(currentUserId);
  });

  // Start background task
  socket.on('start_process', (data: {
    type: any;
    targetIp?: string;
    targetFileId?: string;
    targetFileName?: string;
    softwareId?: string;
    details?: any;
  }) => {
    const result = processEngine.startProcess(currentUserId, data.type, data);
    socket.emit('process_started', result);
  });

  // Cancel task
  socket.on('cancel_process', ({ processId }: { processId: string }) => {
    const success = processEngine.cancelProcess(processId, currentUserId);
    socket.emit('process_canceled', { success, processId });
  });

  // Bank Transfer
  socket.on('bank_transfer', ({
    sourceAcc,
    destAcc,
    amount,
    bankIp,
  }: {
    sourceAcc: string;
    destAcc: string;
    amount: number;
    bankIp: string;
  }) => {
    const result = gameWorld.bankTransfer(currentUserId, sourceAcc, destAcc, amount, bankIp);
    socket.emit('bank_result', {
      ...result,
      player: gameWorld.getPlayer(currentUserId),
      server: gameWorld.getServer(bankIp),
    });
  });

  // Hardware Upgrade
  socket.on('upgrade_hardware', ({ type }: { type: 'cpu' | 'gpu' | 'ram' | 'hdd' | 'network' | 'vpn' }) => {
    const result = gameWorld.upgradeHardware(currentUserId, type);
    socket.emit('hardware_result', {
      ...result,
      player: gameWorld.getPlayer(currentUserId),
    });
  });

  // Accept Mission
  socket.on('accept_mission', ({ missionId }: { missionId: string }) => {
    const mission = gameWorld.missionEngine.acceptMission(missionId);
    if (mission) {
      const player = gameWorld.getPlayer(currentUserId);
      if (!player.activeMissions.some(m => m.id === mission.id)) {
        player.activeMissions.push(mission);
        gameWorld.savePlayerState(currentUserId);
      }
      socket.emit('mission_accepted', {
        success: true,
        mission,
        player,
        missions: gameWorld.missionEngine.getAvailableMissions(),
      });
    }
  });

  // Claim Mission
  socket.on('claim_mission', ({ missionId }: { missionId: string }) => {
    const player = gameWorld.getPlayer(currentUserId);
    const activeIndex = player.activeMissions.findIndex(m => m.id === missionId);

    if (activeIndex !== -1) {
      const mission = player.activeMissions[activeIndex];
      let canComplete = false;

      if (mission.type === 'steal_file' && mission.requiredFileName) {
        canComplete = player.software.some(s => s.name === mission.requiredFileName);
      } else if (mission.type === 'wipe_server') {
        const targetServer = gameWorld.getServer(mission.targetIp);
        canComplete = targetServer ? targetServer.logs.length === 0 : false;
      } else if (mission.type === 'hack_bank') {
        const targetServer = gameWorld.getServer(mission.targetIp);
        canComplete = targetServer?.security.isBreached || false;
      } else {
        canComplete = true;
      }

      if (canComplete) {
        player.activeMissions.splice(activeIndex, 1);
        player.cash += mission.rewardCash;
        player.cryptoWallet.btc = Number(((player.cryptoWallet.btc || 0) + mission.rewardCrypto).toFixed(6));
        player.crypto = player.cryptoWallet.btc;
        player.reputation += mission.rewardRep;
        gameWorld.savePlayerState(currentUserId);

        gameWorld.missionEngine.completeMission(missionId);
        gameWorld.addNews(`Missão cumprida: "${mission.title}" concluída com sucesso por ${player.username}!`, 'SYSTEM');

        gameWorld.missionEngine.generateRandomMission();

        socket.emit('mission_claimed', {
          success: true,
          message: `Recompensa resgatada! +$${mission.rewardCash}, +${mission.rewardCrypto} BTC, +${mission.rewardRep} REP`,
          player: gameWorld.getPlayer(currentUserId),
          missions: gameWorld.missionEngine.getAvailableMissions(),
        });
      } else {
        socket.emit('mission_claimed', {
          success: false,
          message: 'Objetivos da missão ainda não foram atendidos!',
        });
      }
    }
  });

  // Delete local software
  socket.on('delete_local_software', ({ softwareId }: { softwareId: string }) => {
    const result = gameWorld.deleteLocalSoftware(currentUserId, softwareId);
    socket.emit('local_software_deleted', {
      ...result,
      player: gameWorld.getPlayer(currentUserId),
    });
  });

  // Delete remote file
  socket.on('delete_remote_file', ({ targetIp, fileId }: { targetIp: string; fileId: string }) => {
    const result = gameWorld.deleteRemoteFile(currentUserId, targetIp, fileId);
    socket.emit('file_operation_result', {
      ...result,
      server: gameWorld.getServer(targetIp),
    });
  });

  // Scan random procedural IP
  socket.on('discover_random_ip', () => {
    const newServer = gameWorld.generateProceduralServer(currentUserId);
    socket.emit('ip_discovered', {
      server: newServer,
      player: gameWorld.getPlayer(currentUserId),
      servers: gameWorld.getDiscoveredServers(currentUserId),
    });
  });

  // Siphon victim crypto discovered by spyware
  socket.on('siphon_victim_crypto', ({ targetIp, address }: { targetIp: string; address: string }) => {
    const result = gameWorld.siphonVictimCrypto(currentUserId, targetIp, address);
    socket.emit('victim_crypto_siphoned', {
      ...result,
      player: gameWorld.getPlayer(currentUserId),
      server: gameWorld.getServer(targetIp),
    });
    if (result.server) {
      io.emit('server_updated', result.server);
    }
  });

  // Siphon victim bank account discovered by spyware
  socket.on('siphon_victim_account', ({ targetIp, accountNumber }: { targetIp: string; accountNumber: string }) => {
    const result = gameWorld.siphonVictimAccount(currentUserId, targetIp, accountNumber);
    socket.emit('victim_account_siphoned', {
      ...result,
      player: gameWorld.getPlayer(currentUserId),
      server: gameWorld.getServer(targetIp),
    });
    if (result.server) {
      io.emit('server_updated', result.server);
    }
  });

  // ==========================================
  // --- Admin Access & Control Center ---
  // ==========================================

  // 1. Get all registered users from DB
  socket.on('admin_get_users', () => {
    const result = gameWorld.getAdminUsersList(currentUserId);
    socket.emit('admin_users_list', result);
  });

  // 2. Update user data (cash, crypto, rep, rank, role, etc.)
  socket.on('admin_update_player', ({ targetUserId, updates }: { targetUserId: string; updates: any }) => {
    const result = gameWorld.adminUpdatePlayer(currentUserId, targetUserId, updates);
    socket.emit('admin_action_result', result);
    if (result.success) {
      const refreshed = gameWorld.getAdminUsersList(currentUserId);
      socket.emit('admin_users_list', refreshed);
      if (result.player && targetUserId === currentUserId) {
        socket.emit('player_updated', result.player);
      }
    }
  });

  // 3. Reset user password
  socket.on('admin_reset_password', ({ targetUserId, newPassword }: { targetUserId: string; newPassword: string }) => {
    const result = gameWorld.adminResetUserPassword(currentUserId, targetUserId, newPassword);
    socket.emit('admin_action_result', result);
  });

  // 4. Ban / Unban user
  socket.on('admin_set_ban', ({ targetUserId, isBanned, reason }: { targetUserId: string; isBanned: boolean; reason?: string }) => {
    const result = gameWorld.adminSetUserBan(currentUserId, targetUserId, isBanned, reason);
    socket.emit('admin_action_result', result);
    if (result.success) {
      const refreshed = gameWorld.getAdminUsersList(currentUserId);
      socket.emit('admin_users_list', refreshed);
    }
  });

  // 5. Delete user
  socket.on('admin_delete_user', ({ targetUserId }: { targetUserId: string }) => {
    const result = gameWorld.adminDeleteUser(currentUserId, targetUserId);
    socket.emit('admin_action_result', result);
    if (result.success) {
      const refreshed = gameWorld.getAdminUsersList(currentUserId);
      socket.emit('admin_users_list', refreshed);
    }
  });

  // 6. Broadcast global breaking news
  socket.on('admin_broadcast_news', ({ headline, category }: { headline: string; category?: any }) => {
    if (!gameWorld.verifyIsAdmin(currentUserId)) {
      socket.emit('admin_action_result', { success: false, message: 'Acesso negado.' });
      return;
    }
    gameWorld.addNews(headline, category || 'SYSTEM');
    io.emit('news_updated', gameWorld.getNews());
    socket.emit('admin_action_result', { success: true, message: 'Transmissão global enviada a todos os jogadores!' });
  });

  // 7. Factory reset all servers
  socket.on('admin_reset_servers', () => {
    const result = gameWorld.adminResetWorldServers(currentUserId);
    socket.emit('admin_action_result', result);
    if (result.success) {
      io.emit('world_sync', {
        allServers: result.servers,
        news: gameWorld.getNews(),
      });
    }
  });

  socket.on('disconnect', () => {
    gameWorld.disconnectServer(currentUserId);
    gameWorld.savePlayerState(currentUserId);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`⚡ [Hacker Wars Server] Running on http://localhost:${PORT} with SQLite Database`);
});
