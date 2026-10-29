import { Socket } from 'socket.io';
import { GameWorld } from '../engine/GameWorld.js';

export function registerDarknetHandlers(socket: Socket, gameWorld: GameWorld, currentUserId: string): void {
  socket.on('claim_darknet_contract', ({ contractId }: { contractId: string }) => {
    const player = gameWorld.getPlayer(currentUserId);
    const result = gameWorld.contractsAndRaidEngine.claimContract(player, contractId);
    if (result.success) gameWorld.savePlayerState(currentUserId);
    socket.emit('darknet_contract_claimed', {
      ...result,
      player: gameWorld.getPlayer(currentUserId),
      contracts: gameWorld.contractsAndRaidEngine.getContracts(),
    });
  });

  socket.on('place_auction_bid', ({ auctionId, bidAmountUsd }: { auctionId: string; bidAmountUsd: number }) => {
    const player = gameWorld.getPlayer(currentUserId);
    const result = gameWorld.contractsAndRaidEngine.placeBid(player, auctionId, bidAmountUsd);
    if (result.success) gameWorld.savePlayerState(currentUserId);
    socket.emit('auction_bid_result', {
      ...result,
      player: gameWorld.getPlayer(currentUserId),
      auctions: gameWorld.contractsAndRaidEngine.getAuctions(),
    });
  });

  socket.on('buyout_auction', ({ auctionId }: { auctionId: string }) => {
    const player = gameWorld.getPlayer(currentUserId);
    const result = gameWorld.contractsAndRaidEngine.buyoutAuction(player, auctionId);
    if (result.success) gameWorld.savePlayerState(currentUserId);
    socket.emit('auction_buyout_result', {
      ...result,
      player: gameWorld.getPlayer(currentUserId),
      auctions: gameWorld.contractsAndRaidEngine.getAuctions(),
    });
  });
}
