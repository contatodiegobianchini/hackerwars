import { Socket } from 'socket.io';
import { GameWorld } from '../engine/GameWorld.js';
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

  socket.on('cancel_process', ({ processId }: { processId: string }) => {
    const result = processEngine.cancelProcess(processId, currentUserId);
    socket.emit('process_cancelled', { success: result });
  });

  socket.on('accept_mission', ({ missionId }: { missionId: string }) => {
    const result = gameWorld.missionEngine.acceptMission(gameWorld.getPlayer(currentUserId), missionId);
    if (result.success) gameWorld.savePlayerState(currentUserId);
    socket.emit('mission_accepted', {
      ...result,
      player: gameWorld.getPlayer(currentUserId),
      missions: gameWorld.missionEngine.getPlayerMissions(currentUserId),
    });
  });

  socket.on('claim_mission', ({ missionId }: { missionId: string }) => {
    const result = gameWorld.missionEngine.claimMission(gameWorld.getPlayer(currentUserId), missionId);
    if (result.success) gameWorld.savePlayerState(currentUserId);
    socket.emit('mission_claimed', {
      ...result,
      player: gameWorld.getPlayer(currentUserId),
      missions: gameWorld.missionEngine.getPlayerMissions(currentUserId),
    });
  });
}
