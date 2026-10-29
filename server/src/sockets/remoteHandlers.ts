import { Socket } from 'socket.io';
import { GameWorld } from '../engine/GameWorld.js';

export function registerRemoteHandlers(socket: Socket, gameWorld: GameWorld, currentUserId: string): void {
  socket.on('delete_local_software', ({ softwareId }: { softwareId: string }) => {
    const result = gameWorld.deleteLocalSoftware(currentUserId, softwareId);
    socket.emit('local_software_deleted', { ...result, player: gameWorld.getPlayer(currentUserId) });
  });

  socket.on('delete_remote_file', ({ targetIp, fileId }: { targetIp: string; fileId: string }) => {
    const result = gameWorld.deleteRemoteFile(currentUserId, targetIp, fileId);
    socket.emit('file_operation_result', { ...result, server: gameWorld.getServer(targetIp) });
  });

  socket.on('wipe_remote_logs', ({ targetIp }: { targetIp: string }) => {
    const result = (gameWorld as any).wipeRemoteLogs(currentUserId, targetIp);
    socket.emit('file_operation_result', { ...result, server: gameWorld.getServer(targetIp) });
  });

  socket.on('edit_log', ({ targetIp, logId, newText }: { targetIp: string; logId: string; newText: string }) => {
    const result = (gameWorld as any).editLog(currentUserId, targetIp, logId, newText);
    socket.emit('log_edit_result', { ...result, server: gameWorld.getServer(targetIp) });
  });

  socket.on('discover_random_ip', () => {
    const result = (gameWorld as any).discoverRandomIp(currentUserId);
    socket.emit('ip_discovered', { ...result, player: gameWorld.getPlayer(currentUserId) });
  });

  socket.on('siphon_victim_crypto', ({ targetIp, address }: { targetIp: string; address: string }) => {
    const result = gameWorld.siphonVictimCrypto(currentUserId, targetIp, address);
    socket.emit('bank_result', { ...result, player: gameWorld.getPlayer(currentUserId), server: gameWorld.getServer(targetIp) });
  });

  socket.on('siphon_victim_account', ({ targetIp, accountNumber }: { targetIp: string; accountNumber: string }) => {
    const result = gameWorld.siphonVictimAccount(currentUserId, targetIp, accountNumber);
    socket.emit('bank_result', { ...result, player: gameWorld.getPlayer(currentUserId), server: gameWorld.getServer(targetIp) });
  });

  socket.on('bank_transfer', ({ sourceAcc, destAcc, amount, bankIp }: { sourceAcc: string; destAcc: string; amount: number; bankIp: string }) => {
    const result = gameWorld.bankTransfer(currentUserId, sourceAcc, destAcc, amount, bankIp);
    socket.emit('bank_result', { ...result, player: gameWorld.getPlayer(currentUserId), server: gameWorld.getServer(bankIp) });
  });

  socket.on('connect_target', ({ ip }: { ip: string }) => {
    const result = gameWorld.connectToServer(currentUserId, ip);
    socket.emit('target_connected', {
      ...result,
      player: gameWorld.getPlayer(currentUserId),
      traceState: gameWorld.proxyTraceEngine.getTraceState(currentUserId),
    });
  });

  socket.on('disconnect_target', () => {
    socket.emit('target_disconnected', { success: true });
  });
}
