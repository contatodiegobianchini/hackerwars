import type { HuntKind, ProcessType, ServerType } from '../types/game.js';

/** Seconds an action takes off the police trace. Keep in sync with server/src/engine/traceHeat.ts. */
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

/** Who comes after you, and when. Keep in sync with server/src/engine/HuntEngine.ts. */
export const HUNT_MINUTES: Record<ServerType, number> = {
  personal: 10, university: 10, isp: 8, darkweb: 8, corporate: 6, bank: 4, government: 4, honeypot: 2, cartel: 3,
};
export const HUNT_KIND_BY_TYPE: Record<ServerType, HuntKind> = {
  personal: 'reset', university: 'reset', isp: 'reset', darkweb: 'reset', corporate: 'fine', bank: 'raid', government: 'raid', honeypot: 'raid', cartel: 'cartel',
};
export const HUNT_KIND_TEXT: Record<HuntKind, string> = {
  reset: 'o administrador troca a senha e você perde o acesso root',
  fine: 'a segurança da empresa te identifica: multa e perda do acesso root',
  raid: 'a polícia federal emite um mandado contra você',
  cartel: 'o cartel manda sicários atrás de você',
};

export const formatCountdown = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};
