import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOperations } from './operations.js';

const server = (ip: string, hasher: number, extra: any = {}) => ({
  ip, hostname: `host-${ip}`, type: 'corporate', security: { hasherLevel: hasher }, files: [], activeMiners: [], ...extra,
}) as any;
const player = (extra: any = {}) => ({
  id: 'p', hackedIps: [], software: [{ name: 'Crack', type: 'cracker', version: 1, sizeMb: 1 }],
  activeMissions: [], completedMissionIds: [], completedContractIds: [], ...extra,
}) as any;
const chapter = (n: number, extra: any = {}) => ({
  id: `chap-${n}`, chapterNumber: n, title: `Capítulo ${n}: T`, factionName: 'F', briefing: '', targetIp: '9.9.9.9',
  objectives: [{ id: 'o', text: 'Quebrar', type: 'crack', targetIp: '9.9.9.9', completed: false }],
  choices: [{ rewardCash: 100 }, { rewardCash: 300 }], isCompleted: false, unlocked: true, ...extra,
}) as any;

test('one list with story, contracts and syndicate, ready items first', () => {
  const mission = { id: 'mis-1', title: 'Molho', employer: 'E', type: 'steal_file', targetIp: '1.1.1.1', requiredFileName: 'r.txt', rewardCash: 500, rewardCrypto: 0, rewardRep: 1, description: '' };
  const contract = { id: 'cnt-1', title: 'Fórmula', targetIp: '2.2.2.2', targetHostname: 'h', type: 'steal_file', targetFileName: 'f.pdf', rewardCash: 45000, rewardRep: 1, requiredCrackerLevel: 8, description: '' };
  const ops = buildOperations({
    player: player({ activeMissions: [mission], missionProgress: { 'mis-1': true } }),
    storyChapters: [chapter(1, { isCompleted: true }), chapter(2), chapter(3, { unlocked: false })],
    missions: [mission] as any, contracts: [contract] as any,
    servers: [server('9.9.9.9', 0.5), server('1.1.1.1', 0.5), server('2.2.2.2', 8)],
  });
  assert.equal(ops[0].key, 'contract:mis-1');
  assert.equal(ops[0].state, 'ready');
  assert.equal(ops.find(o => o.key === 'story:chap-2')!.state, 'active');
  assert.equal(ops.find(o => o.key === 'story:chap-3')!.state, 'locked');
  assert.equal(ops.find(o => o.key === 'story:chap-1')!.state, 'done');
  assert.equal(ops.find(o => o.key === 'story:chap-2')!.rewardCash, 300);
  const syn = ops.find(o => o.key === 'syndicate:cnt-1')!;
  assert.equal(syn.state, 'blocked');
  assert.match(syn.blocker!, /v8,0/);
});

test('syndicate steal_file becomes ready only with the file, and done after delivery', () => {
  const contract = { id: 'cnt-1', title: 'F', targetIp: '2.2.2.2', targetHostname: 'h', type: 'steal_file', targetFileName: 'f.pdf', rewardCash: 1, rewardRep: 1, requiredCrackerLevel: 1, description: '' };
  const base = { storyChapters: [], missions: [], contracts: [contract] as any, servers: [server('2.2.2.2', 1)] };
  const breached = player({ hackedIps: ['2.2.2.2'] });
  assert.equal(buildOperations({ ...base, player: breached })[0].state, 'available');
  breached.software.push({ name: 'f.pdf', sizeMb: 1 });
  assert.equal(buildOperations({ ...base, player: breached })[0].state, 'ready');
  breached.completedContractIds = ['cnt-1'];
  assert.equal(buildOperations({ ...base, player: breached })[0].state, 'done');
});

test('plant_virus contract without spyware points to the Black Market', () => {
  const mission = { id: 'm', title: 'V', employer: 'E', type: 'plant_virus', targetIp: '1.1.1.1', rewardCash: 1, rewardCrypto: 0, rewardRep: 1, description: '' };
  const op = buildOperations({ player: player(), storyChapters: [], missions: [mission] as any, contracts: [], servers: [server('1.1.1.1', 0.5)] })[0];
  assert.equal(op.state, 'blocked');
  assert.equal(op.fix, 'black_market');
});

test('daily contract comes first, expired contracts disappear, accepted ones show style', () => {
  const now = 1_000_000;
  const base = { employer: 'E', type: 'wipe_server', rewardCrypto: 0, rewardRep: 1, description: '' };
  const missions = [
    { ...base, id: 'gen-old', title: 'Velho', targetIp: '1.1.1.1', rewardCash: 9000, expiresAt: now - 1 },
    { ...base, id: 'gen-a', title: 'A', targetIp: '1.1.1.1', rewardCash: 9000, expiresAt: now + 60_000 },
    { ...base, id: 'daily-x', title: 'Golpe do dia: B', targetIp: '1.1.1.1', rewardCash: 100, isDaily: true, expiresAt: now + 60_000 },
  ] as any[];
  const accepted = { ...base, id: 'gen-c', title: 'C', targetIp: '1.1.1.1', rewardCash: 1, acceptedAt: now - 100 } as any;
  const ops = buildOperations({
    player: player({ activeMissions: [accepted], tracedIps: { '1.1.1.1': now - 50 } }),
    storyChapters: [], missions, contracts: [], servers: [server('1.1.1.1', 0.5)],
  }, now);
  assert.equal(ops.some(o => o.id === 'gen-old'), false);
  const available = ops.filter(o => o.state === 'available');
  assert.equal(available[0].id, 'daily-x');
  const c = ops.find(o => o.id === 'gen-c')!;
  assert.equal(c.style!.notTraced, false);
  assert.equal(c.style!.clean, true);
});
