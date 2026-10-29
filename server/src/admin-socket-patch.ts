import { Socket } from 'socket.io';

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

console.log('[security] admin_update_player payload normalizer loaded');
