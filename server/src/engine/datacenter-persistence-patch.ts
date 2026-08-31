import { GameWorld } from './GameWorld.js';
import { DatacenterEngine } from './DatacenterEngine.js';
import { dbHelpers } from '../database/supabase.js';

const worldProto = GameWorld.prototype as any;

if (!worldProto.__datacenterPersistencePatchInstalled) {
  const engine = new DatacenterEngine();
  const originalGetOrCreatePlayer = worldProto.getOrCreatePlayer;
  const originalSavePlayerState = worldProto.savePlayerState;

  const settleVpsYield = (gameWorld: any, userId: string, player: any) => {
    if (!player?.vpsList?.length) return;

    const now = Date.now();
    const MAX_OFFLINE_MINUTES = 360; // no more than 6h of catch-up per load
    let changed = false;
    let totalCollected = 0;

    for (const vps of player.vpsList) {
      const lastYieldAt = Number(vps.lastYieldAt || 0);

      // Existing VPS records did not have a timestamp. Start their clock now
      // instead of awarding an unbounded retroactive payout after migration.
      if (!Number.isFinite(lastYieldAt) || lastYieldAt <= 0) {
        vps.lastYieldAt = now;
        changed = true;
        continue;
      }

      const elapsedMinutes = Math.min(
        MAX_OFFLINE_MINUTES,
        Math.max(0, Math.floor((now - lastYieldAt) / 60000))
      );

      if (elapsedMinutes <= 0) continue;

      const perMinute = engine.calculateMinuteYield(vps);
      const amount = Math.max(0, Math.round(perMinute * elapsedMinutes));

      if (amount > 0) {
        player.cash += amount;
        vps.passivelyGeneratedUsd = Number(vps.passivelyGeneratedUsd || 0) + amount;
        totalCollected += amount;
      }

      // Advance by the credited minutes so partial minutes remain available.
      vps.lastYieldAt = lastYieldAt + elapsedMinutes * 60000;
      changed = true;
    }

    if (!changed) return;

    if (player.bankAccounts?.length) {
      player.bankAccounts[0].balance = player.cash;
    }

    originalSavePlayerState.call(gameWorld, userId);

    if (totalCollected > 0 && gameWorld.proxyTraceEngine?.['io']) {
      gameWorld.proxyTraceEngine['io'].to(userId).emit('vps_payout_collected', {
        userId,
        totalCollected,
        vpsYields: player.vpsList.map((v: any) => ({
          vpsId: v.id,
          name: v.name,
          amount: 0,
        })),
        player: player,
        offlineCatchUp: true,
        message: `Rendimento VPS acumulado: +$${totalCollected.toLocaleString()} USD creditados automaticamente.`,
      });
    }
  };

  worldProto.getOrCreatePlayer = function patchedGetOrCreatePlayer(userId: string) {
    const player = originalGetOrCreatePlayer.call(this, userId);
    settleVpsYield(this, userId, player);
    return player;
  };

  worldProto.__datacenterPersistencePatchInstalled = true;
  console.log('[datacenter] passive yield persistence patch loaded');
}
