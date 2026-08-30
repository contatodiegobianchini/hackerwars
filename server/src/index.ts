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

const app = express();
app.use(cors());
app.use(express.json());

// The GameWorld reads players/servers from the Supabase-backed caches in its constructor.
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
  if (!bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({ error: 'Credenciais inválidas.' });

  const player = gameWorld.getPlayer(user.id);
  player.role = user.role || 'player';
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

// --- Socket.IO Game Events ---
io.on('connection', (socket) => {
  const currentUserId = socket.data?.user?.userId || 'user-zero-cool-1';

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

  socket.on('set_user_session', ({ userId }: { userId: string }) => {
    if (userId !== currentUserId) return;
    sendInitState(currentUserId);
  });
  sendInitState(currentUserId);

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
    if (!['mining_rig', 'phishing_honeypot', 'botnet_amplifier'].includes(moduleType)) return socket.emit('vps_action_result', { success: false, message: 'Módulo VPS inválido.', player });
    const result = gameWorld.datacenterEngine.setVpsModule(player, vpsId, moduleType);
    if (result.success) gameWorld.savePlayerState(currentUserId);
    socket.emit('vps_action_result', { ...result, player: gameWorld.getPlayer(currentUserId) });
  });
  socket.on('upgrade_vps_module', ({ vpsId }) => {
    const player = gameWorld.getPlayer(currentUserId);
    const result = gameWorld.datacenterEngine.upgradeVpsModule(player, vpsId);
    if (result.success) gameWorld.savePlayerState(currentUserId);
    socket.emit('vps_action_result', { ...result, player: gameWorld.getPlayer(currentUserId) });
  });

  socket.on('submit_story_choice', ({ chapterId, choiceId }) => {
    const result = gameWorld.submitStoryChoice(currentUserId, chapterId, choiceId);
    socket.emit('story_choice_result', { ...result, storyChapters: gameWorld.getStoryChapters(currentUserId), darkChatChannels: gameWorld.getDarkChatChannels() });
  });
  socket.on('set_faction_alignment', ({ faction }) => {
    const allowed = new Set(['anonymous', 'russian_bears', 'cartel', 'lone_wolf']);
    if (!allowed.has(faction)) return socket.emit('faction_alignment_result', { success: false, message: 'Facção inválida.' });
    const result = gameWorld.setFactionAlignment(currentUserId, faction);
    socket.emit('faction_alignment_result', { ...result, darkChatChannels: gameWorld.getDarkChatChannels() });
  });
  socket.on('send_dark_chat_message', ({ channelId, text }) => {
    if (typeof channelId !== 'string' || typeof text !== 'string' || text.length > 2000) return socket.emit('dark_chat_message_sent', { success: false, message: 'Mensagem inválida.' });
    const result = gameWorld.sendDarkChatMessage(currentUserId, channelId, text);
    socket.emit('dark_chat_message_sent', result);
    io.emit('dark_chat_message_received', { channelId, message: result.message, channels: gameWorld.getDarkChatChannels() });
  });

  socket.on('open_lootbox', ({ crateId, paymentMethod }) => {
    if (!['usd', 'btc'].includes(paymentMethod)) return socket.emit('lootbox_result', { success: false, message: 'Método de pagamento inválido.' });
    const result = gameWorld.openLootbox(currentUserId, crateId, paymentMethod);
    socket.emit('lootbox_result', { ...result, player: gameWorld.getPlayer(currentUserId) });
  });
  socket.on('trade_crypto', ({ coinId, action, usdAmount, coinAmount }) => {
    if (!['buy', 'sell'].includes(action) || !Number.isFinite(usdAmount) && action === 'buy' || !Number.isFinite(coinAmount) && action === 'sell') return socket.emit('crypto_result', { success: false, message: 'Valores de negociação inválidos.' });
    const result = gameWorld.tradeCoin(currentUserId, coinId, action, usdAmount, coinAmount);
    socket.emit('crypto_result', { ...result, player: gameWorld.getPlayer(currentUserId), cryptoState: gameWorld.cryptoEngine.getState() });
  });
  socket.on('set_mining_coin', ({ coinId }) => {
    const result = gameWorld.setMiningTargetCoin(currentUserId, coinId);
    socket.emit('mining_coin_updated', { ...result, player: gameWorld.getPlayer(currentUserId) });
  });

  socket.on('connect_target', ({ ip }) => {
    const result = gameWorld.connectToServer(currentUserId, ip);
    socket.emit('target_connected', { ...result, player: gameWorld.getPlayer(currentUserId) });
  });
  socket.on('disconnect_target', () => gameWorld.disconnectServer(currentUserId));
  socket.on('start_process', (data) => {
    if (!data || typeof data.type !== 'string') return socket.emit('process_started', { success: false, message: 'Tipo de processo inválido.' });
    const result = processEngine.startProcess(currentUserId, data.type, { targetIp: data.targetIp, targetFileId: data.targetFileId, targetFileName: data.targetFileName, softwareId: data.softwareId, details: data.details });
    socket.emit('process_started', result);
  });
  socket.on('cancel_process', ({ processId }) => socket.emit('process_canceled', { success: processEngine.cancelProcess(processId, currentUserId), processId }));
  socket.on('bank_transfer', ({ sourceAcc, destAcc, amount, bankIp }) => {
    if (!Number.isFinite(amount) || amount <= 0) return socket.emit('bank_result', { success: false, message: 'Valor de transferência inválido.' });
    const result = gameWorld.bankTransfer(currentUserId, sourceAcc, destAcc, amount, bankIp);
    socket.emit('bank_result', { ...result, player: gameWorld.getPlayer(currentUserId), server: gameWorld.getServer(bankIp) });
  });
  socket.on('upgrade_hardware', ({ type }) => {
    if (!['cpu','gpu','ram','hdd','network','vpn','cooling'].includes(type)) return socket.emit('hardware_result', { success: false, message: 'Tipo de upgrade inválido.' });
    const result = gameWorld.upgradeHardware(currentUserId, type);
    socket.emit('hardware_result', { ...result, player: gameWorld.getPlayer(currentUserId) });
  });
  socket.on('accept_mission', ({ missionId }) => {
    const mission = gameWorld.missionEngine.acceptMission(missionId);
    if (!mission) return socket.emit('mission_accepted', { success: false, message: 'Missão indisponível.' });
    const player = gameWorld.getPlayer(currentUserId);
    if (!player.activeMissions.some(m => m.id === mission.id)) { player.activeMissions.push(mission); gameWorld.savePlayerState(currentUserId); }
    socket.emit('mission_accepted', { success: true, mission, player, missions: gameWorld.missionEngine.getAvailableMissions() });
  });
  socket.on('claim_mission', ({ missionId }) => {
    const player = gameWorld.getPlayer(currentUserId);
    const idx = player.activeMissions.findIndex(m => m.id === missionId);
    if (idx === -1) return socket.emit('mission_claimed', { success: false, message: 'Missão não encontrada entre as ativas.' });
    const mission = player.activeMissions[idx];
    let canComplete = true;
    if (mission.type === 'steal_file' && mission.requiredFileName) canComplete = player.software.some(s => s.name === mission.requiredFileName);
    else if (mission.type === 'wipe_server') canComplete = (gameWorld.getServer(mission.targetIp)?.logs.length ?? 1) === 0;
    else if (mission.type === 'hack_bank') canComplete = !!gameWorld.getServer(mission.targetIp)?.security.isBreached;
    if (!canComplete) return socket.emit('mission_claimed', { success: false, message: 'Objetivos da missão ainda não foram atendidos!' });
    player.activeMissions.splice(idx, 1);
    player.cash += mission.rewardCash;
    player.cryptoWallet.btc = Number(((player.cryptoWallet.btc || 0) + mission.rewardCrypto).toFixed(6));
    player.crypto = player.cryptoWallet.btc;
    player.reputation += mission.rewardRep;
    gameWorld.savePlayerState(currentUserId);
    gameWorld.missionEngine.completeMission(missionId);
    gameWorld.addNews(`Missão cumprida: "${mission.title}" concluída com sucesso por ${player.username}!`, 'SYSTEM');
    gameWorld.missionEngine.generateRandomMission();
    socket.emit('mission_claimed', { success: true, message: `Recompensa resgatada! +$${mission.rewardCash}, +${mission.rewardCrypto} BTC, +${mission.rewardRep} REP`, player: gameWorld.getPlayer(currentUserId), missions: gameWorld.missionEngine.getAvailableMissions() });
  });
  socket.on('delete_local_software', ({ softwareId }) => {
    const result = gameWorld.deleteLocalSoftware(currentUserId, softwareId);
    socket.emit('local_software_deleted', { ...result, player: gameWorld.getPlayer(currentUserId) });
  });
  socket.on('delete_remote_file', ({ targetIp, fileId }) => {
    const result = gameWorld.deleteRemoteFile(currentUserId, targetIp, fileId);
    socket.emit('file_operation_result', { ...result, server: gameWorld.getServer(targetIp) });
  });
  socket.on('discover_random_ip', () => {
    const found = gameWorld.generateProceduralServer(currentUserId);
    socket.emit('ip_discovered', { server: found, player: gameWorld.getPlayer(currentUserId), servers: gameWorld.getDiscoveredServers(currentUserId) });
  });
  socket.on('siphon_victim_crypto', ({ targetIp, address }) => {
    const result = gameWorld.siphonVictimCrypto(currentUserId, targetIp, address);
    socket.emit('victim_crypto_siphoned', { ...result, player: gameWorld.getPlayer(currentUserId), server: gameWorld.getServer(targetIp) });
    if (result.server) io.emit('server_updated', result.server);
  });
  socket.on('siphon_victim_account', ({ targetIp, accountNumber }) => {
    const result = gameWorld.siphonVictimAccount(currentUserId, targetIp, accountNumber);
    socket.emit('victim_account_siphoned', { ...result, player: gameWorld.getPlayer(currentUserId), server: gameWorld.getServer(targetIp) });
    if (result.server) io.emit('server_updated', result.server);
  });

  socket.on('admin_get_users', () => socket.emit('admin_users_list', gameWorld.getAdminUsersList(currentUserId)));
  socket.on('admin_update_player', ({ targetUserId, updates }) => {
    const result = gameWorld.adminUpdatePlayer(currentUserId, targetUserId, updates);
    socket.emit('admin_action_result', result);
    if (result.success) {
      socket.emit('admin_users_list', gameWorld.getAdminUsersList(currentUserId));
      if (result.player && targetUserId === currentUserId) socket.emit('player_updated', result.player);
    }
  });
  socket.on('admin_reset_password', ({ targetUserId, newPassword }) => socket.emit('admin_action_result', gameWorld.adminResetUserPassword(currentUserId, targetUserId, newPassword)));
  socket.on('admin_set_ban', ({ targetUserId, isBanned, reason }) => {
    const result = gameWorld.adminSetUserBan(currentUserId, targetUserId, isBanned, reason);
    socket.emit('admin_action_result', result);
    if (result.success) socket.emit('admin_users_list', gameWorld.getAdminUsersList(currentUserId));
  });
  socket.on('admin_delete_user', ({ targetUserId }) => {
    const result = gameWorld.adminDeleteUser(currentUserId, targetUserId);
    socket.emit('admin_action_result', result);
    if (result.success) socket.emit('admin_users_list', gameWorld.getAdminUsersList(currentUserId));
  });
  socket.on('admin_broadcast_news', ({ headline, category }) => {
    if (!gameWorld.verifyIsAdmin(currentUserId)) return socket.emit('admin_action_result', { success: false, message: 'Acesso negado.' });
    if (typeof headline !== 'string' || headline.length < 1 || headline.length > 500) return socket.emit('admin_action_result', { success: false, message: 'Notícia inválida.' });
    gameWorld.addNews(headline, category || 'SYSTEM');
    io.emit('news_updated', gameWorld.getNews());
    socket.emit('admin_action_result', { success: true, message: 'Transmissão global enviada a todos os jogadores!' });
  });
  socket.on('admin_reset_servers', () => {
    const result = gameWorld.adminResetWorldServers(currentUserId);
    socket.emit('admin_action_result', result);
    if (result.success) io.emit('world_sync', { allServers: result.servers, news: gameWorld.getNews() });
  });

  socket.on('disconnect', () => {
    gameWorld.disconnectServer(currentUserId);
    gameWorld.savePlayerState(currentUserId);
  });
});

export { app, server, io };
