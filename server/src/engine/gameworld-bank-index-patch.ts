import { GameWorld } from './GameWorld.js';
import type { VirtualServer, BankAccount } from '../types/game.js';

declare module './GameWorld.js' {
  interface GameWorld {
    indexServerBankAccounts(server: VirtualServer): void;
  }
}

Object.defineProperty(GameWorld.prototype, 'indexServerBankAccounts', {
  configurable: true,
  value: function indexServerBankAccounts(this: GameWorld, server: VirtualServer): void {
    if (!server.bankAccounts) return;

    const bankAccountMap = (this as unknown as { bankAccountMap: Map<string, BankAccount> }).bankAccountMap;

    for (const account of server.bankAccounts) {
      bankAccountMap.set(account.accountNumber, account);
    }
  },
});
