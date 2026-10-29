import { Socket } from 'socket.io';
import { GameWorld } from '../engine/GameWorld.js';

export function registerHardwareHandlers(socket: Socket, gameWorld: GameWorld, currentUserId: string): void {
  socket.on('upgrade_hardware', ({ type }: { type: string }) => {
    const allowed = new Set(['cpu', 'gpu', 'ram', 'hdd', 'network', 'vpn', 'cooling']);
    if (typeof type !== 'string' || !allowed.has(type)) {
      return socket.emit('hardware_result', { success: false, message: 'Tipo de hardware inválido.' });
    }
    const result = gameWorld.upgradeHardware(currentUserId, type as any);
    if (result.success) gameWorld.savePlayerState(currentUserId);
    socket.emit('hardware_result', { ...result, player: gameWorld.getPlayer(currentUserId) });
  });

  socket.on('toggle_proxy_hop', ({ hopIp }: { hopIp: string }) => {
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
}
