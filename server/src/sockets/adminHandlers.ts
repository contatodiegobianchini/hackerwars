import { Socket } from 'socket.io';
import { GameWorld } from '../engine/GameWorld.js';
import { dbHelpers } from '../database/supabase.js';

export function registerAdminHandlers(socket: Socket, gameWorld: GameWorld, currentUserId: string): void {
  socket.on('admin_get_users', () => {
    if (!gameWorld.verifyIsAdmin(currentUserId)) {
      return socket.emit('admin_users_list', { success: false, message: 'Acesso negado.' });
    }
    socket.emit('admin_users_list', { success: true, users: dbHelpers.getAllUsersForAdmin() });
  });

  socket.on('admin_update_player', ({ targetUserId, updates }: { targetUserId: string; updates: any }) => {
    if (!gameWorld.verifyIsAdmin(currentUserId)) {
      return socket.emit('admin_action_result', { success: false, message: 'Acesso negado.' });
    }
    const result = gameWorld.adminUpdatePlayer(currentUserId, targetUserId, updates);
    socket.emit('admin_action_result', { ...result, targetPlayer: result.player });
  });

  socket.on('admin_reset_password', ({ targetUserId, newPassword }: { targetUserId: string; newPassword: string }) => {
    if (!gameWorld.verifyIsAdmin(currentUserId)) {
      return socket.emit('admin_action_result', { success: false, message: 'Acesso negado.' });
    }
    const result = (gameWorld as any).adminResetPassword(currentUserId, targetUserId, newPassword);
    socket.emit('admin_action_result', result);
  });

  socket.on('admin_set_ban', ({ targetUserId, isBanned, reason }: { targetUserId: string; isBanned: boolean; reason: string }) => {
    if (!gameWorld.verifyIsAdmin(currentUserId)) {
      return socket.emit('admin_action_result', { success: false, message: 'Acesso negado.' });
    }
    const result = (gameWorld as any).adminSetBan(currentUserId, targetUserId, isBanned, reason);
    socket.emit('admin_action_result', result);
  });

  socket.on('admin_delete_user', ({ targetUserId }: { targetUserId: string }) => {
    if (!gameWorld.verifyIsAdmin(currentUserId)) {
      return socket.emit('admin_action_result', { success: false, message: 'Acesso negado.' });
    }
    const result = gameWorld.adminDeleteUser(currentUserId, targetUserId);
    socket.emit('admin_action_result', result);
  });

  socket.on('admin_broadcast_news', ({ headline, category }: { headline: string; category?: string }) => {
    if (!gameWorld.verifyIsAdmin(currentUserId)) {
      return socket.emit('admin_action_result', { success: false, message: 'Acesso negado.' });
    }
    gameWorld.addNews(headline, (category as any) || 'SYSTEM');
    socket.emit('admin_action_result', { success: true, message: 'Notícia publicada.' });
  });

  socket.on('admin_reset_servers', () => {
    if (!gameWorld.verifyIsAdmin(currentUserId)) {
      return socket.emit('admin_action_result', { success: false, message: 'Acesso negado.' });
    }
    dbHelpers.resetAllServers();
    socket.emit('admin_action_result', { success: true, message: 'Servidores resetados.' });
  });
}
