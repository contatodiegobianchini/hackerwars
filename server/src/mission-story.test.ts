import test from 'node:test';
import assert from 'node:assert/strict';

process.env.DATABASE_URL ||= 'postgres://test:test@127.0.0.1:1/test';

const { MissionEngine } = await import('./engine/MissionEngine.js');
const { StoryEngine } = await import('./engine/StoryEngine.js');

function makePlayer(): any {
  return {
    id: 'p1', username: 'tester', ip: '1.1.1.1', cash: 0, crypto: 0,
    cryptoWallet: { btc: 0 }, reputation: 0, software: [], hackedIps: [],
    activeMissions: [], completedStoryChapters: [],
  };
}

test('steal_file mission: downloading the required file completes it, and it cannot be farmed', () => {
  const engine = new MissionEngine();
  const player = makePlayer();
  assert.equal(engine.acceptMission(player, 'mis-1').success, true);
  assert.equal(engine.claimMission(player, 'mis-1').success, false);

  // Wrong file or wrong target does not count.
  engine.recordOperation(player, 'download', '192.168.10.15', 'outro.txt');
  engine.recordOperation(player, 'download', '10.0.0.1', 'receita_secreta_molho_especial.txt');
  assert.equal(engine.claimMission(player, 'mis-1').success, false);

  engine.recordOperation(player, 'download', '192.168.10.15', 'receita_secreta_molho_especial.txt');
  assert.equal(engine.claimMission(player, 'mis-1').success, true);
  assert.equal(player.cash, 750); // 3 stars: +50%

  // Cannot re-accept and re-claim the same contract.
  assert.equal(engine.acceptMission(player, 'mis-1').success, false);
  assert.equal(engine.getPlayerMissions(player).some(m => m.id === 'mis-1'), false);
});

test('bug fix: file downloaded before accepting the contract still completes it', () => {
  const engine = new MissionEngine();
  const player = makePlayer();
  player.software.push({ name: 'receita_secreta_molho_especial.txt', sizeMb: 1 });
  const accepted = engine.acceptMission(player, 'mis-1');
  assert.equal(accepted.success, true);
  assert.match(accepted.message, /entregar/);
  assert.equal(player.missionProgress['mis-1'], true);
  assert.equal(engine.claimMission(player, 'mis-1').success, true);
});

test('bug fix: legacy contract accepted before the update completes from the inventory', () => {
  const engine = new MissionEngine();
  const player = makePlayer();
  const mission = engine.getMissionById('mis-1')!;
  player.activeMissions = [{ ...mission, status: 'active' }]; // no acceptedAt, no progress markers
  player.software.push({ name: 'receita_secreta_molho_especial.txt', sizeMb: 1 });
  assert.equal(engine.claimMission(player, 'mis-1').success, true);
});

test('plant_virus mission counts a spyware that is already planted on the target', () => {
  const engine = new MissionEngine();
  const player = makePlayer();
  const mission = engine.generateRandomMission([{ ip: '10.9.9.9', hostname: 'x', type: 'corporate', security: { hasherLevel: 1 }, files: [] } as any])!;
  mission.type = 'plant_virus';
  engine.acceptMission(player, mission.id);
  const servers: Record<string, any> = { '10.9.9.9': { activeSpyware: [{ ownerId: 'p1' }] } };
  assert.equal(engine.claimMission(player, mission.id, ip => servers[ip]).success, true);
});

test('wipe_server mission completes from a wipe_logs operation', () => {
  const engine = new MissionEngine();
  const player = makePlayer();
  engine.acceptMission(player, 'mis-5');
  engine.recordOperation(player, 'crack', '142.250.190.46');
  assert.equal(engine.claimMission(player, 'mis-5').success, false);
  engine.recordOperation(player, 'wipe_logs', '142.250.190.46');
  assert.equal(engine.claimMission(player, 'mis-5').success, true);
});

