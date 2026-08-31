// @ts-nocheck
import express, { Request, Response } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { GameWorld } from './engine/GameWorld.js';
import { ProcessEngine } from './engine/ProcessEngine.js';
import { VPS_CATALOG } from './engine/DatacenterEngine.js';
import { initializeSupabaseDb, dbHelpers } from './database/supabase.js';

const JWT_SECRET = process.env.JWT_SECRET || 'hacker-wars-secret-key-2026';
const ADMIN_USERNAME = 'diegodev';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

const app = express();
app.use(cors());
app.use(express.json());

await initializeSupabaseDb();

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

const gameWorld = new GameWorld();
const processEngine = new ProcessEngine(gameWorld);
processEngine.setSocketServer(io);
gameWorld.defenseEngine.setSocketServer(io);
gameWorld.proxyTraceEngine.setSocketServer(io);
gameWorld.contractsAndRaidEngine.setSocketServer(io);

const verifyToken = (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Token não fornecido ou inválido' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; username: string; role?: string };
    (req as any).user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Sessão expirada ou inválida' });
  }
};

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (typeof username !== 'string' || typeof password !== 'string') return res.status(400).json({ error: 'Nome de usuário e senha são obrigatórios.' });
  const cleanUsername = username.trim().toLowerCase();
  if (cleanUsername.length < 3 || cleanUsername.length > 20) return res.status(400).json({ error: 'O nome de usuário deve ter entre 3 e 20 caracteres.' });
  if (password.length < 12) return res.status(400).json({ error: 'A senha deve ter pelo menos 12 caracteres.' });
  if (cleanUsername === ADMIN_USERNAME) return res.status(409).json({ error: 'Este nome de usuário é reservado.' });
  if (dbHelpers.getUserByUsername(cleanUsername)) return res.status(409).json({ error: 'Este nome de usuário já está em uso na rede.' });

  const hash = bcrypt.hashSync(password, 12);
  const { userId, player } = dbHelpers.createUser(cleanUsername, hash);
  const token = jwt.sign({ userId, username: cleanUsername, role: 'player' }, JWT_SECRET, { expiresIn: '30d' });
  gameWorld.addNews(`Novo hacker registrou-se na rede: ${cleanUsername} (${player.ip})`, 'SYSTEM');
  return res.json({ token, user: { id: userId, username: cleanUsername, role: 'player' }, player });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (typeof username !== 'string' || typeof password !== 'string') return res.status(400).json({ error: 'Informe usuário e senha.' });
  const cleanUsername = username.trim().toLowerCase();

  const user = dbHelpers.getUserByUsername(cleanUsername);
  if (!user) return res.status(401).json({ error: 'Credenciais inválidas.' });
  if (user.is_banned) return res.status(403).json({ error: `CONTA BANIDA: ${user.ban_reason || 'Violação das regras do jogo.'}` });

  const passwordMatches = cleanUsername === ADMIN_USERNAME && ADMIN_PASSWORD
    ? password === ADMIN_PASSWORD
    : bcrypt.compareSync(password, user.password_hash);

  if (!passwordMatches) return res.status(401).json({ error: 'Credenciais inválidas.' });

  const player = gameWorld.getPlayer(user.id);
  player.role = cleanUsername === ADMIN_USERNAME ? 'admin' : (user.role || 'player');
  player.isBanned = false;
  const token = jwt.sign({ userId: user.id, username: user.username, role: player.role }, JWT_SECRET, { expiresIn: '30d' });
  return res.json({ token, user: { id: user.id, username: user.username, role: player.role }, player });
});

app.get('/api/auth/me', verifyToken, (req: Request, res: Response) => {
  const decoded = (req as any).user;
  const player = gameWorld.getPlayer(decoded.userId);
  return res.json({ user: { id: decoded.userId, username: decoded.username, role: player.role }, player });
});

app.get('/api/health', (_req, res) => res.json({ status: 'online', db: 'supabase', timestamp: Date.now() }));

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

