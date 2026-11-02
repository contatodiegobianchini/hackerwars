import type { GameProcess, VirtualServer } from '../types/game.js';

export const PROCESS_LABELS: Record<string, string> = {
  crack: 'Quebrando senha',
  download: 'Baixando',
  upload: 'Enviando',
  scan: 'Varredura de portas',
  compile: 'Compilando',
  wipelog: 'Apagando logs',
  editlog: 'Editando log',
  ddos: 'Ataque DDoS',
  mine: 'Minerando',
  antivirus_scan: 'Varredura de vírus',
  plant_spyware: 'Implantando spyware',
  mass_bank_heist: 'Mega-assalto',
  upgrade_hardware: 'Instalando hardware',
};

export const SERVER_TYPE_LABELS: Record<VirtualServer['type'], string> = {
  personal: 'Pessoal',
  bank: 'Banco',
  government: 'Governo',
  corporate: 'Corporativo',
  darkweb: 'Dark web',
  isp: 'Provedor',
  university: 'Universidade',
  honeypot: 'Armadilha',
  cartel: 'Cartel',
};

export function processTitle(p: GameProcess): string {
  const base = PROCESS_LABELS[p.type] || p.type;
  if (p.type === 'download' && p.targetFileName) return `${base} ${p.targetFileName}`;
  return p.targetIp ? `${base} · ${p.targetIp}` : base;
}

export function secondsLeft(p: GameProcess, now = Date.now()): number {
  return Math.max(0, Math.ceil((p.endTime - now) / 1000));
}

export const versionLabel = (v: number) => `v${v.toFixed(1).replace('.', ',')}`;
