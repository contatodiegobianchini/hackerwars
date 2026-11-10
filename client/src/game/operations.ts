import type { DarknetContract, Mission, Player, StoryChapter, VirtualServer } from '../types/game.js';
import { crackerVersion, shortChapterTitle } from './nextStep.js';

export type OperationKind = 'story' | 'contract' | 'syndicate';
/** ready: reward waiting · active: in progress · available: can start · blocked: missing tool · locked: story gated · done */
export type OperationState = 'ready' | 'active' | 'available' | 'blocked' | 'locked' | 'done';

export interface OperationObjective { text: string; done: boolean; }

export interface Operation {
  key: string;
  kind: OperationKind;
  id: string;
  title: string;
  source: string;
  targetIp?: string;
  targetName?: string;
  description: string;
  rewardCash: number;
  rewardBtc: number;
  rewardRep: number;
  /** Story rewards depend on the choice: show "até". */
  rewardIsMax?: boolean;
  state: OperationState;
  blocker?: string;
  /** What fixes the blocker. */
  fix?: 'software' | 'black_market';
  objectives: OperationObjective[];
  /** Rotating contracts expire; the daily one ends at midnight. */
  expiresAt?: number;
  isDaily?: boolean;
  /** Style stars in progress (accepted contracts only). */
  style?: { notTraced: boolean; clean: boolean };
}

/** Same rule as server/src/engine/contractBoard.ts rateStyle. */
export function previewStyle(player: Player, mission: Mission, server?: VirtualServer) {
  const since = mission.acceptedAt || 0;
  const tracedAt = player.tracedIps?.[mission.targetIp] || 0;
  const notTraced = tracedAt === 0 || tracedAt < since;
  const tracks = (server?.logs || []).filter(l => l.timestamp >= since && (l.ip === player.ip || l.action?.includes(player.ip)));
  const hunted = (player.pendingHunts || []).some(h => h.ip === mission.targetIp);
  return { notTraced, clean: tracks.length === 0 && !hunted };
}

const v = (n: number) => `v${n.toFixed(1).replace('.', ',')}`;

const MISSION_ACTION: Record<Mission['type'], (m: Mission) => string> = {
  steal_file: m => `Baixar ${m.requiredFileName || 'o arquivo'}`,
  wipe_server: () => 'Apagar os logs do servidor',
  hack_bank: () => 'Executar o mega-assalto',
  plant_virus: () => 'Implantar spyware',
  ddos_target: () => 'Derrubar o servidor com DDoS',
  trace_hacker: () => 'Obter acesso root',
};

const CONTRACT_ACTION: Record<DarknetContract['type'], (c: DarknetContract) => string> = {
  steal_file: c => `Baixar ${c.targetFileName || 'um arquivo do servidor'}`,
  ddos_shutdown: () => 'Derrubar o servidor com DDoS',
  plant_miner: () => 'Instalar um minerador',
  siphon_bank: () => 'Executar o mega-assalto',
};

/** Same rule the server uses in ContractsAndRaidEngine.isContractObjectiveDone. */
export function syndicateObjectiveDone(player: Player, contract: DarknetContract, server?: VirtualServer): boolean {
  const ip = contract.targetIp;
  if (!player.hackedIps.includes(ip) && contract.type !== 'ddos_shutdown') return false;
  const did = (op: string) => !!player.operationLog?.[`${op}:${ip}`];
  switch (contract.type) {
    case 'steal_file': {
      if (contract.targetFileName) {
        const wanted = contract.targetFileName.toLowerCase();
        return player.software.some(s => s.name?.toLowerCase() === wanted);
      }
      const names = new Set((server?.files || []).map(f => f.name.toLowerCase()));
      return did('download') || player.software.some(s => names.has(s.name?.toLowerCase()));
    }
    case 'ddos_shutdown': return did('ddos');
    case 'plant_miner': return !!server?.activeMiners?.some(m => m.ownerId === player.id);
    case 'siphon_bank': return did('bank_heist');
    default: return false;
  }
}

export interface OperationsInput {
  player: Player;
  storyChapters: StoryChapter[];
  missions: Mission[];
  contracts: DarknetContract[];
  servers: VirtualServer[];
}

const STATE_ORDER: Record<OperationState, number> = { ready: 0, active: 1, available: 2, blocked: 3, locked: 4, done: 5 };
const KIND_ORDER: Record<OperationKind, number> = { story: 0, contract: 1, syndicate: 2 };

