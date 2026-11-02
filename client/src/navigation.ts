import type { LucideIcon } from 'lucide-react';
import { Home, Globe2, Crosshair, Cpu, Wallet } from 'lucide-react';
import type { GameView } from './stores/useGameStore.js';

export type ZoneId = 'inicio' | 'rede' | 'operacoes' | 'base' | 'dinheiro' | 'admin';

export interface ZoneTab { view: GameView; label: string; }
export interface Zone { id: ZoneId; label: string; hint: string; icon: LucideIcon; tabs: ZoneTab[]; }

/** The five zones follow the game loop: discover → breach → exploit → vanish → invest. */
export const ZONES: Zone[] = [
  { id: 'inicio', label: 'Início', hint: 'O que fazer agora', icon: Home, tabs: [
    { view: 'my_server', label: 'Visão geral' },
    { view: 'processes', label: 'Processos' },
    { view: 'tutorial', label: 'Guia do jogo' },
  ] },
  { id: 'rede', label: 'Rede', hint: 'Descobrir e invadir', icon: Globe2, tabs: [
    { view: 'known_servers', label: 'Alvos' },
    { view: 'target_server', label: 'Alvo conectado' },
  ] },
  { id: 'operacoes', label: 'Operações', hint: 'História e contratos', icon: Crosshair, tabs: [
    { view: 'campaign', label: 'História' },
    { view: 'missions', label: 'Contratos' },
  ] },
  { id: 'base', label: 'Base', hint: 'Sua máquina', icon: Cpu, tabs: [
    { view: 'software', label: 'Software' },
    { view: 'hardware', label: 'Hardware' },
    { view: 'antivirus', label: 'Defesa' },
    { view: 'logs', label: 'Meus logs' },
    { view: 'datacenter', label: 'Datacenter' },
  ] },
  { id: 'dinheiro', label: 'Dinheiro', hint: 'Lucrar e gastar', icon: Wallet, tabs: [
    { view: 'bank', label: 'Banco' },
    { view: 'crypto', label: 'Cripto' },
    { view: 'black_market', label: 'Black Market' },
    { view: 'clans', label: 'Clãs' },
    { view: 'leaderboard', label: 'Ranking' },
  ] },
];

export const ADMIN_ZONE: Zone = { id: 'admin', label: 'Administração', hint: 'Controle do servidor', icon: Cpu, tabs: [{ view: 'admin_panel', label: 'Painel' }] };

export function zoneOfView(view: GameView): Zone {
  return ZONES.find(z => z.tabs.some(t => t.view === view)) || (view === 'admin_panel' ? ADMIN_ZONE : ZONES[0]);
}
