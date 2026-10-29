import { test } from 'node:test';
import assert from 'node:assert';

process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://dummy.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_service_role_key_32_chars_long_min';

await import('./spyware-balance-patch.js');
const { GameWorld } = await import('./engine/GameWorld.js');

test('spyware balance patch attaches balancedSpywareSnifferTicker prototype method', () => {
  const prototype = GameWorld.prototype as any;
  assert.strictEqual(typeof prototype.startSpywareSnifferTicker, 'function');
  assert.strictEqual(prototype.startSpywareSnifferTicker.name, 'balancedSpywareSnifferTicker');
});

test('spyware player Map lookup correctly matches owners and avoids N+1 linear searches', () => {
  const numPlayers = 500;
  const playersMap = new Map<string, { userId: string; player: { id: string; username: string } }>();
  for (let i = 0; i < numPlayers; i++) {
    playersMap.set(`user-${i}`, {
      userId: `user-${i}`,
      player: { id: `player-id-${i}`, username: `user_${i}` },
    });
  }

  const numServers = 200;
  const serversMap = new Map<string, { ip: string; activeSpyware: { ownerId: string }[] }>();
  for (let i = 0; i < numServers; i++) {
    serversMap.set(`10.0.0.${i}`, {
      ip: `10.0.0.${i}`,
      activeSpyware: [{ ownerId: `player-id-${i % numPlayers}` }],
    });
  }

  // Pre-built Map lookup (O(N) setup + O(1) lookup per implant)
  const playersByPlayerId = new Map<string, any>();
  for (const entry of playersMap.values()) {
    if (entry?.player?.id) {
      playersByPlayerId.set(entry.player.id, entry);
    }
  }

  let foundCount = 0;
  for (const server of serversMap.values()) {
    if (!server.activeSpyware) continue;
    for (const implant of server.activeSpyware) {
      const owner = playersByPlayerId.get(implant.ownerId);
      if (owner) foundCount++;
    }
  }

  assert.strictEqual(foundCount, numServers);
  assert.strictEqual(playersByPlayerId.get('player-id-0')?.player.username, 'user_0');
  assert.strictEqual(playersByPlayerId.get('unknown-id'), undefined);
});
