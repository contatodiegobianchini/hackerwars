import { Socket } from 'socket.io';
import { GameWorld } from './engine/GameWorld.js';

type AdminUpdatePayload = {
  targetUserId?: unknown;
  updates?: Record<string, unknown> | null;
  cash?: unknown;
  cryptoWallet?: unknown;
  reputation?: unknown;
  rank?: unknown;
  role?: unknown;
  isBanned?: unknown;
  banReason?: unknown;
};

const socketPrototype = Socket.prototype as any;
const originalOn = socketPrototype.on;
const originalOnevent = socketPrototype.onevent;

// Capture the live GameWorld instance without changing index.ts startup order.
const originalGetPlayer = (GameWorld.prototype as any).getPlayer;
(GameWorld.prototype as any).getPlayer = function patchedGetPlayer(...args: any[]) {
  (globalThis as any).__hackerWarsGameWorld = this;
  return originalGetPlayer.apply(this, args);
};

socketPrototype.on = function patchedSocketOn(event: string, listener: (...args: any[]) => unknown) {
  if (event !== 'admin_update_player') {
    return originalOn.call(this, event, listener);
  }

  return originalOn.call(this, event, (payload: AdminUpdatePayload = {}) => {
    const normalizedUpdates = payload && payload.updates && typeof payload.updates === 'object'
      ? payload.updates
      : {
          ...(payload.cash !== undefined ? { cash: payload.cash } : {}),
          ...(payload.cryptoWallet !== undefined ? { cryptoWallet: payload.cryptoWallet } : {}),
          ...(payload.reputation !== undefined ? { reputation: payload.reputation } : {}),
          ...(payload.rank !== undefined ? { rank: payload.rank } : {}),
          ...(payload.role !== undefined ? { role: payload.role } : {}),
          ...(payload.isBanned !== undefined ? { isBanned: payload.isBanned } : {}),
          ...(payload.banReason !== undefined ? { banReason: payload.banReason } : {}),
        };

    return listener({
      targetUserId: typeof payload.targetUserId === 'string' ? payload.targetUserId : '',
      updates: normalizedUpdates,
    });
  });
};

// The client already emits `open_lootbox`, but the main socket router historically
// had no corresponding listener. Intercept the incoming Socket.IO packet here so
// the existing GameWorld.openLootbox implementation can be used without duplicating
// economy/reward logic in the transport layer.
socketPrototype.onevent = function patchedSocketOnevent(packet: any) {
  const eventName = packet?.data?.[0];

  if (eventName === 'open_lootbox') {
    const socket = this as any;
    const payload = packet?.data?.[1] ?? {};
    const userId = socket.data?.user?.userId;
    const gameWorld = (globalThis as any).__hackerWarsGameWorld as GameWorld | undefined;

    if (!userId || !gameWorld) {
      socket.emit('lootbox_result', {
        success: false,
        message: 'Servidor do Black Market ainda não está pronto. Tente novamente.',
      });
      return;
    }

    const crateId = typeof payload.crateId === 'string' ? payload.crateId : '';
    const paymentMethod = payload.paymentMethod === 'btc' ? 'btc' : payload.paymentMethod === 'usd' ? 'usd' : null;

    if (!crateId || !paymentMethod) {
      socket.emit('lootbox_result', {
        success: false,
        message: 'Dados de compra da lootbox inválidos.',
      });
      return;
    }

    const result = gameWorld.openLootbox(userId, crateId, paymentMethod);
    socket.emit('lootbox_result', {
      ...result,
      player: gameWorld.getPlayer(userId),
    });
    return;
  }

  return originalOnevent.call(this, packet);
};

console.log('[security] admin_update_player payload normalizer loaded');
console.log('[black-market] open_lootbox socket bridge loaded');