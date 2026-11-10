import { Socket } from 'socket.io';
import { GameWorld } from '../engine/GameWorld.js';
import { buyTurbo } from '../engine/cyberCoins.js';
import { ProcessEngine } from '../engine/ProcessEngine.js';

export function registerProcessHandlers(
  socket: Socket,
  gameWorld: GameWorld,
  processEngine: ProcessEngine,
  currentUserId: string
): void {
  socket.on('start_process', (payload: any) => {
    if (!payload || typeof payload !== 'object') {
      return socket.emit('process_started', { success: false, message: 'Dados do processo inválidos.' });
    }
    const type = payload.type;
    const params = payload.params && typeof payload.params === 'object'
      ? payload.params
      : (({ type: _t, ...rest }) => rest)(payload);
    const result = processEngine.startProcess(currentUserId, type, params || {});
    socket.emit('process_started', result);
  });

  socket.on('speed_up_process', ({ processId }: { processId: string }) => {
    const result = processEngine.speedUpProcess(String(processId), currentUserId);
    socket.emit('shop_result', { ...result, player: gameWorld.getPlayer(currentUserId) });
  });

  socket.on('buy_turbo', ({ offerId }: { offerId: string }) => {
    const player = gameWorld.getPlayer(currentUserId);
    const result = buyTurbo(player, offerId);
    if (result.ok) gameWorld.savePlayerState(currentUserId);
    socket.emit('shop_result', { success: result.ok, message: result.message, player });
  });

  socket.on('cancel_process', ({ processId }: { processId: string }) => {
    const result = processEngine.cancelProcess(processId, currentUserId);
    socket.emit('process_cancelled', { success: result });
  });

  socket.on('accept_mission', ({ missionId }: { missionId: string }) => {
    const result = gameWorld.missionEngine.acceptMission(gameWorld.getPlayer(currentUserId), missionId, ip => gameWorld.getServer(ip));
    if (result.success) gameWorld.savePlayerState(currentUserId);
    socket.emit('mission_accepted', {
      ...result,
      player: gameWorld.getPlayer(currentUserId),
      missions: gameWorld.missionEngine.getPlayerMissions(gameWorld.getPlayer(currentUserId)),
    });
  });

  socket.on('claim_mission', ({ missionId }: { missionId: string }) => {
    const result = gameWorld.missionEngine.claimMission(gameWorld.getPlayer(currentUserId), missionId, ip => gameWorld.getServer(ip));
    gameWorld.savePlayerState(currentUserId);
    socket.emit('mission_claimed', {
      ...result,
      player: gameWorld.getPlayer(currentUserId),
      missions: gameWorld.missionEngine.getPlayerMissions(gameWorld.getPlayer(currentUserId)),
    });
  });
}
