import { Socket } from 'socket.io';
import { GameWorld } from '../engine/GameWorld.js';

export function registerEconomyHandlers(socket: Socket, gameWorld: GameWorld, currentUserId: string): void {
  socket.on('open_lootbox', ({ crateId, paymentMethod }: { crateId: string; paymentMethod: any }) => {
    const result = gameWorld.openLootbox(currentUserId, crateId, paymentMethod);
    if (result.success) gameWorld.savePlayerState(currentUserId);
    socket.emit('lootbox_result', { ...result, player: gameWorld.getPlayer(currentUserId) });
  });

  socket.on('trade_crypto', ({ coinId, action, usdAmount, coinAmount }: { coinId: string; action: any; usdAmount?: number; coinAmount?: number }) => {
    const result = gameWorld.tradeCoin(currentUserId, coinId, action, usdAmount, coinAmount);
    if (result.success) gameWorld.savePlayerState(currentUserId);
    socket.emit('crypto_result', {
      ...result,
      player: gameWorld.getPlayer(currentUserId),
      cryptoState: gameWorld.cryptoEngine.getState(),
    });
  });

  socket.on('set_mining_coin', ({ coinId }: { coinId: string }) => {
    const result = (gameWorld as any).setMiningCoin(currentUserId, coinId);
    if (result?.success) gameWorld.savePlayerState(currentUserId);
    socket.emit('mining_coin_updated', { ...result, player: gameWorld.getPlayer(currentUserId) });
  });
}
