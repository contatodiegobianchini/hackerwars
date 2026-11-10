import type { Player, ServerType } from '../types/game.js';

const MIN = 60_000;
/** Same windows as the server: idle time before the admins rotate the password. */
export const ROTATION_MS: Record<ServerType, number> = {
  personal: 360 * MIN, university: 360 * MIN, isp: 360 * MIN, darkweb: 360 * MIN,
  corporate: 240 * MIN, bank: 120 * MIN, government: 120 * MIN, cartel: 120 * MIN, honeypot: 30 * MIN,
};

export const rotationWindow = (type: ServerType) => ROTATION_MS[type] ?? ROTATION_MS.corporate;

/** Time left before the root access expires, or null when it does not apply. */
export function accessTimeLeft(player: Player, ip: string, type: ServerType, now = Date.now()): number | null {
  if (!player.hackedIps?.includes(ip) || player.connectedIp === ip) return null;
  const last = player.accessAt?.[ip];
  if (last === undefined) return null;
  return Math.max(0, last + rotationWindow(type) - now);
}

export const formatWindow = (ms: number) => {
  const min = Math.round(ms / MIN);
  return min >= 60 ? `${Math.floor(min / 60)} h${min % 60 ? ` ${min % 60} min` : ''}` : `${min} min`;
};
