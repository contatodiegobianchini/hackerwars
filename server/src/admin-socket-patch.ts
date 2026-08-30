import { Socket } from 'socket.io';
import { GameWorld } from './engine/GameWorld.js';
import { dbHelpers, supabase } from './database/supabase.js';

type AdminUpdatePayload = {
  targetUserId?: unknown;
  updates?: Record<string, unknown> | null;
  cash?: unknown;
  cryptoWallet?: unknown;
  reputation?: unknown;
  rank?: unknown;
  role?: unknown;
  isBanned?: unknown;
  banReason?: unknown;
};

const socketPrototype = Socket.prototype as any;
const originalOn = socketPrototype.on;

socketPrototype.on = function patchedSocketOn(event: string, listener: (...args: any[]) => unknown) {
  if (event !== 'admin_update_player') {
    return originalOn.call(this, event, listener);
  }

  return originalOn.call(this, event, (payload: AdminUpdatePayload = {}) => {
    const normalizedUpdates = payload && payload.updates && typeof payload.updates === 'object'
      ? payload.updates
      : {
          ...(payload.cash !== undefined ? { cash: payload.cash } : {}),
          ...(payload.cryptoWallet !== undefined ? { cryptoWallet: payload.cryptoWallet } : {}),
          ...(payload.reputation !== undefined ? { reputation: payload.reputation } : {}),
          ...(payload.rank !== undefined ? { rank: payload.rank } : {}),
          ...(payload.role !== undefined ? { role: payload.role } : {}),
          ...(payload.isBanned !== undefined ? { isBanned: payload.isBanned } : {}),
          ...(payload.banReason !== undefined ? { banReason: payload.banReason } : {}),
        };

    return listener({
      targetUserId: typeof payload.targetUserId === 'string' ? payload.targetUserId : '',
      updates: normalizedUpdates,
    });
  });
};

// Preserve fields that GameWorld's legacy normalization currently resets on every read.
const gameWorldPrototype = GameWorld.prototype as any;
const originalUpdatePlayerStats = gameWorldPrototype.updatePlayerStats;
if (typeof originalUpdatePlayerStats === 'function') {
  gameWorldPrototype.updatePlayerStats = function patchedUpdatePlayerStats(player: any) {
    const infections = Array.isArray(player?.infections) ? [...player.infections] : undefined;
    originalUpdatePlayerStats.call(this, player);
    if (infections !== undefined) player.infections = infections;
  };
}

// Persist player snapshots in order and wait for each write before sending the next one.
// This prevents an older fire-and-forget Supabase request from overwriting a newer state.
let playerWriteQueue: Promise<void> = Promise.resolve();
const originalSavePlayer = dbHelpers.savePlayer;
dbHelpers.savePlayer = ((userId: string, player: any) => {
  // Keep the existing in-memory reference authoritative.
  const current = dbHelpers.getPlayerByUserId(userId);
  if (current && current !== player) Object.assign(current, player);

  const snapshot = JSON.parse(JSON.stringify(player));
  const updatedAt = new Date().toISOString();

  playerWriteQueue = playerWriteQueue.then(async () => {
    if (!supabase) return;
    const { error } = await supabase
      .from('players')
      .upsert({
        id: snapshot.id,
        user_id: userId,
        data: snapshot,
        updated_at: updatedAt,
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('[Supabase player write]', error);
      // Fall back to the original helper only when the durable write fails.
      originalSavePlayer(userId, player);
    }
  }).catch((error) => {
    console.error('[Supabase player queue]', error);
  });

  return undefined;
}) as typeof dbHelpers.savePlayer;

console.log('[security] admin_update_player payload normalizer loaded');
console.log('[database] durable player persistence patch loaded');
