import type { Player, ServerType, VirtualServer } from '../types/game.js';

/**
 * The world reacts (idea from Uplink and Hacknet):
 * - Patches: a server that gets cracked a lot in a short time is hardened by its
 *   admins (Hasher and firewall go up in half steps) and relaxes again after an
 *   hour with no breaches. Servers tied to quests are exempt so nobody gets stuck.
 * - Password rotation: root access is not forever. If a player leaves a server
 *   alone for long enough, its admins rotate the password and the access is gone.
 */

const MIN = 60_000;
export const PATCH_WINDOW_MS = 30 * MIN;
export const PATCH_THRESHOLD = 4;
export const RELAX_AFTER_MS = 60 * MIN;
export const PATCH_STEP = 0.5;

/** How many patches a server can stack: bigger servers harden more. */
export const maxPatchLevel = (base: number) => Math.max(1, Math.min(6, Math.floor(base)));

export function recordBreach(server: VirtualServer, now = Date.now()) {
  server.breachTimes = [...(server.breachTimes || []).filter(t => now - t < PATCH_WINDOW_MS), now];
  server.lastBreachAt = now;
}

const round1 = (n: number) => Number(n.toFixed(1));

/** Applies a patch or relaxes one. Returns what happened, so the caller can announce it. */
export function reconcilePatch(server: VirtualServer, now = Date.now(), exempt = false): 'patched' | 'relaxed' | null {
  if (server.hidden || server.type === 'honeypot') return null;
  const recent = (server.breachTimes || []).filter(t => now - t < PATCH_WINDOW_MS);
  server.breachTimes = recent;
  const level = server.patchLevel || 0;
  const base = server.baseHasher ?? server.security.hasherLevel;

  if (!exempt && recent.length >= PATCH_THRESHOLD && level < maxPatchLevel(base)) {
    server.baseHasher = base;
    server.patchLevel = level + 1;
    server.security.hasherLevel = round1(base + server.patchLevel * PATCH_STEP);
    server.security.firewallLevel = round1(server.security.firewallLevel + PATCH_STEP);
    server.breachTimes = [];
    server.patchedAt = now;
    return 'patched';
  }
  if (level > 0 && now - Math.max(server.patchedAt || 0, server.lastBreachAt || 0) > RELAX_AFTER_MS) {
    server.patchLevel = level - 1;
    server.security.hasherLevel = round1(base + server.patchLevel * PATCH_STEP);
    server.security.firewallLevel = round1(Math.max(0.5, server.security.firewallLevel - PATCH_STEP));
    server.patchedAt = now;
    if (server.patchLevel === 0) delete server.baseHasher;
    return 'relaxed';
  }
  return null;
}

/** Idle time before the admins rotate the password, by who owns the server. */
export const ROTATION_MS: Record<ServerType, number> = {
  personal: 6 * 60 * MIN,
  university: 6 * 60 * MIN,
  isp: 6 * 60 * MIN,
  darkweb: 6 * 60 * MIN,
  corporate: 4 * 60 * MIN,
  bank: 2 * 60 * MIN,
  government: 2 * 60 * MIN,
  cartel: 2 * 60 * MIN,
  honeypot: 30 * MIN,
};
export const rotationMs = (type: ServerType) => ROTATION_MS[type] ?? ROTATION_MS.corporate;

/** Marks the access to this server as just used. */
export function touchAccess(player: Player, ip: string, now = Date.now()) {
  player.accessAt = { ...(player.accessAt || {}), [ip]: now };
}

/**
 * Drops root access the player has not used for too long. The server they are
 * connected to and the ones tied to their quests are never rotated. Returns the
 * IPs that were revoked.
 */
export function reconcileAccess(player: Player, servers: Map<string, VirtualServer>, protectedIps: Set<string>, now = Date.now()): string[] {
  const accessAt = { ...(player.accessAt || {}) };
  const revoked: string[] = [];
  for (const ip of player.hackedIps || []) {
    const server = servers.get(ip);
    if (!server) continue;
    if (ip === player.connectedIp || protectedIps.has(ip) || accessAt[ip] === undefined) { accessAt[ip] = now; continue; }
    if (now - accessAt[ip] > rotationMs(server.type)) revoked.push(ip);
  }
  for (const ip of revoked) delete accessAt[ip];
  player.accessAt = accessAt;
  if (revoked.length) player.hackedIps = player.hackedIps.filter(ip => !revoked.includes(ip));
  return revoked;
}