test('story: locked chapters cannot be completed and breach is per player', () => {
  const story = new StoryEngine();
  const player = makePlayer();
  const servers = new Map<string, any>([
    ['192.168.10.15', { ip: '192.168.10.15', hostname: 'h', security: { isBreached: true, hasherLevel: 0.8 }, logs: [] }],
  ]);
  // Server breached by someone else does not satisfy this player's crack objective.
  const chap1 = story.getChapters(player, servers).find(c => c.id === 'chap-1')!;
  assert.equal(chap1.objectives[0].completed, false);

  const res = story.completeChapterChoice(player, servers as any, 'chap-10', 'c10-choice-anon-ending');
  assert.equal(res.success, false);
  assert.match(res.message, /bloqueado/);
});

test('story: ddos objective requires the player to have performed the attack', () => {
  const story = new StoryEngine();
  const player = makePlayer();
  player.completedStoryChapters = ['chap-1', 'chap-2', 'chap-3', 'chap-4', 'chap-5', 'chap-6'];
  player.hackedIps = ['94.130.82.11'];
  const servers = new Map<string, any>([
    ['94.130.82.11', { ip: '94.130.82.11', hostname: 'mars-rocket.space-y.mars', isOnline: false, security: { hasherLevel: 28 }, logs: [] }],
  ]);
  let chap = story.getChapters(player, servers).find(c => c.id === 'chap-7')!;
  assert.equal(chap.objectives[1].completed, false);
  assert.match(chap.objectives[0].text, /Hasher v28\.0/);
  player.operationLog = { 'ddos:94.130.82.11': Date.now() };
  chap = story.getChapters(player, servers).find(c => c.id === 'chap-7')!;
  assert.equal(chap.objectives[1].completed, true);
});

test('random missions always target a real, completable server', () => {
  const engine = new MissionEngine();
  assert.equal(engine.generateRandomMission([]), null);
  const servers: any[] = [
    { ip: '10.0.0.5', hostname: 'corp.example', type: 'corporate', security: { hasherLevel: 8 }, files: [{ name: 'segredo.pdf' }] },
    { ip: '10.0.0.6', hostname: 'bank.example', type: 'bank', security: { hasherLevel: 20 }, files: [] },
    { ip: '10.0.0.7', hostname: 'trap.example', type: 'honeypot', security: { hasherLevel: 1 }, files: [] },
  ];
  for (let i = 0; i < 50; i++) {
    const m = engine.generateRandomMission(servers)!;
    assert.ok(['10.0.0.5', '10.0.0.6'].includes(m.targetIp));
    if (m.type === 'steal_file') assert.equal(m.requiredFileName, 'segredo.pdf');
    if (m.type === 'hack_bank') assert.equal(m.targetIp, '10.0.0.6');
  }
});

test('syndicate contracts: per-player completion and real objective checks', async () => {
  const { ContractsAndRaidEngine } = await import('./engine/ContractsAndRaidEngine.js');
  const servers: Record<string, any> = {
    '104.18.23.99': { ip: '104.18.23.99', files: [{ name: 'formula_secreta_colacoca_2026.pdf' }], activeMiners: [] },
  };
  const world: any = { getServer: (ip: string) => servers[ip], addNews: () => {} };
  const engine = new ContractsAndRaidEngine(world);
  const a = makePlayer();
  a.software.push({ name: 'Cracker', type: 'cracker', version: 10, sizeMb: 1 });
  a.hackedIps = ['104.18.23.99'];

  // Breach alone is not enough for a steal_file contract.
  assert.equal(engine.claimContract(a, 'cnt-1').success, false);
  a.software.push({ name: 'formula_secreta_colacoca_2026.pdf', sizeMb: 1 });
  assert.equal(engine.claimContract(a, 'cnt-1').success, true);
  assert.equal(engine.claimContract(a, 'cnt-1').success, false);

  // Another player can still deliver the same contract.
  const b = { ...makePlayer(), id: 'p2', hackedIps: ['104.18.23.99'] };
  b.software = [{ name: 'Cracker', type: 'cracker', version: 10, sizeMb: 1 }, { name: 'formula_secreta_colacoca_2026.pdf', sizeMb: 1 }];
  assert.equal(engine.claimContract(b, 'cnt-1').success, true);
});

