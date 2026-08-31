// @ts-nocheck
import { GameWorld } from './GameWorld.js';
import { dbHelpers, supabase } from '../database/supabase.js';

type MinerRow = {
  id: string;
  server_ip: string;
  owner_user_id: string;
  owner_player_id?: string | null;
  miner_level: number;
  hash_rate: number;
  coin_id: string;
  installed_at?: string;
  updated_at?: string;
};

const worldProto = GameWorld.prototype as any;
const minerCache = new Map<string, MinerRow>();
const playerIdByUserId = new Map<string, string>();

const cacheKey = (serverIp: string, ownerUserId: string) => `${serverIp}::${ownerUserId}`;

const mergeMiners = (server: any) => {
  if (!server) return server;
  const active = Array.isArray(server.activeMiners) ? server.activeMiners : [];
  server.activeMiners = active;

  for (const row of minerCache.values()) {
    if (row.server_ip !== server.ip) continue;
    const ownerId = playerIdByUserId.get(row.owner_user_id) || row.owner_player_id || row.owner_user_id;
    const existing = active.find((m: any) => m.ownerId === ownerId || m.ownerUserId === row.owner_user_id);
    const restored = {
      ownerId,
      ownerUserId: row.owner_user_id,
      minerLevel: Number(row.miner_level),
      hashRate: Number(row.hash_rate),
      coinId: row.coin_id || 'btc',
    };
    if (existing) Object.assign(existing, restored);
    else active.push(restored);
  }
  return server;
};

const refreshPlayerIds = async () => {
  const { data, error } = await supabase.from('players').select('user_id,id');
  if (error) throw new Error(`[MinerPersistence] Falha ao carregar owners: ${error.message}`);
  playerIdByUserId.clear();
  for (const row of data || []) {
    if (row.user_id && row.id) playerIdByUserId.set(row.user_id, row.id);
  }
};

const loadMinerRows = async () => {
  const { data, error } = await supabase.from('server_miners').select('*');
  if (error) throw new Error(`[MinerPersistence] Falha ao carregar miners: ${error.message}`);
  minerCache.clear();
  for (const row of (data || []) as MinerRow[]) {
    minerCache.set(cacheKey(row.server_ip, row.owner_user_id), row);
  }
};

await Promise.all([refreshPlayerIds(), loadMinerRows()]);

if (!dbHelpers.__minerPersistencePatched) {
  const originalGetAllServers = dbHelpers.getAllServers;
  const originalSaveServer = dbHelpers.saveServer;
  const originalResetAllServers = dbHelpers.resetAllServers;

  dbHelpers.getAllServers = () => originalGetAllServers().map(mergeMiners);

  dbHelpers.saveServer = (server: any) => {
    const merged = mergeMiners(server);
    return originalSaveServer(merged);
  };

  dbHelpers.resetAllServers = (...args: any[]) => {
    minerCache.clear();
    void supabase.from('server_miners').delete().neq('id', '');
    return originalResetAllServers(...args);
  };

  dbHelpers.__minerPersistencePatched = true;
}

if (!worldProto.__minerPersistencePatched) {
  const originalGetServer = worldProto.getServer;
  const originalGetAllServers = worldProto.getAllServers;
  const originalUploadFile = worldProto.uploadFile;
  const originalAdminResetWorldServers = worldProto.adminResetWorldServers;

  worldProto.getServer = function patchedGetServer(ip: string) {
    const server = originalGetServer.call(this, ip);
    return mergeMiners(server);
  };

  worldProto.getAllServers = function patchedGetAllServers() {
    return originalGetAllServers.call(this).map(mergeMiners);
  };

  worldProto.uploadFile = function patchedUploadFile(userId: string, targetIp: string, softwareId: string) {
    const player = this.getOrCreatePlayer(userId);
    const server = originalGetServer.call(this, targetIp);
    if (server) {
      mergeMiners(server);
      this.servers?.set?.(targetIp, server);
    }

    const result = originalUploadFile.call(this, userId, targetIp, softwareId);
    if (result?.success) {
      const software = player.software?.find((s: any) => s.id === softwareId);
      if (software?.type === 'miner') {
        const updatedServer = originalGetServer.call(this, targetIp);
        const miner = updatedServer?.activeMiners?.find((m: any) => m.ownerId === player.id || m.ownerUserId === userId);
        if (miner) {
          const row: MinerRow = {
            id: cacheKey(targetIp, userId),
            server_ip: targetIp,
            owner_user_id: userId,
            owner_player_id: player.id,
            miner_level: Number(miner.minerLevel || software.version || 1),
            hash_rate: Number(miner.hashRate || 0),
            coin_id: miner.coinId || player.miningTargetCoin || 'btc',
          };
          minerCache.set(cacheKey(targetIp, userId), row);
          Object.assign(miner, { ownerUserId: userId });
          mergeMiners(updatedServer);
          void supabase.from('server_miners').upsert(row, { onConflict: 'server_ip,owner_user_id' });
          dbHelpers.saveServer(updatedServer);
        }
      }
    }
    return result;
  };

  worldProto.adminResetWorldServers = function patchedAdminResetWorldServers(adminUserId: string) {
    minerCache.clear();
    void supabase.from('server_miners').delete().neq('id', '');
    return originalAdminResetWorldServers.call(this, adminUserId);
  };

  worldProto.__minerPersistencePatched = true;
  console.log(`[miner-persistence] restored ${minerCache.size} remote miners from Supabase`);
}
