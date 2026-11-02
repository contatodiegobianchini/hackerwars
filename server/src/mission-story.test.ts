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
  assert.equal(player.cash, 500);

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