test('hunts: tracks left on a breached server open a hunt only after leaving, and wiping cancels it', async () => {
  const { reconcileHunts, HUNT_FEATURE_START } = await import('./engine/HuntEngine.js');
  const t = HUNT_FEATURE_START + 1000;
  const server: any = { ip: '9.9.9.9', hostname: 'corp', type: 'corporate', logs: [{ id: 'l', timestamp: t, ip: '1.1.1.1', action: 'x', formattedTime: '' }] };
  const p = makePlayer();
  p.ip = '1.1.1.1';
  p.hackedIps = ['9.9.9.9'];
  p.connectedIp = '9.9.9.9';

  // Still connected: no countdown yet.
  assert.equal(reconcileHunts(p, [server], t).opened.length, 0);
  delete p.connectedIp;
  const r = reconcileHunts(p, [server], t);
  assert.equal(r.opened.length, 1);
  assert.equal(r.opened[0].kind, 'fine');
  assert.equal(p.pendingHunts.length, 1);

  // Not due yet, then due.
  assert.equal(reconcileHunts(p, [server], t + 60_000).due.length, 0);
  assert.equal(reconcileHunts(p, [server], t + 7 * 60_000).due.length, 1);
  assert.equal(p.pendingHunts.length, 0);

  // Wiping the logs before the deadline cancels it.
  reconcileHunts(p, [server], t);
  server.logs = [];
  const c = reconcileHunts(p, [server], t + 1000);
  assert.equal(c.cancelled.length, 1);
  assert.equal(p.pendingHunts.length, 0);
});

test('hunts: logs older than the feature or showing a proxy IP do not count', async () => {
  const { reconcileHunts, HUNT_FEATURE_START } = await import('./engine/HuntEngine.js');
  const server: any = { ip: '9.9.9.9', hostname: 'corp', type: 'bank', logs: [
    { id: 'old', timestamp: HUNT_FEATURE_START - 1, ip: '1.1.1.1', action: '', formattedTime: '' },
    { id: 'proxy', timestamp: HUNT_FEATURE_START + 5, ip: '5.5.5.5', action: 'via proxy', formattedTime: '' },
  ] };
  const p = makePlayer();
  p.ip = '1.1.1.1';
  p.hackedIps = ['9.9.9.9'];
  assert.equal(reconcileHunts(p, [server], HUNT_FEATURE_START + 10).opened.length, 0);
});

test('trace heat: noisy actions cost more seconds', async () => {
  const { traceHeatSeconds } = await import('./engine/traceHeat.js');
  assert.ok(traceHeatSeconds('mass_bank_heist') > traceHeatSeconds('crack'));
  assert.ok(traceHeatSeconds('download', 500) > traceHeatSeconds('download', 5));
  assert.equal(traceHeatSeconds('download', 5000), 20);
});

const boardServers: any[] = [
  { ip: '10.0.0.1', hostname: 'easy-a', type: 'personal', security: { hasherLevel: 1 }, files: [{ name: 'a.txt' }], logs: [] },
  { ip: '10.0.0.2', hostname: 'easy-b', type: 'university', security: { hasherLevel: 2 }, files: [], logs: [] },
  { ip: '10.0.0.3', hostname: 'mid-a', type: 'corporate', security: { hasherLevel: 8 }, files: [{ name: 'm.pdf' }], logs: [] },
  { ip: '10.0.0.4', hostname: 'mid-b', type: 'corporate', security: { hasherLevel: 12 }, files: [], logs: [] },
  { ip: '10.0.0.5', hostname: 'hard', type: 'bank', security: { hasherLevel: 22 }, files: [], logs: [] },
  { ip: '10.0.0.6', hostname: 'elite', type: 'government', security: { hasherLevel: 40 }, files: [], logs: [] },
  { ip: '10.0.0.7', hostname: 'trap', type: 'honeypot', security: { hasherLevel: 1 }, files: [], logs: [] },
];

