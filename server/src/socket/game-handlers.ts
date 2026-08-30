import { Server as SocketIOServer, Socket } from 'socket.io';
import { GameWorld } from '../engine/GameWorld.js';
import { ProcessEngine } from '../engine/ProcessEngine.js';

const HARDWARE_TYPES = new Set(['cpu', 'gpu', 'ram', 'hdd', 'network', 'vpn', 'cooling']);

type GameSocket = Socket;

export function registerGameSocketHandlers(
  io: SocketIOServer,
  gameWorld: GameWorld,
  processEngine: ProcessEngine,
): void {
  io.on('connection', (socket: GameSocket) => {
    // secure-server.ts validates the JWT and binds socket.data.user before this handler runs.
    let currentUserId = socket.data?.user?.userId as string | undefined;

    if (!currentUserId) {
      socket.emit('auth_error', { message: 'Sessão Socket.IO não autenticada.' });
      socket.disconnect(true);
      return;
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
        vpsCatalog: gameWorld.datacenterEngine.getCatalog?.() ?? [],
        storyChapters: gameWorld.getStoryChapters(userId),
        darkChatChannels: gameWorld.getDarkChatChannels(),
        activeTrace: gameWorld.proxyTraceEngine.getTraceState(userId),
        news: gameWorld.getNews(),
        processes: processEngine.getActiveProcesses(userId),
      });
    };

    socket.on('set_user_session', ({ userId }: { userId?: string }) => {
      const authenticatedUserId = socket.data?.user?.userId as string | undefined;
      if (!authenticatedUserId || userId !== authenticatedUserId) return;
      currentUserId = authenticatedUserId;
      sendInitState(currentUserId);
    });

    sendInitState(currentUserId);

    socket.on('toggle_proxy_hop', ({ hopIp }: { hopIp: string }) => {
      const result = gameWorld.toggleProxyHop(currentUserId!, hopIp);
      socket.emit('proxy_chain_updated', { ...result, player: gameWorld.getPlayer(currentUserId!) });
    });

    socket.on('clear_proxy_chain', () => {
      const result = gameWorld.clearProxyChain(currentUserId!);
      socket.emit('proxy_chain_updated', { ...result, player: gameWorld.getPlayer(currentUserId!) });
    });

    socket.on('trigger_cartel_jumpscare', () => {
      const player = gameWorld.getPlayer(currentUserId!);
      const durationMs = 5 * 60 * 1000;
      player.lockdownUntil = Date.now() + durationMs;
      gameWorld.savePlayerState(currentUserId!);
      socket.emit('cartel_jumpscare_event', {
        player,
        lockdownUntil: player.lockdownUntil,
        lockdownDurationSec: 300,
        message: 'O Cartel rastreou seu IP e mandou sicários até seu esconderijo!',
      });
    });

    socket.on('clear_lockdown', () => {
      const player = gameWorld.getPlayer(currentUserId!);
      player.lockdownUntil = undefined;
      gameWorld.savePlayerState(currentUserId!);
      socket.emit('lockdown_cleared', {
        player,
        message: 'A poeira baixou. O Cartel abandonou as buscas e você está livre!',
      });
    });

    socket.on('clean_infection', ({ infectionId }: { infectionId: string }) => {
      const result = gameWorld.cleanInfection(currentUserId!, infectionId);
      socket.emit('infection_cleaned', { ...result, player: gameWorld.getPlayer(currentUserId!) });
    });

    socket.on('toggle_honeypot', () => {
      const result = gameWorld.toggleHoneypot(currentUserId!);
      socket.emit('honeypot_toggled', { ...result, player: gameWorld.getPlayer(currentUserId!) });
    });

    socket.on('defend_npc_invasion', ({ method }: { method: 'firewall' | 'honeypot' | 'killswitch' }) => {
      const player = gameWorld.getPlayer(currentUserId!);
      const result = gameWorld.defenseEngine.defendInvasion(player, method);
      gameWorld.savePlayerState(currentUserId!);
      socket.emit('npc_invasion_action_result', { ...result, player: gameWorld.getPlayer(currentUserId!) });
    });

    socket.on('trigger_npc_invasion', () => {
      const player = gameWorld.getPlayer(currentUserId!);
      gameWorld.defenseEngine.triggerNpcInvasion(player);
    });

    socket.on('defend_police_raid', ({ method }: { method: 'bribe' | 'purge_evidence' | 'blackout_jammer' }) => {
      const player = gameWorld.getPlayer(currentUserId!);
      const result = gameWorld.contractsAndRaidEngine.defendPoliceRaid(player, method);
      gameWorld.savePlayerState(currentUserId!);
      socket.emit('police_raid_defend_result', { ...result, player: gameWorld.getPlayer(currentUserId!) });
    });

    socket.on('trigger_test_raid', () => {
      const player = gameWorld.getPlayer(currentUserId!);
      gameWorld.contractsAndRaidEngine.triggerPoliceRaid(
        player,
        'FBI Cyber Division',
        'Mandado de Busca e Apreensão: Violação ao Servidor Central do FBI e Tentativa de Exfiltração de Arquivos Militares.'
      );
    });

    socket.on('claim_darknet_contract', ({ contractId }: { contractId: string }) => {
      const player = gameWorld.getPlayer(currentUserId!);
      const result = gameWorld.contractsAndRaidEngine.claimContract(player, contractId);
      if (result.success) gameWorld.savePlayerState(currentUserId!);
      socket.emit('darknet_contract_claimed', {
        ...result,
        player: gameWorld.getPlayer(currentUserId!),
        contracts: gameWorld.contractsAndRaidEngine.getContracts(),
      });
    });

    socket.on('place_auction_bid', ({ auctionId, bidAmountUsd }: { auctionId: string; bidAmountUsd: number }) => {
      const player = gameWorld.getPlayer(currentUserId!);
      const result = gameWorld.contractsAndRaidEngine.placeBid(player, auctionId, bidAmountUsd);
      if (result.success) gameWorld.savePlayerState(currentUserId!);
      socket.emit('auction_bid_result', {
        ...result,
        player: gameWorld.getPlayer(currentUserId!),
        auctions: gameWorld.contractsAndRaidEngine.getAuctions(),
      });
    });

    socket.on('buyout_auction', ({ auctionId }: { auctionId: string }) => {
      const player = gameWorld.getPlayer(currentUserId!);
      const result = gameWorld.contractsAndRaidEngine.buyoutAuction(player, auctionId);
      if (result.success) gameWorld.savePlayerState(currentUserId!);
      socket.emit('auction_buyout_result', {
        ...result,
        player: gameWorld.getPlayer(currentUserId!),
        auctions: gameWorld.contractsAndRaidEngine.getAuctions(),
      });
    });

    socket.on('create_clan', ({ name, tag, description }: { name: string; tag: string; description: string }) => {
      const player = gameWorld.getPlayer(currentUserId!);
      if (player.cash < 5000) {
        socket.emit('clan_action_result', { success: false, message: 'Necessário $5.000 USD para fundar um novo clã!' });
        return;
      }
      const result = gameWorld.clanEngine.createClan(player.id, player.username, name, tag, description);
      if (result.success && result.clan) {
        player.cash -= 5000;
        player.clanId = result.clan.id;
        gameWorld.savePlayerState(currentUserId!);
        gameWorld.addNews(`NOVO CLÃ FUNDADO: [${result.clan.tag}] ${result.clan.name} liderado por ${player.username}!`, 'CLAN');
      }
      socket.emit('clan_action_result', {
        ...result,
        player: gameWorld.getPlayer(currentUserId!),
        clans: gameWorld.clanEngine.getClans(),
      });
    });

    socket.on('join_clan', ({ clanId }: { clanId: string }) => {
      const player = gameWorld.getPlayer(currentUserId!);
      const result = gameWorld.clanEngine.joinClan(player.id, player.username, clanId);
      if (result.success) {
        player.clanId = clanId;
        gameWorld.savePlayerState(currentUserId!);
      }
      socket.emit('clan_action_result', { ...result, player: gameWorld.getPlayer(currentUserId!), clans: gameWorld.clanEngine.getClans() });
    });

    socket.on('leave_clan', ({ clanId }: { clanId: string }) => {
      const player = gameWorld.getPlayer(currentUserId!);
      const result = gameWorld.clanEngine.leaveClan(player.id, clanId);
      if (result.success) {
        player.clanId = undefined;
        gameWorld.savePlayerState(currentUserId!);
      }
      socket.emit('clan_action_result', { ...result, player: gameWorld.getPlayer(currentUserId!), clans: gameWorld.clanEngine.getClans() });
    });

    socket.on('deposit_clan_vault', ({ clanId, amountUsd, amountBtc }: { clanId: string; amountUsd: number; amountBtc: number }) => {
      const player = gameWorld.getPlayer(currentUserId!);
      if (!Number.isFinite(amountUsd) || !Number.isFinite(amountBtc) || amountUsd < 0 || amountBtc < 0) {
        socket.emit('clan_action_result', { success: false, message: 'Valores de depósito inválidos.' });
        return;
      }
      if (player.cash < amountUsd || (player.cryptoWallet.btc || 0) < amountBtc) {
        socket.emit('clan_action_result', { success: false, message: 'Saldo insuficiente para doar ao cofre do clã.' });
        return;
      }
      const result = gameWorld.clanEngine.depositVault(clanId, amountUsd, amountBtc);
      if (!result.success) {
        socket.emit('clan_action_result', { ...result, player });
        return;
      }
      player.cash -= amountUsd;
      player.cryptoWallet.btc = Number(((player.cryptoWallet.btc || 0) - amountBtc).toFixed(6));
      player.crypto = player.cryptoWallet.btc;
      gameWorld.savePlayerState(currentUserId!);
      socket.emit('clan_action_result', { ...result, player: gameWorld.getPlayer(currentUserId!), clans: gameWorld.clanEngine.getClans() });
    });

    socket.on('attack_clan_territory', ({ clanId, nodeId }: { clanId: string; nodeId: string }) => {
      const player = gameWorld.getPlayer(currentUserId!);
      const botnet = player.software.find(s => s.type === 'ddos');
      const attackPower = Math.round((botnet?.version || 1.0) * player.hardware.network.speedMbps * 12);
      const result = gameWorld.clanEngine.attackTerritoryNode(clanId, nodeId, attackPower);
      if (result.conquered) gameWorld.addNews(`GUERRA DE CLÃS: O clã [${player.clanId}] conquistou o nó territorial!`, 'CLAN');
      socket.emit('clan_action_result', {
        ...result,
        player: gameWorld.getPlayer(currentUserId!),
        territoryNodes: gameWorld.clanEngine.getTerritoryNodes(),
        clans: gameWorld.clanEngine.getClans(),
      });
    });

    socket.on('rent_vps', ({ tier }: { tier: 'micro' | 'beast' | 'quantum' }) => {
      const player = gameWorld.getPlayer(currentUserId!);
      const result = gameWorld.datacenterEngine.rentVps(player, tier);
      if (result.success) gameWorld.savePlayerState(currentUserId!);
      socket.emit('vps_action_result', { ...result, player: gameWorld.getPlayer(currentUserId!) });
    });

    socket.on('set_vps_module', ({ vpsId, moduleType }: { vpsId: string; moduleType: any }) => {
      const player = gameWorld.getPlayer(currentUserId!);
      const allowed = new Set(['mining_rig', 'phishing_honeypot', 'botnet_amplifier']);
      if (typeof vpsId !== 'string' || typeof moduleType !== 'string' || !allowed.has(moduleType)) {
        socket.emit('vps_action_result', { success: false, message: 'Módulo VPS inválido.', player });
        return;
      }
      const result = gameWorld.datacenterEngine.setVpsModule(player, vpsId, moduleType);
      if (result.success) gameWorld.savePlayerState(currentUserId!);
      socket.emit('vps_action_result', { ...result, player: gameWorld.getPlayer(currentUserId!) });
    });

    socket.on('upgrade_vps_module', ({ vpsId }: { vpsId: string }) => {
      const player = gameWorld.getPlayer(currentUserId!);
      const result = gameWorld.datacenterEngine.upgradeVpsModule(player, vpsId);
      if (result.success) gameWorld.savePlayerState(currentUserId!);
      socket.emit('vps_action_result', { ...result, player: gameWorld.getPlayer(currentUserId!) });
    });

    socket.on('submit_story_choice', ({ chapterId, choiceId }: { chapterId: string; choiceId: string }) => {
      const result = gameWorld.submitStoryChoice(currentUserId!, chapterId, choiceId);
      socket.emit('story_choice_result', {
        ...result,
        storyChapters: gameWorld.getStoryChapters(currentUserId!),
        darkChatChannels: gameWorld.getDarkChatChannels(),
      });
    });

    socket.on('set_faction_alignment', ({ faction }: { faction: any }) => {
      const result = gameWorld.setFactionAlignment(currentUserId!, faction);
      socket.emit('faction_alignment_result', { ...result, darkChatChannels: gameWorld.getDarkChatChannels() });
    });

    socket.on('send_dark_chat_message', ({ channelId, text }: { channelId: string; text: string }) => {
      if (typeof channelId !== 'string' || typeof text !== 'string' || text.length > 2000) {
        socket.emit('dark_chat_message_sent', { success: false, message: 'Mensagem inválida.' });
        return;
      }
      const result = gameWorld.sendDarkChatMessage(currentUserId!, channelId, text);
      socket.emit('dark_chat_message_sent', result);
      io.emit('dark_chat_message_received', {
        channelId,
        message: result.message,
        channels: gameWorld.getDarkChatChannels(),
      });
    });

    socket.on('open_lootbox', ({ crateId, paymentMethod }: { crateId: string; paymentMethod: 'usd' | 'btc' }) => {
      const result = gameWorld.openLootbox(currentUserId!, crateId, paymentMethod);
      socket.emit('lootbox_result', { ...result, player: gameWorld.getPlayer(currentUserId!) });
    });

    socket.on('trade_crypto', ({ coinId, action, usdAmount, coinAmount }: { coinId: string; action: 'buy' | 'sell'; usdAmount?: number; coinAmount?: number }) => {
      const result = gameWorld.tradeCoin(currentUserId!, coinId, action, usdAmount, coinAmount);
      socket.emit('crypto_result', {
        ...result,
        player: gameWorld.getPlayer(currentUserId!),
        cryptoState: gameWorld.cryptoEngine.getState(),
      });
    });

    socket.on('set_mining_coin', ({ coinId }: { coinId: string }) => {
      const result = gameWorld.setMiningTargetCoin(currentUserId!, coinId);
      socket.emit('mining_coin_updated', { ...result, player: gameWorld.getPlayer(currentUserId!) });
    });

    socket.on('connect_target', ({ ip }: { ip: string }) => {
      const result = gameWorld.connectToServer(currentUserId!, ip);
      socket.emit('target_connected', { ...result, player: gameWorld.getPlayer(currentUserId!) });
    });

    socket.on('disconnect_target', () => {
      gameWorld.disconnectServer(currentUserId!);
    });

    socket.on('start_process', (data: { type: any; targetIp?: string; targetFileId?: string; targetFileName?: string; softwareId?: string; details?: any }) => {
      const result = processEngine.startProcess(currentUserId!, data.type, {
        targetIp: data.targetIp,
        targetFileId: data.targetFileId,
        targetFileName: data.targetFileName,
        softwareId: data.softwareId,
        details: data.details,
      });
      socket.emit('process_started', result);
    });

    socket.on('cancel_process', ({ processId }: { processId: string }) => {
      const success = processEngine.cancelProcess(processId, currentUserId!);
      socket.emit('process_canceled', { success, processId });
    });

    socket.on('bank_transfer', ({ sourceAcc, destAcc, amount, bankIp }: { sourceAcc: string; destAcc: string; amount: number; bankIp: string }) => {
      const result = gameWorld.bankTransfer(currentUserId!, sourceAcc, destAcc, amount, bankIp);
      socket.emit('bank_result', {
        ...result,
        player: gameWorld.getPlayer(currentUserId!),
        server: gameWorld.getServer(bankIp),
      });
    });

    socket.on('upgrade_hardware', ({ type }: { type: string }) => {
      if (!HARDWARE_TYPES.has(type)) {
        socket.emit('hardware_result', { success: false, message: 'Tipo de upgrade inválido.' });
        return;
      }
      const result = gameWorld.upgradeHardware(currentUserId!, type as 'cpu' | 'gpu' | 'ram' | 'hdd' | 'network' | 'vpn' | 'cooling');
      socket.emit('hardware_result', { ...result, player: gameWorld.getPlayer(currentUserId!) });
      if (result.success) sendInitState(currentUserId!);
    });

    socket.on('accept_mission', ({ missionId }: { missionId: string }) => {
      const mission = gameWorld.missionEngine.acceptMission(missionId);
      if (!mission) {
        socket.emit('mission_accepted', { success: false, message: 'Missão indisponível.' });
        return;
      }
      const player = gameWorld.getPlayer(currentUserId!);
      if (!player.activeMissions.some(m => m.id === mission.id)) {
        player.activeMissions.push(mission);
        gameWorld.savePlayerState(currentUserId!);
      }
      socket.emit('mission_accepted', {
        success: true,
        mission,
        player,
        missions: gameWorld.missionEngine.getAvailableMissions(),
      });
    });

    socket.on('claim_mission', ({ missionId }: { missionId: string }) => {
      const player = gameWorld.getPlayer(currentUserId!);
      const activeIndex = player.activeMissions.findIndex(m => m.id === missionId);
      if (activeIndex === -1) {
        socket.emit('mission_claimed', { success: false, message: 'Missão não encontrada entre as ativas.' });
        return;
      }
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

      if (!canComplete) {
        socket.emit('mission_claimed', { success: false, message: 'Objetivos da missão ainda não foram atendidos!' });
        return;
      }

      player.activeMissions.splice(activeIndex, 1);
      player.cash += mission.rewardCash;
      player.cryptoWallet.btc = Number(((player.cryptoWallet.btc || 0) + mission.rewardCrypto).toFixed(6));
      player.crypto = player.cryptoWallet.btc;
      player.reputation += mission.rewardRep;
      gameWorld.savePlayerState(currentUserId!);
      gameWorld.missionEngine.completeMission(missionId);
      gameWorld.addNews(`Missão cumprida: "${mission.title}" concluída com sucesso por ${player.username}!`, 'SYSTEM');
      gameWorld.missionEngine.generateRandomMission();
      socket.emit('mission_claimed', {
        success: true,
        message: `Recompensa resgatada! +$${mission.rewardCash}, +${mission.rewardCrypto} BTC, +${mission.rewardRep} REP`,
        player: gameWorld.getPlayer(currentUserId!),
        missions: gameWorld.missionEngine.getAvailableMissions(),
      });
    });

    socket.on('delete_local_software', ({ softwareId }: { softwareId: string }) => {
      const result = gameWorld.deleteLocalSoftware(currentUserId!, softwareId);
      socket.emit('local_software_deleted', { ...result, player: gameWorld.getPlayer(currentUserId!) });
    });

    socket.on('delete_remote_file', ({ targetIp, fileId }: { targetIp: string; fileId: string }) => {
      const result = gameWorld.deleteRemoteFile(currentUserId!, targetIp, fileId);
      socket.emit('file_operation_result', { ...result, server: gameWorld.getServer(targetIp) });
    });

    socket.on('discover_random_ip', () => {
      const newServer = gameWorld.generateProceduralServer(currentUserId!);
      socket.emit('ip_discovered', {
        server: newServer,
        player: gameWorld.getPlayer(currentUserId!),
        servers: gameWorld.getDiscoveredServers(currentUserId!),
      });
    });

    socket.on('siphon_victim_crypto', ({ targetIp, address }: { targetIp: string; address: string }) => {
      const result = gameWorld.siphonVictimCrypto(currentUserId!, targetIp, address);
      socket.emit('victim_crypto_siphoned', {
        ...result,
        player: gameWorld.getPlayer(currentUserId!),
        server: gameWorld.getServer(targetIp),
      });
      if (result.server) io.emit('server_updated', result.server);
    });

    socket.on('siphon_victim_account', ({ targetIp, accountNumber }: { targetIp: string; accountNumber: string }) => {
      const result = gameWorld.siphonVictimAccount(currentUserId!, targetIp, accountNumber);
      socket.emit('victim_account_siphoned', {
        ...result,
        player: gameWorld.getPlayer(currentUserId!),
        server: gameWorld.getServer(targetIp),
      });
      if (result.server) io.emit('server_updated', result.server);
    });

    socket.on('admin_get_users', () => {
      const result = gameWorld.getAdminUsersList(currentUserId!);
      socket.emit('admin_users_list', result);
    });

    socket.on('admin_update_player', ({ targetUserId, updates }: { targetUserId: string; updates: any }) => {
      const result = gameWorld.adminUpdatePlayer(currentUserId!, targetUserId, updates);
      socket.emit('admin_action_result', result);
      if (result.success) {
        socket.emit('admin_users_list', gameWorld.getAdminUsersList(currentUserId!));
        if (result.player && targetUserId === currentUserId) socket.emit('player_updated', result.player);
      }
    });

    socket.on('admin_reset_password', ({ targetUserId, newPassword }: { targetUserId: string; newPassword: string }) => {
      const result = gameWorld.adminResetUserPassword(currentUserId!, targetUserId, newPassword);
      socket.emit('admin_action_result', result);
    });

    socket.on('admin_set_ban', ({ targetUserId, isBanned, reason }: { targetUserId: string; isBanned: boolean; reason?: string }) => {
      const result = gameWorld.adminSetUserBan(currentUserId!, targetUserId, isBanned, reason);
      socket.emit('admin_action_result', result);
      if (result.success) socket.emit('admin_users_list', gameWorld.getAdminUsersList(currentUserId!));
    });

    socket.on('admin_delete_user', ({ targetUserId }: { targetUserId: string }) => {
      const result = gameWorld.adminDeleteUser(currentUserId!, targetUserId);
      socket.emit('admin_action_result', result);
      if (result.success) socket.emit('admin_users_list', gameWorld.getAdminUsersList(currentUserId!));
    });

    socket.on('admin_broadcast_news', ({ headline, category }: { headline: string; category?: string }) => {
      if (!gameWorld.verifyIsAdmin(currentUserId!)) {
        socket.emit('admin_action_result', { success: false, message: 'Acesso negado.' });
        return;
      }
      gameWorld.addNews(headline, (category || 'SYSTEM') as any);
      io.emit('news_updated', gameWorld.getNews());
      socket.emit('admin_action_result', { success: true, message: 'Transmissão global enviada a todos os jogadores!' });
    });

    socket.on('admin_reset_servers', () => {
      const result = gameWorld.adminResetWorldServers(currentUserId!);
      socket.emit('admin_action_result', result);
      if (result.success) {
        io.emit('world_sync', { allServers: result.servers, news: gameWorld.getNews() });
      }
    });

    socket.on('disconnect', () => {
      gameWorld.disconnectServer(currentUserId!);
      gameWorld.savePlayerState(currentUserId!);
    });
  });
}
