import test from 'node:test';
import assert from 'node:assert/strict';
import { computeNextStep, suggestContracts } from './nextStep.js';

const server = (ip: string, hasher: number, extra: any = {}) => ({
  id: ip, ip, hostname: `host-${ip}`, type: 'corporate', isOnline: true,
  hardware: { cpuPower: 1, ramGb: 1, hddMb: 100, networkMbps: 10 },
  security: { hasherLevel: hasher, firewallLevel: 1, password: 'x', isBreached: false, openPorts: [] },
  files: [], logs: [], activeMiners: [], ...extra,
}) as any;

const player = (extra: any = {}) => ({
  id: 'p', username: 'neo', ip: '1.1.1.1', cash: 0, crypto: 0, cryptoWallet: {}, reputation: 0, rank: '',
  hardware: { hdd: { capacityMb: 500 }, ram: { maxTasks: 2 } },
  software: [{ name: 'CrackMaster', type: 'cracker', version: 1, sizeMb: 10 }],
  hackedIps: [], activeMissions: [], completedStoryChapters: [], ...extra,
}) as any;

const chapter = (n: number, objectives: any[], extra: any = {}) => ({
  id: `chap-${n}`, chapterNumber: n, title: `Capítulo ${n}: Teste`, factionName: 'Anon', faction: 'anonymous',
  briefing: '', dialogue: [], objectives, choices: [], isCompleted: false, unlocked: true, ...extra,
}) as any;

test('blocked chapter objective explains the missing cracker version', () => {
  const step = computeNextStep({
    player: player(), missions: [], servers: [server('9.9.9.9', 8)],
    storyChapters: [chapter(2, [{ id: 'o', text: 'crack', type: 'crack', targetIp: '9.9.9.9', completed: false }])],
  });
  assert.match(step.blocker || '', /v1,0/);
  assert.match(step.blocker || '', /v8,0/);
  assert.deepEqual(step.primary.action, { kind: 'view', view: 'software' });
});

test('finished chapter asks for the decision before anything else', () => {
  const step = computeNextStep({
    player: player(), missions: [], servers: [],
    storyChapters: [chapter(1, [{ id: 'o', text: 'x', type: 'crack', targetIp: '1.2.3.4', completed: true }])],
  });
  assert.deepEqual(step.primary.action, { kind: 'view', view: 'campaign' });
});

test('ready contract is offered for delivery', () => {
  const mission = { id: 'mis-1', title: 'Molho', employer: 'Rivais', type: 'steal_file', targetIp: '1.2.3.4', rewardCash: 500, rewardCrypto: 0.01, rewardRep: 10 };
  const step = computeNextStep({ player: player({ activeMissions: [mission], missionProgress: { 'mis-1': true } }), missions: [], servers: [], storyChapters: [] });
  assert.deepEqual(step.primary.action, { kind: 'claim', missionId: 'mis-1' });
});

test('breached target with a file objective points to the download, and full disk is a blocker', () => {
  const s = server('5.5.5.5', 1, { files: [{ id: 'f', name: 'receita.txt', sizeMb: 600, version: 1 }] });
  const step = computeNextStep({
    player: player({ hackedIps: ['5.5.5.5'] }), missions: [], servers: [s],
    storyChapters: [chapter(1, [{ id: 'o', text: 'baixar', type: 'download', targetIp: '5.5.5.5', targetFileName: 'receita.txt', completed: false }])],
  });
  assert.match(step.title, /receita\.txt/);
  assert.match(step.blocker || '', /600 MB/);
});

test('suggestions only include contracts the current cracker can handle', () => {
  const missions = [
    { id: 'a', title: 'Fácil', type: 'steal_file', targetIp: '1.1.1.2', rewardCash: 100 },
    { id: 'b', title: 'Difícil', type: 'steal_file', targetIp: '1.1.1.3', rewardCash: 9000 },
  ] as any[];
  const list = suggestContracts({ player: player(), storyChapters: [], missions, servers: [server('1.1.1.2', 0.8), server('1.1.1.3', 20)] });
  assert.deepEqual(list.map(s => s.mission.id), ['a']);
});