test('contract board: fills every tier, adds one daily, never uses honeypots, replaces expired', async () => {
  const { refreshBoard, dayKey, CONTRACT_TTL_MS } = await import('./engine/contractBoard.js');
  const now = Date.parse('2026-11-03T15:00:00Z');
  const board = refreshBoard([], boardServers, now);
  const daily = board.filter(m => m.isDaily);
  assert.equal(daily.length, 1);
  assert.equal(daily[0].dayKey, dayKey(now));
  const generated = board.filter(m => !m.isDaily);
  assert.equal(generated.length, 7); // 2 easy + 3 mid (2 servers available, reused) + 1 hard + 1 elite
  assert.ok(generated.every(m => m.targetIp !== '10.0.0.7'));
  assert.ok(generated.some(m => m.difficulty === 'Easy'));

  // Same daily for everyone on the same day (deterministic), a new one the next day.
  assert.equal(refreshBoard([], boardServers, now)[0].id, board.find(m => m.isDaily)!.id);
  const later = refreshBoard(board, boardServers, now + CONTRACT_TTL_MS + 3600_000);
  assert.ok(later.filter(m => !m.isDaily).every(m => m.expiresAt! > now + CONTRACT_TTL_MS));
  const tomorrow = refreshBoard(board, boardServers, now + 24 * 3600_000);
  assert.notEqual(tomorrow.find(m => m.isDaily)!.dayKey, dayKey(now));
});

test('style stars: traced and dirty contracts lose stars and pay less', async () => {
  const { HUNT_FEATURE_START } = await import('./engine/HuntEngine.js');
  const engine = new MissionEngine();
  const clean = makePlayer();
  clean.ip = '1.1.1.1';
  engine.acceptMission(clean, 'mis-1');
  clean.software.push({ name: 'receita_secreta_molho_especial.txt', sizeMb: 1 });
  const server: any = { ip: '192.168.10.15', logs: [] };
  const r1 = engine.claimMission(clean, 'mis-1', () => server);
  assert.match(r1.message, /★★★/);
  assert.equal(clean.cash, 750); // 500 * 1.5

  const dirty = makePlayer();
  dirty.ip = '2.2.2.2';
  engine.acceptMission(dirty, 'mis-1');
  dirty.software.push({ name: 'receita_secreta_molho_especial.txt', sizeMb: 1 });
  dirty.tracedIps = { '192.168.10.15': Date.now() + 1000 };
  const dirtyServer: any = { ip: '192.168.10.15', logs: [{ id: 'x', timestamp: Math.max(Date.now(), HUNT_FEATURE_START) + 5, ip: '2.2.2.2', action: '' }] };
  const r2 = engine.claimMission(dirty, 'mis-1', () => dirtyServer);
  assert.match(r2.message, /★☆☆/);
  assert.equal(dirty.cash, 500);
});

test('daily streak grows on consecutive days and resets after a gap', async () => {
  const { makeContract, streakBonus } = await import('./engine/contractBoard.js');
  const engine = new MissionEngine();
  const p = makePlayer();
  const claimDaily = (key: string) => {
    const m = makeContract(boardServers[0], () => 0, { id: `daily-${key}`, isDaily: true, dayKey: key, rewardBoost: 3 });
    (engine as any).availableMissions.push(m);
    engine.acceptMission(p, m.id);
    p.missionProgress = { ...(p.missionProgress || {}), [m.id]: true };
    engine.claimMission(p, m.id);
  };
  claimDaily('2026-11-01');
  claimDaily('2026-11-02');
  assert.equal(p.dailyStreak.count, 2);
  claimDaily('2026-11-05');
  assert.equal(p.dailyStreak.count, 1);
  assert.equal(streakBonus(6), 0.5);
});