/** One list for story chapters, contracts and Syndicate jobs, with what blocks each one. */
export function buildOperations({ player, storyChapters, missions, contracts, servers }: OperationsInput, now = Date.now()): Operation[] {
  const cracker = crackerVersion(player);
  const serverOf = (ip?: string) => (ip ? servers.find(s => s.ip === ip) : undefined);
  const hasSoftware = (type: string) => player.software.some(s => s.type === type);
  const crackBlocker = (ip: string, required?: number) => {
    if (player.hackedIps.includes(ip)) return undefined;
    const need = required ?? serverOf(ip)?.security.hasherLevel;
    return need !== undefined && cracker < need ? `Precisa de cracker ${v(need)} (o seu é ${v(cracker)})` : undefined;
  };
  const ops: Operation[] = [];

  for (const chapter of storyChapters) {
    const done = chapter.isCompleted;
    const allObjectives = chapter.objectives.length > 0 && chapter.objectives.every(o => o.completed);
    const pendingCrack = chapter.objectives.find(o => !o.completed && (o.type === 'crack' || o.type === 'download' || o.type === 'wipe_logs' || o.type === 'spyware' || o.type === 'bank_heist'));
    const blocker = !done && chapter.unlocked && pendingCrack ? crackBlocker(pendingCrack.targetIp) : undefined;
    const state: OperationState = done ? 'done' : !chapter.unlocked ? 'locked' : allObjectives ? 'ready' : blocker ? 'blocked' : 'active';
    ops.push({
      key: `story:${chapter.id}`,
      kind: 'story',
      id: chapter.id,
      title: `Capítulo ${chapter.chapterNumber}: ${shortChapterTitle(chapter)}`,
      source: chapter.factionName,
      targetIp: chapter.targetIp,
      targetName: chapter.targetHostname,
      description: chapter.briefing,
      rewardCash: Math.max(0, ...chapter.choices.map(c => c.rewardCash || 0)),
      rewardBtc: Math.max(0, ...chapter.choices.map(c => c.rewardBtc || 0)),
      rewardRep: Math.max(0, ...chapter.choices.map(c => c.rewardRep || 0)),
      rewardIsMax: chapter.choices.length > 1,
      state,
      blocker: state === 'locked' ? `Conclua o capítulo ${chapter.chapterNumber - 1} primeiro` : blocker,
      fix: blocker ? 'software' : undefined,
      objectives: chapter.objectives.map(o => ({ text: o.text, done: done || o.completed })),
    });
  }

  const active = player.activeMissions || [];
  const activeIds = new Set(active.map(m => m.id));
  const completedIds = new Set(player.completedMissionIds || []);
  const missionList: Array<{ mission: Mission; accepted: boolean }> = [
    ...active.map(mission => ({ mission, accepted: true })),
    ...missions.filter(m => !activeIds.has(m.id) && !completedIds.has(m.id) && (!m.expiresAt || m.expiresAt > now)).map(mission => ({ mission, accepted: false })),
  ];
  for (const { mission, accepted } of missionList) {
    const ready = accepted && !!player.missionProgress?.[mission.id];
    const needsBreach = mission.type !== 'ddos_target';
    let blocker = needsBreach ? crackBlocker(mission.targetIp) : undefined;
    let fix: Operation['fix'] = blocker ? 'software' : undefined;
    if (!blocker && mission.type === 'plant_virus' && !hasSoftware('spyware')) { blocker = 'Precisa de um spyware'; fix = 'black_market'; }
    const state: OperationState = ready ? 'ready' : blocker ? 'blocked' : accepted ? 'active' : 'available';
    ops.push({
      key: `contract:${mission.id}`,
      kind: 'contract',
      id: mission.id,
      title: mission.title,
      source: mission.employer,
      targetIp: mission.targetIp,
      targetName: serverOf(mission.targetIp)?.hostname || mission.targetDomain,
      description: mission.description,
      rewardCash: mission.rewardCash,
      rewardBtc: mission.rewardCrypto,
      rewardRep: mission.rewardRep,
      state,
      blocker: ready ? undefined : blocker,
      fix: ready ? undefined : fix,
      objectives: [
        ...(needsBreach ? [{ text: 'Invadir o servidor', done: player.hackedIps.includes(mission.targetIp) }] : []),
        { text: MISSION_ACTION[mission.type](mission), done: ready },
      ],
      expiresAt: accepted ? undefined : mission.expiresAt,
      isDaily: mission.isDaily,
      style: accepted ? previewStyle(player, mission, serverOf(mission.targetIp)) : undefined,
    });
  }

  const deliveredContracts = new Set(player.completedContractIds || []);
  for (const contract of contracts) {
    const server = serverOf(contract.targetIp);
    const delivered = deliveredContracts.has(contract.id);
    const objectiveDone = syndicateObjectiveDone(player, contract, server);
    const blocker = cracker < contract.requiredCrackerLevel ? `Precisa de cracker ${v(contract.requiredCrackerLevel)} (o seu é ${v(cracker)})` : undefined;
    const state: OperationState = delivered ? 'done' : blocker ? 'blocked' : objectiveDone ? 'ready' : 'available';
    ops.push({
      key: `syndicate:${contract.id}`,
      kind: 'syndicate',
      id: contract.id,
      title: contract.title,
      source: 'Syndicate',
      targetIp: contract.targetIp,
      targetName: contract.targetHostname,
      description: contract.description,
      rewardCash: contract.rewardCash,
      rewardBtc: contract.rewardCryptoBtc || 0,
      rewardRep: contract.rewardRep,
      state,
      blocker: state === 'blocked' ? blocker : undefined,
      fix: state === 'blocked' ? 'software' : undefined,
      objectives: [
        ...(contract.type !== 'ddos_shutdown' ? [{ text: 'Invadir o servidor', done: player.hackedIps.includes(contract.targetIp) }] : []),
        { text: CONTRACT_ACTION[contract.type](contract), done: delivered || objectiveDone },
      ],
    });
  }

  return ops.sort((a, b) =>
    STATE_ORDER[a.state] - STATE_ORDER[b.state]
    || Number(!!b.isDaily) - Number(!!a.isDaily)
    || KIND_ORDER[a.kind] - KIND_ORDER[b.kind]
    || (a.kind === 'story' ? a.id.localeCompare(b.id, undefined, { numeric: true }) : b.rewardCash - a.rewardCash));
}
