import { Socket } from 'socket.io';
import { GameWorld } from '../engine/GameWorld.js';

export function registerClanHandlers(socket: Socket, gameWorld: GameWorld, currentUserId: string): void {
  socket.on('create_clan', ({ name, tag, description }: { name: string; tag: string; description: string }) => {
    const player = gameWorld.getPlayer(currentUserId);
    if (player.clanId) return socket.emit('clan_action_result', { success: false, message: 'Você já pertence a um clã.' });
    if (
      typeof name !== 'string' ||
      typeof tag !== 'string' ||
      typeof description !== 'string' ||
      name.trim().length < 3 ||
      name.length > 40 ||
      tag.trim().length < 2
    ) {
      return socket.emit('clan_action_result', { success: false, message: 'Dados do clã inválidos.' });
    }
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

  socket.on('join_clan', ({ clanId }: { clanId: string }) => {
    const player = gameWorld.getPlayer(currentUserId);
    if (player.clanId && player.clanId !== clanId) return socket.emit('clan_action_result', { success: false, message: 'Você já pertence a outro clã.' });
    const result = gameWorld.clanEngine.joinClan(player.id, player.username, clanId);
    if (result.success) {
      player.clanId = clanId;
      gameWorld.savePlayerState(currentUserId);
    }
    socket.emit('clan_action_result', { ...result, player: gameWorld.getPlayer(currentUserId), clans: gameWorld.clanEngine.getClans() });
  });

  socket.on('leave_clan', ({ clanId }: { clanId: string }) => {
    const player = gameWorld.getPlayer(currentUserId);
    if (player.clanId !== clanId) return socket.emit('clan_action_result', { success: false, message: 'Você não pertence a este clã.' });
    const result = gameWorld.clanEngine.leaveClan(player.id, clanId);
    if (result.success) {
      player.clanId = undefined;
      gameWorld.savePlayerState(currentUserId);
    }
    socket.emit('clan_action_result', { ...result, player: gameWorld.getPlayer(currentUserId), clans: gameWorld.clanEngine.getClans() });
  });

  socket.on('deposit_clan_vault', ({ clanId, amountUsd, amountBtc }: { clanId: string; amountUsd: number; amountBtc: number }) => {
    const player = gameWorld.getPlayer(currentUserId);
    if (
      player.clanId !== clanId ||
      !Number.isFinite(amountUsd) ||
      !Number.isFinite(amountBtc) ||
      amountUsd < 0 ||
      amountBtc < 0 ||
      player.cash < amountUsd ||
      (player.cryptoWallet.btc || 0) < amountBtc
    ) {
      return socket.emit('clan_action_result', { success: false, message: 'Depósito inválido, clã incorreto ou saldo insuficiente.' });
    }
    const result = gameWorld.clanEngine.depositVault(clanId, amountUsd, amountBtc);
    if (!result.success) return socket.emit('clan_action_result', { ...result, player });
    player.cash -= amountUsd;
    player.cryptoWallet.btc = Number(((player.cryptoWallet.btc || 0) - amountBtc).toFixed(6));
    player.crypto = player.cryptoWallet.btc;
    gameWorld.savePlayerState(currentUserId);
    socket.emit('clan_action_result', { ...result, player: gameWorld.getPlayer(currentUserId), clans: gameWorld.clanEngine.getClans() });
  });

  socket.on('attack_clan_territory', ({ clanId, nodeId }: { clanId: string; nodeId: string }) => {
    const player = gameWorld.getPlayer(currentUserId);
    if (player.clanId !== clanId) return socket.emit('clan_action_result', { success: false, message: 'Você só pode atacar em nome do seu próprio clã.' });
    const botnet = player.software.find(s => s.type === 'ddos');
    const attackPower = Math.round((botnet?.version || 1) * player.hardware.network.speedMbps * 12);
    const result = gameWorld.clanEngine.attackTerritoryNode(clanId, nodeId, attackPower);
    if (result.conquered) gameWorld.addNews(`GUERRA DE CLÃS: O clã [${player.clanId}] conquistou o nó territorial!`, 'CLAN');
    gameWorld.savePlayerState(currentUserId);
    socket.emit('clan_action_result', {
      ...result,
      player: gameWorld.getPlayer(currentUserId),
      territoryNodes: gameWorld.clanEngine.getTerritoryNodes(),
      clans: gameWorld.clanEngine.getClans(),
    });
  });
}