test('secrets: hidden servers and clues are added to an existing world, once', async () => {
  const { ensureSecrets, HIDDEN_IPS } = await import('./engine/secrets.js');
  const world = new Map<string, any>([
    ['192.168.10.15', { ip: '192.168.10.15', files: [] }],
    ['138.68.22.45', { ip: '138.68.22.45', files: [] }],
  ]);
  const changed = ensureSecrets(world);
  assert.ok(changed.length >= HIDDEN_IPS.size + 2);
  assert.ok(world.get('10.66.6.1').hidden);
  assert.ok(world.get('192.168.10.15').files.some((f: any) => f.name === 'post-it_do_roteador.txt'));
  assert.equal(ensureSecrets(world).length, 0);
});

test('secrets: a clue reveals the next server and loot pays only once', async () => {
  const { ensureSecrets, applySecretDownload } = await import('./engine/secrets.js');
  const world = new Map<string, any>([['192.168.10.15', { ip: '192.168.10.15', hostname: 'pizzaria', files: [] }]]);
  ensureSecrets(world);
  const p = makePlayer();
  p.discoveredIps = [];
  const pizzaria = world.get('192.168.10.15');
  const postit = pizzaria.files.find((f: any) => f.name === 'post-it_do_roteador.txt');
  const r = applySecretDownload(p, pizzaria, postit, world)!;
  assert.equal(r.discoveredIp, '10.66.6.1');
  assert.ok(p.discoveredIps.includes('10.66.6.1'));

  const router = world.get('10.66.6.1');
  const cofre = router.files.find((f: any) => f.loot);
  assert.equal(applySecretDownload(p, router, cofre, world)!.loot!.cash, 2000);
  assert.equal(p.cash, 2000);
  assert.equal(applySecretDownload(p, router, cofre, world), null);
  assert.equal(p.cash, 2000);
});

test('bestSoftware picks the highest version', async () => {
  const { bestSoftware } = await import('./engine/bestSoftware.js');
  const list: any[] = [{ type: 'cracker', version: 1 }, { type: 'cracker', version: 4 }, { type: 'miner', version: 9 }];
  assert.equal(bestSoftware(list, 'cracker')!.version, 4);
  assert.equal(bestSoftware(list, 'spyware'), undefined);
});

test('target catalog: many low and mid targets, unique IPs, scans follow the cracker', async () => {
  const { buildCatalogServers, ensureTargets, scanBand, inBand, pickInBand, LOW_MID_TEMPLATES } = await import('./engine/targetCatalog.js');
  const servers = buildCatalogServers();
  assert.ok(servers.length >= 35);
  assert.equal(new Set(servers.map(s => s.ip)).size, servers.length);
  assert.equal(new Set(servers.map(s => s.id)).size, servers.length);
  const hashers = servers.map(s => s.security.hasherLevel);
  assert.ok(hashers.filter(h => h < 3).length >= 10, 'low targets');
  assert.ok(hashers.filter(h => h >= 3 && h < 8).length >= 10, 'mid-low targets');
  assert.ok(hashers.filter(h => h >= 8 && h <= 15).length >= 8, 'mid targets');
  assert.deepEqual(buildCatalogServers().map(s => s.ip), servers.map(s => s.ip), 'deterministic');

  const world = new Map<string, any>();
  assert.equal(ensureTargets(world).length, servers.length);
  assert.equal(ensureTargets(world).length, 0, 'idempotent');

  // A beginner (cracker v1) mostly gets targets within reach.
  let reachable = 0;
  for (let i = 0; i < 200; i++) {
    const band = scanBand(1, Math.random);
    const { hasher } = pickInBand(LOW_MID_TEMPLATES, band);
    if (hasher <= 1.5) reachable++;
    assert.ok(hasher >= 0.5);
    assert.ok(inBand(hasher, band) || hasher <= band.max + 0.1 || hasher >= band.min - 0.1);
  }
  assert.ok(reachable > 40, `beginner should often get easy targets, got ${reachable}/200`);
});

