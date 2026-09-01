import { Socket } from 'socket.io';
import { GameWorld } from '../engine/GameWorld.js';

export function registerDatacenterHandlers(socket: Socket, gameWorld: GameWorld, currentUserId: string): void {
  socket.on('rent_vps', ({ tier }: { tier: any }) => {
    const player = gameWorld.getPlayer(currentUserId);
    const result = gameWorld.datacenterEngine.rentVps(player, tier);
    if (result.success) gameWorld.savePlayerState(currentUserId);
    socket.emit('vps_action_result', { ...result, player: gameWorld.getPlayer(currentUserId) });
  });

  socket.on('set_vps_module', ({ vpsId, moduleType }: { vpsId: string; moduleType: any }) => {
    const player = gameWorld.getPlayer(currentUserId);
    const result = gameWorld.datacenterEngine.setModule(player, vpsId, moduleType);
    if (result.success) gameWorld.savePlayerState(currentUserId);
    socket.emit('vps_action_result', { ...result, player: gameWorld.getPlayer(currentUserId) });
  });

  socket.on('upgrade_vps_module', ({ vpsId }: { vpsId: string }) => {
    const player = gameWorld.getPlayer(currentUserId);
    const result = gameWorld.datacenterEngine.upgradeModule(player, vpsId);
    if (result.success) gameWorld.savePlayerState(currentUserId);
    socket.emit('vps_action_result', { ...result, player: gameWorld.getPlayer(currentUserId) });
  });
}