io.on('connection', (socket) => {
  const currentUserId = socket.data?.user?.userId || '';
  if (!currentUserId) return socket.disconnect(true);

  const sendInitState = (userId: string) => {
    socket.emit('init_state', {
      player: gameWorld.getPlayer(userId),
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

  socket.join(currentUserId);

  socket.on('set_user_session', ({ userId }: { userId: string }) => {
    if (userId !== currentUserId) return;
    socket.join(currentUserId);
    sendInitState(currentUserId);
  });
  sendInitState(currentUserId);

  socket.on('upgrade_hardware', ({ type }) => {
    const allowed = new Set(['cpu', 'gpu', 'ram', 'hdd', 'network', 'vpn', 'cooling']);
    if (typeof type !== 'string' || !allowed.has(type)) return socket.emit('hardware_result', { success: false, message: 'Tipo de hardware inválido.' });
    const result = gameWorld.upgradeHardware(currentUserId, type);
    if (result.success) gameWorld.savePlayerState(currentUserId);
    socket.emit('hardware_result', { ...result, player: gameWorld.getPlayer(currentUserId) });
  });

  socket.on('toggle_proxy_hop', ({ hopIp }) => {
    const result = gameWorld.toggleProxyHop(currentUserId, hopIp);
    socket.emit('proxy_chain_updated', { ...result, player: gameWorld.getPlayer(currentUserId) });
  });
  socket.on('clear_proxy_chain', () => {
    const result = gameWorld.clearProxyChain(currentUserId);
    socket.emit('proxy_chain_updated', { ...result, player: gameWorld.getPlayer(currentUserId) });
  });

  socket.on('trigger_cartel_jumpscare', () => {
    const player = gameWorld.getPlayer(currentUserId);
    player.lockdownUntil = Date.now() + 5 * 60 * 1000;
    gameWorld.savePlayerState(currentUserId);
    socket.emit('cartel_jumpscare_event', { player, lockdownUntil: player.lockdownUntil, lockdownDurationSec: 300, message: 'O Cartel rastreou seu IP e mandou sicários até seu esconderijo!' });
  });
  socket.on('clear_lockdown', () => {
    const player = gameWorld.getPlayer(currentUserId);
    player.lockdownUntil = undefined;
    gameWorld.savePlayerState(currentUserId);
    socket.emit('lockdown_cleared', { player, message: 'A poeira baixou. O Cartel abandonou as buscas e você está livre!' });
  });

  socket.on('clean_infection', ({ infectionId }) => {
    const result = gameWorld.cleanInfection(currentUserId, infectionId);
    socket.emit('infection_cleaned', { ...result, player: gameWorld.getPlayer(currentUserId) });
  });
  socket.on('toggle_honeypot', () => {
    const result = gameWorld.toggleHoneypot(currentUserId);
    socket.emit('honeypot_toggled', { ...result, player: gameWorld.getPlayer(currentUserId) });
  });
  socket.on('defend_npc_invasion', ({ method }) => {
    const player = gameWorld.getPlayer(currentUserId);
    const result = gameWorld.defenseEngine.defendInvasion(player, method);
    gameWorld.savePlayerState(currentUserId);
    socket.emit('npc_invasion_action_result', { ...result, player: gameWorld.getPlayer(currentUserId) });
  });
  socket.on('trigger_npc_invasion', () => gameWorld.defenseEngine.triggerNpcInvasion(gameWorld.getPlayer(currentUserId)));

  socket.on('defend_police_raid', ({ method }) => {
    const player = gameWorld.getPlayer(currentUserId);
    const result = gameWorld.contractsAndRaidEngine.defendPoliceRaid(player, method);
    gameWorld.savePlayerState(currentUserId);
    socket.emit('police_raid_defend_result', { ...result, player: gameWorld.getPlayer(currentUserId) });
  });
  socket.on('trigger_test_raid', () => gameWorld.contractsAndRaidEngine.triggerPoliceRaid(gameWorld.getPlayer(currentUserId), 'FBI Cyber Division', 'Mandado de Busca e Apreensão: Violação ao Servidor Central do FBI e Tentativa de Exfiltração de Arquivos Militares.'));

  socket.on('claim_darknet_contract', ({ contractId }) => {
    const player = gameWorld.getPlayer(currentUserId);
    const result = gameWorld.contractsAndRaidEngine.claimContract(player, contractId);
    if (result.success) gameWorld.savePlayerState(currentUserId);
    socket.emit('darknet_contract_claimed', { ...result, player: gameWorld.getPlayer(currentUserId), contracts: gameWorld.contractsAndRaidEngine.getContracts() });
  });
  socket.on('place_auction_bid', ({ auctionId, bidAmountUsd }) => {
    const player = gameWorld.getPlayer(currentUserId);
    const result = gameWorld.contractsAndRaidEngine.placeBid(player, auctionId, bidAmountUsd);
    if (result.success) gameWorld.savePlayerState(currentUserId);
    socket.emit('auction_bid_result', { ...result, player: gameWorld.getPlayer(currentUserId), auctions: gameWorld.contractsAndRaidEngine.getAuctions() });
  });
  socket.on('buyout_auction', ({ auctionId }) => {
    const player = gameWorld.getPlayer(currentUserId);
    const result = gameWorld.contractsAndRaidEngine.buyoutAuction(player, auctionId);
    if (result.success) gameWorld.savePlayerState(currentUserId);
    socket.emit('auction_buyout_result', { ...result, player: gameWorld.getPlayer(currentUserId), auctions: gameWorld.contractsAndRaidEngine.getAuctions() });
  });

  socket.on('create_clan', ({ name, tag, description }) => {
    const player = gameWorld.getPlayer(currentUserId);
    if (player.clanId) return socket.emit('clan_action_result', { success: false, message: 'Você já pertence a um clã.' });
    if (typeof name !== 'string' || typeof tag !== 'string' || typeof description !== 'string' || name.trim().length < 3 || name.length > 40 || tag.trim().length < 2) return socket.emit('clan_action_result', { success: false, message: 'Dados do clã inválidos.' });
    if (player.cash < 5000) return socket.emit('clan_action_result', { success: false, message: 'Necessário $5.000 USD para fundar um novo clã!' });
    const result = gameWorld.clanEngine.createClan(player.id, player.username, name, tag, description);
    if (result.success && result.clan) {
      player.cash -= 5000;
      player.clanId = result.clan.id;
      gameWorld.savePlayerState(currentUserId);
      gameWorld.addNews(`NOVO CLÃ FUNDADO: [${result.clan.tag}] ${result.clan.name} liderado por ${player.username}!`, 'CLAN');
    }
    socket.emit('clan_action_result', { ...result, player: gameWorld.getPlayer(currentUserId), clans: gameWorld.clanEngine.getClans() });
  });
  socket.on('join_clan', ({ clanId }) => {
    const player = gameWorld.getPlayer(currentUserId);
    if (player.clanId && player.clanId !== clanId) return socket.emit('clan_action_result', { success: false, message: 'Você já pertence a outro clã.' });
    const result = gameWorld.clanEngine.joinClan(player.id, player.username, clanId);
    if (result.success) { player.clanId = clanId; gameWorld.savePlayerState(currentUserId); }
    socket.emit('clan_action_result', { ...result, player: gameWorld.getPlayer(currentUserId), clans: gameWorld.clanEngine.getClans() });
  });
  socket.on('leave_clan', ({ clanId }) => {
    const player = gameWorld.getPlayer(currentUserId);
    if (player.clanId !== clanId) return socket.emit('clan_action_result', { success: false, message: 'Você não pertence a este clã.' });
    const result = gameWorld.clanEngine.leaveClan(player.id, clanId);
    if (result.success) { player.clanId = undefined; gameWorld.savePlayerState(currentUserId); }
    socket.emit('clan_action_result', { ...result, player: gameWorld.getPlayer(currentUserId), clans: gameWorld.clanEngine.getClans() });
  });
  socket.on('deposit_clan_vault', ({ clanId, amountUsd, amountBtc }) => {
    const player = gameWorld.getPlayer(currentUserId);
    if (player.clanId !== clanId || !Number.isFinite(amountUsd) || !Number.isFinite(amountBtc) || amountUsd < 0 || amountBtc < 0 || player.cash < amountUsd || (player.cryptoWallet.btc || 0) < amountBtc) return socket.emit('clan_action_result', { success: false, message: 'Depósito inválido, clã incorreto ou saldo insuficiente.' });
    const result = gameWorld.clanEngine.depositVault(clanId, amountUsd, amountBtc);
    if (!result.success) return socket.emit('clan_action_result', { ...result, player });
    player.cash -= amountUsd;
    player.cryptoWallet.btc = Number(((player.cryptoWallet.btc || 0) - amountBtc).toFixed(6));
    player.crypto = player.cryptoWallet.btc;
    gameWorld.savePlayerState(currentUserId);
    socket.emit('clan_action_result', { ...result, player: gameWorld.getPlayer(currentUserId), clans: gameWorld.clanEngine.getClans() });
  });
  socket.on('attack_clan_territory', ({ clanId, nodeId }) => {
    const player = gameWorld.getPlayer(currentUserId);
    if (player.clanId !== clanId) return socket.emit('clan_action_result', { success: false, message: 'Você só pode atacar em nome do seu próprio clã.' });
    const botnet = player.software.find(s => s.type === 'ddos');
    const attackPower = Math.round((botnet?.version || 1) * player.hardware.network.speedMbps * 12);
    const result = gameWorld.clanEngine.attackTerritoryNode(clanId, nodeId, attackPower);
    if (result.conquered) gameWorld.addNews(`GUERRA DE CLÃS: O clã [${player.clanId}] conquistou o nó territorial!`, 'CLAN');
    gameWorld.savePlayerState(currentUserId);
    socket.emit('clan_action_result', { ...result, player: gameWorld.getPlayer(currentUserId), territoryNodes: gameWorld.clanEngine.getTerritoryNodes(), clans: gameWorld.clanEngine.getClans() });
  });

  socket.on('rent_vps', ({ tier }) => {
    const player = gameWorld.getPlayer(currentUserId);
    const result = gameWorld.datacenterEngine.rentVps(player, tier);
    if (result.success) gameWorld.savePlayerState(currentUserId);
    socket.emit('vps_action_result', { ...result, player: gameWorld.getPlayer(currentUserId) });
  });
  socket.on('set_vps_module', ({ vpsId, moduleType }) => {
    const player = gameWorld.getPlayer(currentUserId);
    const result = gameWorld.datacenterEngine.setModule(player, vpsId, moduleType);
    if (result.success) gameWorld.savePlayerState(currentUserId);
    socket.emit('vps_action_result', { ...result, player: gameWorld.getPlayer(currentUserId) });
  });
  socket.on('upgrade_vps_module', ({ vpsId }) => {
    const player = gameWorld.getPlayer(currentUserId);
    const result = gameWorld.datacenterEngine.upgradeModule(player, vpsId);
    if (result.success) gameWorld.savePlayerState(currentUserId);
    socket.emit('vps_action_result', { ...result, player: gameWorld.getPlayer(currentUserId) });
  });

  socket.on('submit_story_choice', ({ chapterId, choiceId }) => {
    const result = gameWorld.submitStoryChoice(currentUserId, chapterId, choiceId);
    if (result.success) gameWorld.savePlayerState(currentUserId);
    socket.emit('story_choice_result', { ...result, player: gameWorld.getPlayer(currentUserId), storyChapters: gameWorld.getStoryChapters(currentUserId), darkChatChannels: gameWorld.getDarkChatChannels() });
  });
  socket.on('set_faction_alignment', ({ faction }) => {
    const result = gameWorld.setFactionAlignment(currentUserId, faction);
    if (result.success) gameWorld.savePlayerState(currentUserId);
    socket.emit('faction_alignment_result', { ...result, player: gameWorld.getPlayer(currentUserId), darkChatChannels: gameWorld.getDarkChatChannels() });
  });

  socket.on('send_dark_chat_message', ({ channelId, text }) => {
    const result = gameWorld.sendDarkChatMessage(currentUserId, channelId, text);
    socket.emit('dark_chat_message_sent', { ...result, channels: gameWorld.getDarkChatChannels() });
    if (result.success) {
      socket.broadcast.emit('dark_chat_message_received', { message: result.message, channels: gameWorld.getDarkChatChannels() });
    }
  });

  socket.on('open_lootbox', ({ crateId, paymentMethod }) => {
    const result = gameWorld.openLootbox(currentUserId, crateId, paymentMethod);
    if (result.success) gameWorld.savePlayerState(currentUserId);
    socket.emit('lootbox_result', { ...result, player: gameWorld.getPlayer(currentUserId) });
  });
  socket.on('trade_crypto', ({ coinId, action, usdAmount, coinAmount }) => {
    const result = gameWorld.tradeCoin(currentUserId, coinId, action, usdAmount, coinAmount);
    if (result.success) gameWorld.savePlayerState(currentUserId);
    socket.emit('crypto_result', { ...result, player: gameWorld.getPlayer(currentUserId), cryptoState: gameWorld.cryptoEngine.getState() });
  });
  socket.on('set_mining_coin', ({ coinId }) => {
    const result = gameWorld.setMiningCoin(currentUserId, coinId);
    if (result.success) gameWorld.savePlayerState(currentUserId);
    socket.emit('mining_coin_updated', { ...result, player: gameWorld.getPlayer(currentUserId) });
  });

  socket.on('start_process', (payload: any) => {
    if (!payload || typeof payload !== 'object') return socket.emit('process_started', { success: false, message: 'Dados do processo inválidos.' });
    const type = payload.type;
    const params = payload.params && typeof payload.params === 'object'
      ? payload.params
      : (({ type: _t, ...rest }) => rest)(payload);
    const result = processEngine.startProcess(currentUserId, type, params || {});
    socket.emit('process_started', result);
  });
  socket.on('cancel_process', ({ processId }) => {
    const result = processEngine.cancelProcess(processId, currentUserId);
    socket.emit('process_cancelled', { success: result });
  });

  socket.on('accept_mission', ({ missionId }) => {
    const result = gameWorld.missionEngine.acceptMission(gameWorld.getPlayer(currentUserId), missionId);
    if (result.success) gameWorld.savePlayerState(currentUserId);
    socket.emit('mission_accepted', { ...result, player: gameWorld.getPlayer(currentUserId), missions: gameWorld.missionEngine.getPlayerMissions(currentUserId) });
  });
  socket.on('claim_mission', ({ missionId }) => {
    const result = gameWorld.missionEngine.claimMission(gameWorld.getPlayer(currentUserId), missionId);
    if (result.success) gameWorld.savePlayerState(currentUserId);
    socket.emit('mission_claimed', { ...result, player: gameWorld.getPlayer(currentUserId), missions: gameWorld.missionEngine.getPlayerMissions(currentUserId) });
  });

  socket.on('delete_local_software', ({ softwareId }) => {
    const result = gameWorld.deleteLocalSoftware(currentUserId, softwareId);
    socket.emit('local_software_deleted', { ...result, player: gameWorld.getPlayer(currentUserId) });
  });
  socket.on('delete_remote_file', ({ targetIp, fileId }) => {
    const result = gameWorld.deleteRemoteFile(currentUserId, targetIp, fileId);
    socket.emit('file_operation_result', { ...result, server: gameWorld.getServer(targetIp) });
  });
  socket.on('wipe_remote_logs', ({ targetIp }) => {
    const result = gameWorld.wipeRemoteLogs(currentUserId, targetIp);
    socket.emit('file_operation_result', { ...result, server: gameWorld.getServer(targetIp) });
  });
  socket.on('edit_log', ({ targetIp, logId, newText }) => {
    const result = gameWorld.editLog(currentUserId, targetIp, logId, newText);
    socket.emit('log_edit_result', { ...result, server: gameWorld.getServer(targetIp) });
  });
  socket.on('discover_random_ip', () => {
    const result = gameWorld.discoverRandomIp(currentUserId);
    socket.emit('ip_discovered', { ...result, player: gameWorld.getPlayer(currentUserId) });
  });
  socket.on('siphon_victim_crypto', ({ targetIp, address }) => {
    const result = gameWorld.siphonVictimCrypto(currentUserId, targetIp, address);
    socket.emit('bank_result', { ...result, player: gameWorld.getPlayer(currentUserId), server: gameWorld.getServer(targetIp) });
  });
  socket.on('siphon_victim_account', ({ targetIp, accountNumber }) => {
    const result = gameWorld.siphonVictimAccount(currentUserId, targetIp, accountNumber);
    socket.emit('bank_result', { ...result, player: gameWorld.getPlayer(currentUserId), server: gameWorld.getServer(targetIp) });
  });
  socket.on('bank_transfer', ({ sourceAcc, destAcc, amount, bankIp }) => {
    const result = gameWorld.bankTransfer(currentUserId, sourceAcc, destAcc, amount, bankIp);
    socket.emit('bank_result', { ...result, player: gameWorld.getPlayer(currentUserId), server: gameWorld.getServer(bankIp) });
  });
  socket.on('connect_target', ({ ip }) => {
    const result = gameWorld.connectToServer(currentUserId, ip);
    socket.emit('target_connected', { ...result, player: gameWorld.getPlayer(currentUserId), traceState: gameWorld.proxyTraceEngine.getTraceState(currentUserId) });
  });
  socket.on('disconnect_target', () => {
    socket.emit('target_disconnected', { success: true });
  });

  socket.on('admin_get_users', () => {
    if (!gameWorld.verifyIsAdmin(currentUserId)) return socket.emit('admin_users_list', { success: false, message: 'Acesso negado.' });
    socket.emit('admin_users_list', { success: true, users: dbHelpers.getAllUsersForAdmin() });
  });
  socket.on('admin_update_player', ({ targetUserId, updates }) => {
    if (!gameWorld.verifyIsAdmin(currentUserId)) return socket.emit('admin_action_result', { success: false, message: 'Acesso negado.' });
    const result = gameWorld.adminUpdatePlayer(currentUserId, targetUserId, updates);
    socket.emit('admin_action_result', { ...result, targetPlayer: result.player });
  });
  socket.on('admin_reset_password', ({ targetUserId, newPassword }) => {
    if (!gameWorld.verifyIsAdmin(currentUserId)) return socket.emit('admin_action_result', { success: false, message: 'Acesso negado.' });
    const result = gameWorld.adminResetPassword(currentUserId, targetUserId, newPassword);
    socket.emit('admin_action_result', result);
  });
  socket.on('admin_set_ban', ({ targetUserId, isBanned, reason }) => {
    if (!gameWorld.verifyIsAdmin(currentUserId)) return socket.emit('admin_action_result', { success: false, message: 'Acesso negado.' });
    const result = gameWorld.adminSetBan(currentUserId, targetUserId, isBanned, reason);
    socket.emit('admin_action_result', result);
  });
  socket.on('admin_delete_user', ({ targetUserId }) => {
    if (!gameWorld.verifyIsAdmin(currentUserId)) return socket.emit('admin_action_result', { success: false, message: 'Acesso negado.' });
    const result = gameWorld.adminDeleteUser(currentUserId, targetUserId);
    socket.emit('admin_action_result', result);
  });
  socket.on('admin_broadcast_news', ({ headline, category }) => {
    if (!gameWorld.verifyIsAdmin(currentUserId)) return socket.emit('admin_action_result', { success: false, message: 'Acesso negado.' });
    gameWorld.addNews(headline, category || 'SYSTEM');
    socket.emit('admin_action_result', { success: true, message: 'Notícia publicada.' });
  });
  socket.on('admin_reset_servers', () => {
    if (!gameWorld.verifyIsAdmin(currentUserId)) return socket.emit('admin_action_result', { success: false, message: 'Acesso negado.' });
    const result = dbHelpers.resetAllServers();
    socket.emit('admin_action_result', { success: true, message: 'Servidores resetados.' });
  });
});

export { app, server, io, gameWorld, processEngine };
