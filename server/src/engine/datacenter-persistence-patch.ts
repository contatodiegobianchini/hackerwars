import { GameWorld } from './GameWorld.js';
import { DatacenterEngine } from './DatacenterEngine.js';

const datacenterProto = DatacenterEngine.prototype as any;
const worldProto = GameWorld.prototype as any;

if (!datacenterProto.__elapsedYieldPatchInstalled) {
  datacenterProto.collectAutomaticMinuteYield = function collectElapsedYield(player: any) {
    if (!player?.vpsList?.length) return { totalCollected: 0, vpsYields: [] };

    const now = Date.now();
    const MAX_CATCHUP_MINUTES = 360;
    let totalCollected = 0;
    const vpsYields: { vpsId: string; name: string; amount: number }[] = [];

    for (const vps of player.vpsList) {
      const lastYieldAt = Number(vps.lastYieldAt || 0);
      if (!Number.isFinite(lastYieldAt) || lastYieldAt <= 0) {
        vps.lastYieldAt = now;
        continue;
      }

      const elapsedMinutes = Math.min(
        MAX_CATCHUP_MINUTES,
        Math.max(0, Math.floor((now - lastYieldAt) / 60000)),
      );
      if (elapsedMinutes <= 0) continue;

      const perMinute = Math.max(0, Math.round(this.calculateMinuteYield(vps)));
      const amount = perMinute * elapsedMinutes;
      if (amount > 0) {
        player.cash += amount;
        vps.passivelyGeneratedUsd = Number(vps.passivelyGeneratedUsd || 0) + amount;
        totalCollected += amount;
        vpsYields.push({ vpsId: vps.id, name: vps.name, amount });
      }

      vps.lastYieldAt = lastYieldAt + elapsedMinutes * 60000;
    }

    return { totalCollected, vpsYields };
  };

  const originalRentVps = datacenterProto.rentVps;
  datacenterProto.rentVps = function patchedRentVps(player: any, tier: any) {
    const result = originalRentVps.call(this, player, tier);
    if (result?.success && result.vps) result.vps.lastYieldAt = Date.now();
    return result;
  };

  datacenterProto.__elapsedYieldPatchInstalled = true;
}

if (!worldProto.__datacenterPersistencePatchInstalled) {
  const originalGetOrCreatePlayer = worldProto.getOrCreatePlayer;
  const originalSavePlayerState = worldProto.savePlayerState;
  const datacenter = new DatacenterEngine();

  worldProto.getOrCreatePlayer = function patchedGetOrCreatePlayer(userId: string) {
    const player = originalGetOrCreatePlayer.call(this, userId);
    const beforeSnapshots = (player.vpsList || []).map((v: any) => `${v.id}:${v.lastYieldAt || 0}:${v.passivelyGeneratedUsd || 0}`);
    const result = datacenter.collectAutomaticMinuteYield(player);
    const afterSnapshots = (player.vpsList || []).map((v: any) => `${v.id}:${v.lastYieldAt || 0}:${v.passivelyGeneratedUsd || 0}`);

    if (result.totalCollected > 0 || JSON.stringify(beforeSnapshots) !== JSON.stringify(afterSnapshots)) {
      if (player.bankAccounts?.length) player.bankAccounts[0].balance = player.cash;
      originalSavePlayerState.call(this, userId);
    }

    if (result.totalCollected > 0 && this.proxyTraceEngine?.['io']) {
      this.proxyTraceEngine['io'].to(userId).emit('vps_payout_collected', {
        userId,
        totalCollected: result.totalCollected,
        vpsYields: result.vpsYields,
        player,
        offlineCatchUp: true,
        message: `Rendimento VPS acumulado: +$${result.totalCollected.toLocaleString()} USD creditados automaticamente.`,
      });
    }

    return player;
  };

  worldProto.__datacenterPersistencePatchInstalled = true;
  console.log('[datacenter] elapsed passive yield + websocket sync patch loaded');
}
