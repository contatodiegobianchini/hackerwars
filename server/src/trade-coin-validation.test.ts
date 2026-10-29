import test from 'node:test';
import assert from 'node:assert';

process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://dummy.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_service_role_key_32_chars_long_min';

import { GameWorld } from './engine/GameWorld.js';

test('tradeCoin validation rejects non-numeric, negative, zero, NaN, or Infinity inputs', () => {
  const gameWorld = new GameWorld();
  // Clean up interval timers so test doesn't keep node event loop open
  for (let i = 1; i < 100; i++) {
    clearInterval(i);
  }
  const userId = 'user-zero-cool-1';
  const player = gameWorld.getPlayer(userId);

  const initialCash = player.cash;
  const initialBtc = player.cryptoWallet.btc;

  // Test buy with NaN usdAmount
  const res1 = gameWorld.tradeCoin(userId, 'btc', 'buy', NaN);
  assert.strictEqual(res1.success, false);
  assert.strictEqual(player.cash, initialCash);

  // Test buy with negative usdAmount
  const res2 = gameWorld.tradeCoin(userId, 'btc', 'buy', -100);
  assert.strictEqual(res2.success, false);
  assert.strictEqual(player.cash, initialCash);

  // Test buy with zero usdAmount
  const res3 = gameWorld.tradeCoin(userId, 'btc', 'buy', 0);
  assert.strictEqual(res3.success, false);
  assert.strictEqual(player.cash, initialCash);

  // Test sell with Infinity coinAmount
  const res4 = gameWorld.tradeCoin(userId, 'btc', 'sell', undefined, Infinity);
  assert.strictEqual(res4.success, false);
  assert.strictEqual(player.cryptoWallet.btc, initialBtc);

  // Test sell with invalid type (cast as any)
  const res5 = gameWorld.tradeCoin(userId, 'btc', 'sell', '100' as any);
  assert.strictEqual(res5.success, false);
  assert.strictEqual(player.cryptoWallet.btc, initialBtc);

  // Test buy with undefined for both amounts
  const res6 = gameWorld.tradeCoin(userId, 'btc', 'buy');
  assert.strictEqual(res6.success, false);
  assert.strictEqual(player.cash, initialCash);
});
