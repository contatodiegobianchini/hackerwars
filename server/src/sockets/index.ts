import { Server as SocketIOServer, Socket } from 'socket.io';
import { GameWorld } from '../engine/GameWorld.js';
import { ProcessEngine } from '../engine/ProcessEngine.js';
import { VPS_CATALOG } from '../engine/DatacenterEngine.js';

import { registerHardwareHandlers } from './hardwareHandlers.js';
import { registerDefenseHandlers } from './defenseHandlers.js';
import { registerDarknetHandlers } from './darknetHandlers.js';
import { registerClanHandlers } from './clanHandlers.js';
import { registerDatacenterHandlers } from './datacenterHandlers.js';
import { registerStoryHandlers } from './storyHandlers.js';
import { registerEconomyHandlers } from './economyHandlers.js';
import { registerProcessHandlers } from './processHandlers.js';
import { registerRemoteHandlers } from './remoteHandlers.js';
import { registerAdminHandlers } from './adminHandlers.js';

export function setupSocketListeners(
  io: SocketIOServer,
  gameWorld: GameWorld,
  processEngine: ProcessEngine
): void {
  setInterval(() => {
    io.emit('world_sync', {
      cryptoState: gameWorld.cryptoEngine.getState(),
      clans: gameWorld.clanEngine.getClans(),
      territoryNodes: gameWorld.clanEngine.getTerritoryNodes(),
      contracts: gameWorld.contractsAndRaidEngine.getContracts(),
      auctions: gameWorld.contractsAndRaidEngine.getAuctions(),
      news: gameWorld.getNews(),
    });
  }, 3000);

  io.on('connection', (socket: Socket) => {
    const currentUserId = socket.data?.user?.userId || '';
    if (!currentUserId) return socket.disconnect(true);

    const sendInitState = (userId: string) => {
      socket.emit('init_state', {
        player: gameWorld.getPlayer(userId),
        servers: gameWorld.getDiscoveredServers(userId),
        allServers: gameWorld.getAllServers(),
        missions: gameWorld.missionEngine.getAvailableMissions(),
        cryptoState: gameWorld.cryptoEngine.getState(),
        crates: gameWorld.blackMarketEngine.getCrates(),
        clans: gameWorld.clanEngine.getClans(),
        territoryNodes: gameWorld.clanEngine.getTerritoryNodes(),
        contracts: gameWorld.contractsAndRaidEngine.getContracts(),
        auctions: gameWorld.contractsAndRaidEngine.getAuctions(),
        activeRaid: gameWorld.contractsAndRaidEngine.getActiveRaid(userId),
        vpsCatalog: VPS_CATALOG,
        storyChapters: gameWorld.getStoryChapters(userId),
        darkChatChannels: gameWorld.getDarkChatChannels(),
        activeTrace: gameWorld.proxyTraceEngine.getTraceState(userId),
        news: gameWorld.getNews(),
        processes: processEngine.getActiveProcesses(userId),
      });
    };

    socket.join(currentUserId);

    socket.on('set_user_session', ({ userId }: { userId: string }) => {
      if (userId !== currentUserId) return;
      socket.join(currentUserId);
      sendInitState(currentUserId);
    });

    sendInitState(currentUserId);

    registerHardwareHandlers(socket, gameWorld, currentUserId);
    registerDefenseHandlers(socket, gameWorld, currentUserId);
    registerDarknetHandlers(socket, gameWorld, currentUserId);
    registerClanHandlers(socket, gameWorld, currentUserId);
    registerDatacenterHandlers(socket, gameWorld, currentUserId);
    registerStoryHandlers(socket, gameWorld, currentUserId);
    registerEconomyHandlers(socket, gameWorld, currentUserId);
    registerProcessHandlers(socket, gameWorld, processEngine, currentUserId);
    registerRemoteHandlers(socket, gameWorld, currentUserId);
    registerAdminHandlers(socket, gameWorld, currentUserId);
  });
}