test('contract board: has mid-level contracts with rewards between easy and hard', async () => {
  const { refreshBoard, rewardMultiplier } = await import('./engine/contractBoard.js');
  const { buildCatalogServers } = await import('./engine/targetCatalog.js');
  const board = refreshBoard([], buildCatalogServers() as any, Date.now());
  const generated = board.filter(m => !m.isDaily);
  const hasherOf = (ip: string) => buildCatalogServers().find(s => s.ip === ip)!.security.hasherLevel;
  assert.ok(generated.filter(m => hasherOf(m.targetIp) >= 3 && hasherOf(m.targetIp) < 15).length >= 5);
  assert.ok(rewardMultiplier(2) < rewardMultiplier(5) && rewardMultiplier(5) < rewardMultiplier(12) && rewardMultiplier(12) < rewardMultiplier(20));
});

test('world reaction: patches after a wave of breaches, relaxes later, spares quest servers', async () => {
  const { recordBreach, reconcilePatch, PATCH_THRESHOLD, RELAX_AFTER_MS, maxPatchLevel } = await import('./engine/WorldReaction.js');
  const mk = (): any => ({ ip: '1.2.3.4', type: 'corporate', security: { hasherLevel: 8, firewallLevel: 6 } });
  const now = 1_000_000_000;
  const server = mk();
  for (let i = 0; i < PATCH_THRESHOLD - 1; i++) recordBreach(server, now + i);
  assert.equal(reconcilePatch(server, now + 10), null, 'below the threshold');
  recordBreach(server, now + 20);
  assert.equal(reconcilePatch(server, now + 30, true), null, 'quest servers are exempt');
  assert.equal(reconcilePatch(server, now + 40), 'patched');
  assert.equal(server.security.hasherLevel, 8.5);
  assert.equal(server.security.firewallLevel, 6.5);
  assert.equal(server.patchLevel, 1);

  // Never goes past the cap and relaxes after an hour with no breaches.
  server.patchLevel = maxPatchLevel(8); server.baseHasher = 8;
  for (let i = 0; i < PATCH_THRESHOLD; i++) recordBreach(server, now + 100 + i);
  assert.equal(reconcilePatch(server, now + 200), null, 'capped');
  server.patchLevel = 1; server.baseHasher = 8; server.security.hasherLevel = 8.5; server.breachTimes = []; server.lastBreachAt = now; server.patchedAt = now;
  assert.equal(reconcilePatch(server, now + RELAX_AFTER_MS + 1), 'relaxed');
  assert.equal(server.security.hasherLevel, 8);
  assert.equal(server.baseHasher, undefined);
  assert.equal(maxPatchLevel(0.8), 1);
  assert.equal(maxPatchLevel(40), 6);
});

test('world reaction: idle root access is rotated, active and quest access is kept', async () => {
  const { reconcileAccess, touchAccess, rotationMs } = await import('./engine/WorldReaction.js');
  const servers = new Map<string, any>([
    ['10.0.0.1', { ip: '10.0.0.1', type: 'personal' }],
    ['10.0.0.2', { ip: '10.0.0.2', type: 'bank' }],
    ['10.0.0.3', { ip: '10.0.0.3', type: 'bank' }],
    ['10.0.0.4', { ip: '10.0.0.4', type: 'bank' }],
  ]);
  const player: any = { hackedIps: ['10.0.0.1', '10.0.0.2', '10.0.0.3', '10.0.0.4'], connectedIp: '10.0.0.3', accessAt: {} };
  const t0 = 5_000_000_000;
  for (const ip of player.hackedIps) touchAccess(player, ip, t0);
  assert.deepEqual(reconcileAccess(player, servers, new Set(), t0 + 60_000), []);
  const later = t0 + rotationMs('bank') + 1;
  const revoked = reconcileAccess(player, servers, new Set(['10.0.0.4']), later);
  assert.deepEqual(revoked, ['10.0.0.2'], 'bank idle rotated; connected and quest kept; personal still within its window');
  assert.ok(!player.hackedIps.includes('10.0.0.2'));
  assert.ok(player.hackedIps.includes('10.0.0.1'));
  // Access with no timestamp (old players) gets a grace period instead of being revoked.
  const old: any = { hackedIps: ['10.0.0.2'], accessAt: undefined };
  assert.deepEqual(reconcileAccess(old, servers, new Set(), later), []);
  assert.equal(old.accessAt['10.0.0.2'], later);
});
