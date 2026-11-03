import type { Player } from '../types/game.js';

/** Same rules as the server (engine/cyberCoins.ts). */
export const speedUpCost = (remainingMs: number) => Math.max(1, Math.ceil(remainingMs / 15_000));
export const coinBalance = (player: Player) => player.cyberCoins || 0;
export const turboActive = (player: Player, now = Date.now()) => (player.turboUntil || 0) > now;

export const TURBO_OFFERS = [
  { id: 'turbo_1h', cost: 40, label: 'Turbo 2x · 1 hora', hint: 'Processos novos levam metade do tempo.' },
  { id: 'turbo_24h', cost: 240, label: 'Turbo 2x · 24 horas', hint: 'O dia todo com tudo em dobro. Sai mais barato por hora.' },
] as const;

export interface CoinPackage { id: string; coins: number; bonus: number; priceCents: number; label: string; }
export const formatBRL = (cents: number) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
