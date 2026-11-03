import type { Player } from '../types/game.js';

/**
 * CyberCoins: premium currency bought with real money (Stripe Checkout) and spent
 * only on speed. It never buys cash, reputation, software or anything that
 * changes what a player can do, only how fast: finishing a running process now,
 * or a 2x speed Turbo for a while. Police traces and hunts cannot be skipped.
 */

export interface CoinPackage { id: string; coins: number; bonus: number; priceCents: number; label: string; }

/** Prices in BRL cents. `bonus` coins are included in `coins`. */
export const COIN_PACKAGES: CoinPackage[] = [
  { id: 'pack_100', coins: 100, bonus: 0, priceCents: 990, label: 'Pacote Estagiário' },
  { id: 'pack_300', coins: 330, bonus: 30, priceCents: 2490, label: 'Pacote Script Kiddie' },
  { id: 'pack_700', coins: 800, bonus: 100, priceCents: 4990, label: 'Pacote Black Hat' },
  { id: 'pack_1500', coins: 1800, bonus: 300, priceCents: 9990, label: 'Pacote Lenda da Darknet' },
];
export const CURRENCY = 'brl';
export const packageById = (id: unknown) => COIN_PACKAGES.find(p => p.id === id);

export const TURBO_OFFERS = {
  turbo_1h: { id: 'turbo_1h', cost: 40, ms: 60 * 60_000, label: 'Turbo 2x por 1 hora' },
  turbo_24h: { id: 'turbo_24h', cost: 240, ms: 24 * 60 * 60_000, label: 'Turbo 2x por 24 horas' },
} as const;
export type TurboId = keyof typeof TURBO_OFFERS;

/** Cost to finish a running process now: 1 CyberCoin per 15 s left, at least 1. */
export const speedUpCost = (remainingMs: number) => Math.max(1, Math.ceil(remainingMs / 15_000));

export const coinBalance = (player: Player) => player.cyberCoins || 0;
export const turboActive = (player: Player, now = Date.now()) => (player.turboUntil || 0) > now;

export function spendCoins(player: Player, amount: number): boolean {
  if (!Number.isInteger(amount) || amount <= 0 || coinBalance(player) < amount) return false;
  player.cyberCoins = coinBalance(player) - amount;
  return true;
}

/** Credits a paid Checkout session once. Returns false when it was already credited. */
export function grantPurchase(player: Player, sessionId: string, coins: number): boolean {
  const done = player.paidSessions || [];
  if (done.includes(sessionId)) return false;
  player.cyberCoins = coinBalance(player) + coins;
  player.paidSessions = [...done, sessionId].slice(-500);
  return true;
}

/** Buying Turbo while active extends it. */
export function buyTurbo(player: Player, id: unknown, now = Date.now()): { ok: boolean; message: string } {
  const offer = TURBO_OFFERS[id as TurboId];
  if (!offer) return { ok: false, message: 'Oferta inválida.' };
  if (!spendCoins(player, offer.cost)) return { ok: false, message: `Você precisa de ${offer.cost} CyberCoins.` };
  player.turboUntil = Math.max(player.turboUntil || 0, now) + offer.ms;
  return { ok: true, message: `${offer.label} ativado.` };
}
