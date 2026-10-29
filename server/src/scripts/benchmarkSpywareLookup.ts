export function benchmark() {
  const numPlayers = 2000;
  const players = new Map<string, { userId: string; player: { id: string; username: string } }>();
  for (let i = 0; i < numPlayers; i++) {
    const userId = 'user-' + i;
    const p = { id: 'player-id-' + i, username: 'user_' + i };
    players.set(userId, { userId, player: p });
  }

  const numServers = 1000;
  const servers = new Map<string, { id: string; ip: string; hostname: string; activeSpyware: { ownerId: string; spywareLevel: number }[] }>();
  for (let i = 0; i < numServers; i++) {
    const ip = '10.0.' + Math.floor(i / 256) + '.' + (i % 256);
    const srv = {
      id: 'srv-' + i,
      ip,
      hostname: 'host-' + i,
      activeSpyware: [
        { ownerId: 'player-id-' + (i % numPlayers), spywareLevel: 1.0 }
      ]
    };
    servers.set(ip, srv);
  }

  function oldLookup() {
    let count = 0;
    for (const server of servers.values()) {
      if (!server.activeSpyware || server.activeSpyware.length === 0) continue;
      for (const implant of server.activeSpyware) {
        const owner = Array.from(players.values()).find(p => p.player.id === implant.ownerId);
        if (owner) count++;
      }
    }
    return count;
  }

  function newLookup() {
    const playersByPlayerId = new Map<string, { userId: string; player: { id: string; username: string } }>();
    for (const entry of players.values()) {
      if (entry?.player?.id) {
        playersByPlayerId.set(entry.player.id, entry);
      }
    }

    let count = 0;
    for (const server of servers.values()) {
      if (!server.activeSpyware || server.activeSpyware.length === 0) continue;
      for (const implant of server.activeSpyware) {
        const owner = playersByPlayerId.get(implant.ownerId);
        if (owner) count++;
      }
    }
    return count;
  }

  const iterations = 20;

  const startOld = performance.now();
  for (let iter = 0; iter < iterations; iter++) {
    oldLookup();
  }
  const endOld = performance.now();

  const startNew = performance.now();
  for (let iter = 0; iter < iterations; iter++) {
    newLookup();
  }
  const endNew = performance.now();

  const oldTime = endOld - startOld;
  const newTime = endNew - startNew;
  const speedup = oldTime / newTime;

  console.log(`[Benchmark] Old lookup (${iterations} iterations): ${oldTime.toFixed(2)} ms`);
  console.log(`[Benchmark] New lookup (${iterations} iterations): ${newTime.toFixed(2)} ms`);
  console.log(`[Benchmark] Speedup factor: ${speedup.toFixed(1)}x`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  benchmark();
}
