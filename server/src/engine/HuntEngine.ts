import { v4 as uuidv4 } from 'uuid';
import type { HuntKind, PendingHunt, Player, ServerType, VirtualServer } from '../types/game.js';

/**
 * Consequences for leaving tracks behind (idea from Uplink: after a job, someone
 * comes after you). When the player leaves a breached server with their own IP
 * still in its logs, the owner reacts after a delay that depends on who they
 * are. Going back and wiping the logs before the deadline cancels it. Logs that
 * show a proxy IP instead of the player's protect them.
 */

/** Only tracks left after this feature shipped count, so old logs don't punish anyone. */
export const HUNT_FEATURE_START = Date.parse('2026-11-02T21:00:00Z');

export interface HuntProfile { kind: HuntKind; delayMs: number; }

const MIN = 60_000;
export const HUNT_PROFILES: Record<ServerType, HuntProfile> = {
  personal: { kind: 'reset', delayMs: 10 * MIN },
  university: { kind: 'reset', delayMs: 10 * MIN },
  isp: { kind: 'reset', delayMs: 8 * MIN },
  darkweb: { kind: 'reset', delayMs: 8 * MIN },
  corporate: { kind: 'fine', delayMs: 6 * MIN },
  bank: { kind: 'raid', delayMs: 4 * MIN },
  government: { kind: 'raid', delayMs: 4 * MIN },
  honeypot: { kind: 'raid', delayMs: 2 * MIN },
  cartel: { kind: 'cartel', delayMs: 3 * MIN },
};

export const huntProfile = (type: ServerType): HuntProfile => HUNT_PROFILES[type] || HUNT_PROFILES.corporate;

/** Log entries on this server that point straight at the player. */
export function playerTracks(player: Player, server: VirtualServer, since = HUNT_FEATURE_START) {
  return (server.logs || []).filter(l => l.timestamp >= since && (l.ip === player.ip || l.action?.includes(player.ip)));
}

/**
 * Updates player.pendingHunts against the world: opens a hunt for each breached
 * server the player left with fresh tracks, and cancels hunts whose tracks are
 * gone. Returns the hunts that are due now (and removes them from the list).
 */
export function reconcileHunts(player: Player, servers: Iterable<VirtualServer>, now = Date.now()): { due: PendingHunt[]; opened: PendingHunt[]; cancelled: PendingHunt[] } {
  const pending = player.pendingHunts || [];
  const byIp = new Map(pending.map(h => [h.ip, h]));
  const keep: PendingHunt[] = [];
  const due: PendingHunt[] = [];
  const opened: PendingHunt[] = [];
  const cancelled: PendingHunt[] = [];
  const seen = new Set<string>();

  for (const server of servers) {
    if (!player.hackedIps?.includes(server.ip)) continue;
    const dirty = playerTracks(player, server).length > 0;
    const existing = byIp.get(server.ip);
    seen.add(server.ip);
    if (!dirty) {
      if (existing) cancelled.push(existing);
      continue;
    }
    // Still connected to it: the clock only starts once the player leaves.
    if (player.connectedIp === server.ip) {
      if (existing) keep.push(existing);
      continue;
    }
    if (existing) {
      if (existing.dueAt <= now) due.push(existing); else keep.push(existing);
      continue;
    }
    const profile = huntProfile(server.type);
    const hunt: PendingHunt = {
      id: `hunt-${uuidv4().substring(0, 8)}`,
      ip: server.ip,
      hostname: server.hostname,
      serverType: server.type,
      kind: profile.kind,
      createdAt: now,
      dueAt: now + profile.delayMs,
    };
    opened.push(hunt);
    keep.push(hunt);
  }
  // Servers that no longer exist (admin reset) drop their hunts.
  for (const h of pending) if (!seen.has(h.ip)) cancelled.push(h);

  player.pendingHunts = keep;
  return { due, opened, cancelled };
}

export const HUNT_KIND_TEXT: Record<HuntKind, string> = {
  reset: 'o administrador troca a senha e você perde o acesso root',
  fine: 'a segurança da empresa te identifica: multa e perda do acesso root',
  raid: 'a polícia federal emite um mandado contra você',
  cartel: 'o cartel manda sicários atrás de você',
};
