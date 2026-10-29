import { test } from 'node:test';
import assert from 'node:assert';
import { GameWorld } from './engine/GameWorld.js';

test('mining ticker benchmark and correctness test', () => {
  // Use constructor parameter to disable background tickers during benchmarks/tests
  const world = new GameWorld(true);

  // Populate 100 players
  const numPlayers = 100;
  const numServers = 500;

  for (let i = 0; i < numPlayers; i++) {
    const userId = `user-${i}`;
    const player = world.getOrCreatePlayer(userId);
    player.id = `player-id-${i}`;
    player.cash = 1000;
    player.miningTargetCoin = 'btc';
    player.cryptoWallet = { btc: 0, eth: 0, doge: 0, shdw: 0, pepe: 0 };
    player.hardware.gpu = { name: 'GPU', level: 1, miningMultiplier: 2.0, cost: 100, tflops: 10 };
  }

  // Populate 500 servers, each having active miners for multiple players
  const servers = world.getAllServers();
  for (let s = 0; s < numServers; s++) {
    const ip = `10.0.${Math.floor(s / 250)}.${s % 250 + 1}`;
    let server = world.getServer(ip);
    if (!server) {
      server = {
        id: `srv-${s}`,
        ip,
        hostname: `server-${s}`,
        type: 'corporate',
        isOnline: true,
        hardware: { cpuPower: 10, ramGb: 16, hddMb: 5000, networkMbps: 100 },
        security: { hasherLevel: 1, firewallLevel: 1, password: 'pass', isBreached: false, openPorts: [] },
        files: [],
        logs: [],
        activeMiners: [],
      };
      (world as any).servers.set(ip, server);
    }

    // Add 10 miners per server to simulate O(N * M) loop
    server.activeMiners = [];
    for (let m = 0; m < 10; m++) {
      const pIndex = (s + m) % numPlayers;
      server.activeMiners.push({
        ownerId: `player-id-${pIndex}`,
        minerLevel: 2.0,
        hashRate: 50,
        coinId: 'btc',
      });
    }
  }

  // Measure execution time for 100 ticks
  const iterations = 100;
  const startTime = performance.now();
  for (let i = 0; i < iterations; i++) {
    world.tickMining();
  }
  const endTime = performance.now();
  const totalTimeMs = endTime - startTime;
  const avgTickMs = totalTimeMs / iterations;

  console.log(`[Benchmark] ${iterations} ticks executed in ${totalTimeMs.toFixed(2)}ms (Avg: ${avgTickMs.toFixed(3)}ms/tick)`);

  // Verify players received crypto
  const p0 = world.getOrCreatePlayer('user-0');
  assert.ok(p0.cryptoWallet.btc > 0, 'Player should have earned mined BTC');
});
