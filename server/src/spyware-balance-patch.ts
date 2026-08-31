import { GameWorld } from './engine/GameWorld.js';
import { dbHelpers } from './database/sqlite.js';

const gameWorldPrototype = GameWorld.prototype as any;

// The original sniffer rewarded successful spyware implants too frequently and
// generated victim balances that were disproportionately large for early game.
// Replace only the ticker so the rest of the spyware mechanics remain intact.
gameWorldPrototype.startSpywareSnifferTicker = function balancedSpywareSnifferTicker() {
  setInterval(() => {
    for (const server of this.servers.values()) {
      if (!server.activeSpyware || server.activeSpyware.length === 0) continue;

      for (const implant of server.activeSpyware) {
        const owner = Array.from(this.players.values()).find((p: any) => p.player.id === implant.ownerId);
        if (!owner) continue;

        const roll = Math.random();

        // Keylogger / bank credential interception: much less frequent and lower value.
        if (roll < 0.08) {
          if (!implant.discoveredAccounts) implant.discoveredAccounts = [];
          if (implant.discoveredAccounts.length < 3) {
            const accNum = `ACC-${Math.floor(Math.random() * 89999 + 10000)}`;
            const rawBalance = Math.round(server.security.hasherLevel * 500 + 100 + Math.random() * 1000);
            const balance = Math.min(1500, rawBalance);
            const victimAcc = {
              accountNumber: accNum,
              bankIp: '12.189.44.10',
              bankName: 'MegaBank Central',
              balance,
              password: `spy_${Math.random().toString(36).substring(2, 6)}`,
              ownerName: `Vítima Interceptada (${server.hostname})`,
            };

            implant.discoveredAccounts.push(victimAcc);
            dbHelpers.saveServer(server);

            if (this.proxyTraceEngine['io']) {
              this.proxyTraceEngine['io'].emit('spyware_credential_intercepted', {
                playerId: owner.player.id,
                targetIp: server.ip,
                targetHostname: server.hostname,
                credentialType: 'bank_account',
                account: victimAcc,
                message: `🕵️ SPYWARE ALERTA: Credenciais bancárias interceptadas em ${server.hostname}! Saldo: $${balance.toLocaleString()} USD disponível para desvio.`,
              });
            }
          }
        }
        // Private wallet interception: rare and intentionally small.
        else if (roll < 0.11) {
          if (!implant.discoveredCrypto) implant.discoveredCrypto = [];
          if (implant.discoveredCrypto.length < 2) {
            const btcAmt = Number((Math.random() * 0.008 + 0.002).toFixed(4));
            const victimCrypto = {
              symbol: 'BTC',
              amount: btcAmt,
              address: `bc1q${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 6)}`,
              password: `wallet_${Math.random().toString(36).substring(2, 6)}`,
            };

            implant.discoveredCrypto.push(victimCrypto);
            dbHelpers.saveServer(server);

            if (this.proxyTraceEngine['io']) {
              this.proxyTraceEngine['io'].emit('spyware_credential_intercepted', {
                playerId: owner.player.id,
                targetIp: server.ip,
                targetHostname: server.hostname,
                credentialType: 'crypto_wallet',
                crypto: victimCrypto,
                message: `🕵️ SPYWARE ALERTA: Carteira de Bitcoin interceptada em ${server.hostname}! Saldo: +${btcAmt} BTC pronto para drenagem.`,
              });
            }
          }
        }
      }
    }
  }, 15000);
};

// Cap payouts from older/high-value discoveries too, so previously generated
// loot cannot bypass the new economy balance.
const originalSiphonAccount = gameWorldPrototype.siphonVictimAccount;
gameWorldPrototype.siphonVictimAccount = function balancedSiphonAccount(userId: string, targetIp: string, accountNumber: string) {
  const result = originalSiphonAccount.call(this, userId, targetIp, accountNumber);
  if (result?.success && typeof result.amount === 'number') {
    // Existing records can predate the balance rebalance. Clamp the actual payout
    // by rolling back any amount above the new per-hit ceiling.
    const ceiling = 1500;
    const excess = result.amount - ceiling;
    if (excess > 0) {
      const player = this.getPlayer(userId);
      player.cash = Math.max(0, player.cash - excess);
      if (player.bankAccounts?.length) player.bankAccounts[0].balance = player.cash;
      this.savePlayerState(userId);
      result.amount = ceiling;
      result.message = `Desvio bancário concluído! +$${ceiling.toLocaleString()} USD transferidos da conta da vítima.`;
    }
  }
  return result;
};

const originalSiphonCrypto = gameWorldPrototype.siphonVictimCrypto;
gameWorldPrototype.siphonVictimCrypto = function balancedSiphonCrypto(userId: string, targetIp: string, address: string) {
  const result = originalSiphonCrypto.call(this, userId, targetIp, address);
  if (result?.success && typeof result.amount === 'number') {
    const ceiling = 0.01;
    const excess = Number((result.amount - ceiling).toFixed(6));
    if (excess > 0) {
      const player = this.getPlayer(userId);
      player.cryptoWallet.btc = Number(Math.max(0, (player.cryptoWallet.btc || 0) - excess).toFixed(6));
      player.crypto = player.cryptoWallet.btc;
      this.savePlayerState(userId);
      result.amount = ceiling;
      result.message = `Carteira interceptada drenada! +${ceiling.toFixed(4)} BTC transferidos para sua conta anônima.`;
    }
  }
  return result;
};

console.log('[balance] spyware/keylogger income rebalance loaded');
