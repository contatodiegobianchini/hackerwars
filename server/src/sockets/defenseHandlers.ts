import { Socket } from 'socket.io';
import { GameWorld } from '../engine/GameWorld.js';

export function registerDefenseHandlers(socket: Socket, gameWorld: GameWorld, currentUserId: string): void {
  socket.on('clean_infection', ({ infectionId }: { infectionId: string }) => {
    const result = gameWorld.cleanInfection(currentUserId, infectionId);
    socket.emit('infection_cleaned', { ...result, player: gameWorld.getPlayer(currentUserId) });
  });

  socket.on('toggle_honeypot', () => {
    const result = gameWorld.toggleHoneypot(currentUserId);
    socket.emit('honeypot_toggled', { ...result, player: gameWorld.getPlayer(currentUserId) });
  });

  socket.on('defend_npc_invasion', ({ method }: { method: string }) => {
    const player = gameWorld.getPlayer(currentUserId);
    const result = gameWorld.defenseEngine.defendInvasion(player, method as any);
    gameWorld.savePlayerState(currentUserId);
    socket.emit('npc_invasion_action_result', { ...result, player: gameWorld.getPlayer(currentUserId) });
  });

  socket.on('trigger_npc_invasion', () => {
    gameWorld.defenseEngine.triggerNpcInvasion(gameWorld.getPlayer(currentUserId));
  });

  socket.on('defend_police_raid', ({ method }: { method: string }) => {
    const player = gameWorld.getPlayer(currentUserId);
    const result = gameWorld.contractsAndRaidEngine.defendPoliceRaid(player, method as any);
    gameWorld.savePlayerState(currentUserId);
    socket.emit('police_raid_defend_result', { ...result, player: gameWorld.getPlayer(currentUserId) });
  });

  socket.on('trigger_test_raid', () => {
    gameWorld.contractsAndRaidEngine.triggerPoliceRaid(
      gameWorld.getPlayer(currentUserId),
      'FBI Cyber Division',
      'Mandado de Busca e Apreensão: Violação ao Servidor Central do FBI e Tentativa de Exfiltração de Arquivos Militares.'
    );
  });
}
