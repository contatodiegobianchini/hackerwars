import type { ProcessType } from '../types/game.js';

/**
 * Seconds an action takes off the police trace while connected to a monitored
 * target. Noisy or large operations bring the police closer, so the player has
 * to choose between taking everything and getting out in time.
 *
 * Keep in sync with client/src/game/traceHeat.ts.
 */
export function traceHeatSeconds(type: ProcessType, sizeMb = 0): number {
  switch (type) {
    case 'scan': return 3;
    case 'crack': return 6;
    case 'download': return Math.min(20, 3 + Math.ceil(sizeMb / 25));
    case 'upload': return 8;
    case 'plant_spyware': return 8;
    case 'wipelog': return 4;
    case 'editlog': return 2;
    case 'ddos': return 12;
    case 'mass_bank_heist': return 20;
    default: return 0;
  }
}

export const HEAT_LABELS: Partial<Record<ProcessType, string>> = {
  scan: 'varredura de portas',
  crack: 'quebra de senha',
  download: 'download',
  upload: 'instalação de minerador',
  plant_spyware: 'implante de spyware',
  wipelog: 'limpeza de logs',
  editlog: 'edição de log',
  ddos: 'ataque DDoS',
  mass_bank_heist: 'mega-assalto',
};
