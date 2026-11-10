import type { SoftwareItem } from '../types/game.js';

/** The highest version the player owns of a software type (players can hold several copies). */
export function bestSoftware(software: SoftwareItem[] | undefined, type: string): SoftwareItem | undefined {
  let best: SoftwareItem | undefined;
  for (const s of software || []) {
    if (s.type === type && (!best || (s.version || 0) > (best.version || 0))) best = s;
  }
  return best;
}
