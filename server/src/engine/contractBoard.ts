import { v4 as uuidv4 } from 'uuid';
import type { Mission, MissionDifficulty, MissionType, Player, VirtualServer } from '../types/game.js';
import { playerTracks } from './HuntEngine.js';

/**
 * Rotating contract board: there are always contracts on real servers across
 * difficulty tiers, they expire and get replaced, plus one "golpe do dia" with
 * a bigger reward. Contracts are rated with stars for style.
 */

export type Rng = () => number;

export function seededRng(seed: string): Rng {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => {
    h += 0x6D2B79F5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T>(rng: Rng, list: T[]): T => list[Math.floor(rng() * list.length)];

/** Game day in Brazil time (UTC-3). */
export const dayKey = (now = Date.now()) => new Date(now - 3 * 3600_000).toISOString().slice(0, 10);
export const dayEnd = (key: string) => Date.parse(`${key}T03:00:00Z`) + 24 * 3600_000;
export const previousDayKey = (key: string) => dayKey(Date.parse(`${key}T03:00:00Z`) - 3600_000);

const EMPLOYERS = ['Guerrilha da Pizza', 'Anti-Pear Resistance', 'Meme Cartel', 'NullByte Syndicate', 'RedTeam Anonymous', 'Fãs Revoltados', 'Sindicato dos Estagiários', 'Tia do Zap Investigações'];

export const difficultyFor = (hasher: number): MissionDifficulty => hasher < 3 ? 'Easy' : hasher < 15 ? 'Medium' : hasher < 30 ? 'Hard' : 'Elite';
const MULTIPLIER: Record<MissionDifficulty, number> = { Easy: 1, Medium: 2.5, Hard: 5, Elite: 10, Legendary: 15 };

/** Builds one contract on a server. `rewardBoost` multiplies the base reward. */
export function makeContract(server: VirtualServer, rng: Rng, opts: { id?: string; expiresAt?: number; rewardBoost?: number; isDaily?: boolean; dayKey?: string } = {}): Mission {
  const files = (server.files || []).filter(f => f?.name);
  const options: Array<{ type: MissionType; fileName?: string }> = [];
  if (files.length > 0) options.push({ type: 'steal_file', fileName: pick(rng, files).name });
  options.push({ type: 'wipe_server' });
  options.push({ type: 'plant_virus' });
  if (server.type === 'bank') options.push({ type: 'hack_bank' });
  const choice = pick(rng, options);

  const hasher = server.security?.hasherLevel || 1;
  const difficulty = difficultyFor(hasher);
  const mult = MULTIPLIER[difficulty] * (opts.rewardBoost || 1);
  const host = server.hostname;
  const titles: Record<MissionType, string> = {
    steal_file: `Vazar ${choice.fileName} de ${host}`,
    wipe_server: `Apagar o passado de ${host}`,
    plant_virus: `Grampear ${host}`,
    hack_bank: `Esvaziar o cofre de ${host}`,
    ddos_target: `Derrubar ${host}`,
    trace_hacker: `Invadir ${host}`,
  };
  const objective: Record<MissionType, string> = {
    steal_file: `invada o servidor e baixe ${choice.fileName}`,
    wipe_server: 'invada o servidor e apague todos os logs de acesso',
    plant_virus: 'invada o servidor e implante um spyware',
    hack_bank: 'invada o banco e execute o mega-assalto',
    ddos_target: 'derrube o servidor com um DDoS',
    trace_hacker: 'obtenha acesso root',
  };
  const employer = pick(rng, EMPLOYERS);

  return {
    id: opts.id || `gen-${uuidv4().substring(0, 8)}`,
    title: opts.isDaily ? `Golpe do dia: ${titles[choice.type]}` : titles[choice.type],
    employer,
    description: `${employer} paga para você agir contra ${host} (${server.ip}): ${objective[choice.type]}. Bônus por não ser rastreado e por não deixar rastros.`,
    type: choice.type,
    targetIp: server.ip,
    targetDomain: server.domain,
    requiredFileName: choice.fileName,
    rewardCash: Math.round(750 * mult),
    rewardCrypto: Number((0.015 * mult).toFixed(4)),
    rewardRep: Math.round(120 * mult),
    difficulty,
    status: 'available',
    expiresAt: opts.expiresAt,
    isDaily: opts.isDaily,
    dayKey: opts.dayKey,
  };
}

/** How many rotating contracts each difficulty tier keeps on the board. */
export const BOARD_TIERS: Array<{ maxHasher: number; count: number }> = [
  { maxHasher: 3, count: 2 },
  { maxHasher: 15, count: 2 },
  { maxHasher: 30, count: 1 },
  { maxHasher: Infinity, count: 1 },
];
export const CONTRACT_TTL_MS = 2 * 3600_000;

const eligible = (servers: VirtualServer[]) => servers.filter(s => s?.ip && s.type !== 'honeypot' && !s.hidden);
const tierOf = (hasher: number) => BOARD_TIERS.findIndex(t => hasher < t.maxHasher || t.maxHasher === Infinity);

/**
 * Returns the board after dropping expired generated contracts and topping up
 * each tier (and today's daily). Static story-like contracts are kept as they are.
 */
export function refreshBoard(board: Mission[], servers: VirtualServer[], now = Date.now(), rng: Rng = Math.random): Mission[] {
  const today = dayKey(now);
  const kept = board.filter(m => {
    if (m.isDaily) return m.dayKey === today;
    return !m.expiresAt || m.expiresAt > now;
  });

  const pool = eligible(servers);
  if (pool.length === 0) return kept;

  if (!kept.some(m => m.isDaily)) {
    const dailyRng = seededRng(`daily-${today}`);
    // Reachable after a little progress (Hasher 1 to 8) so most players can try it.
    const mid = pool.filter(s => (s.security?.hasherLevel || 0) >= 1 && (s.security?.hasherLevel || 0) <= 8);
    const server = pick(dailyRng, mid.length ? mid : pool);
    kept.push(makeContract(server, dailyRng, { id: `daily-${today}`, isDaily: true, dayKey: today, expiresAt: dayEnd(today), rewardBoost: 3 }));
  }

  const generated = kept.filter(m => m.expiresAt && !m.isDaily);
  BOARD_TIERS.forEach((tier, index) => {
    const have = generated.filter(m => tierOf(pool.find(s => s.ip === m.targetIp)?.security?.hasherLevel || 0) === index).length;
    const candidates = pool.filter(s => tierOf(s.security?.hasherLevel || 0) === index);
    for (let i = have; i < tier.count && candidates.length; i++) {
      const taken = new Set(kept.map(m => m.targetIp));
      const fresh = candidates.filter(s => !taken.has(s.ip));
      const server = pick(rng, fresh.length ? fresh : candidates);
      // Staggered expiry so the board never empties all at once.
      kept.push(makeContract(server, rng, { expiresAt: now + CONTRACT_TTL_MS + Math.floor(rng() * 40 * 60_000) }));
    }
  });
  return kept;
}

export interface StyleResult { notTraced: boolean; clean: boolean; stars: number; }

/**
 * Style stars: 1 for completing, +1 if the police never finished a trace on the
 * target after the contract was accepted, +1 if no log there points at the
 * player and there is no pending hunt for it.
 */
export function rateStyle(player: Player, mission: Mission, server?: VirtualServer): StyleResult {
  const since = mission.acceptedAt || 0;
  const tracedAt = player.tracedIps?.[mission.targetIp] || 0;
  const notTraced = tracedAt < since || tracedAt === 0;
  const tracks = server ? playerTracks(player, server, since) : [];
  const hunted = (player.pendingHunts || []).some(h => h.ip === mission.targetIp);
  const clean = tracks.length === 0 && !hunted;
  return { notTraced, clean, stars: 1 + (notTraced ? 1 : 0) + (clean ? 1 : 0) };
}

export const STAR_BONUS = 0.25;
export const streakBonus = (count: number) => Math.min(0.5, Math.max(0, count - 1) * 0.1);
