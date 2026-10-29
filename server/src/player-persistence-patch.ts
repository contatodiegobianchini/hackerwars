import { GameWorld } from './engine/GameWorld.js';
import { dbHelpers } from './database/supabase.js';

const prototype = GameWorld.prototype as any;
const originalGetOrCreatePlayer = prototype.getOrCreatePlayer;

if (typeof originalGetOrCreatePlayer === 'function') {
  prototype.getOrCreatePlayer = function (userId: string = 'user-zero-cool-1') {
    const cached = this.players?.get(userId)?.player as any;
    const cachedInfections = Array.isArray(cached?.infections)
      ? JSON.parse(JSON.stringify(cached.infections))
      : null;

    const saved = dbHelpers.getPlayerByUserId(userId);
    const user = dbHelpers.getUserById(userId);

    // An authenticated account must never be silently recreated from defaults.
    // If its player row is missing, fail loudly so we can repair the database instead.
    if (!saved && user && userId !== 'user-zero-cool-1') {
      throw new Error(`[Persistence] Player row missing for existing user ${user.username} (${userId})`);
    }

    if (!saved && !user && userId !== 'user-zero-cool-1') {
      throw new Error(`[Persistence] Unknown user ${userId}`);
    }

    const player = originalGetOrCreatePlayer.call(this, userId);

    // GameWorld.updatePlayerStats historically reset infections on every read.
    // Preserve the live value for cached players, or restore the persisted value on first load.
    if (cachedInfections && cachedInfections.length > 0 && Array.isArray(player.infections) && player.infections.length === 0) {
      player.infections = cachedInfections;
    } else if (saved && Array.isArray(saved.infections) && saved.infections.length > 0 && Array.isArray(player.infections) && player.infections.length === 0) {
      player.infections = JSON.parse(JSON.stringify(saved.infections));
    }

    return player;
  };

  console.log('[persistence] player state safety patch loaded');
}
