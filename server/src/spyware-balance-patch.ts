import { GameWorld } from './engine/GameWorld.js';
import { dbHelpers } from './database/sqlite.js';

const gameWorldPrototype = GameWorld.prototype as any;

const BANK_PAYOUT_CAP = 300;
const BTC_PAYOUT_CAP = 0.0015;

// Rebalance the automatic spyware/keylogger sniffer for a much slower early-game economy.
gameWorldPrototype.startSpywareSnifferTicker = function balancedSpywareSnifferTicker() {
  setInterval(() => {
    for (const server of this.servers.values()) {
      if (!server.activeSpyware || server.activeSpyware.length === 0) continue;

      for (const implant of server.activeSpyware) {
        const playerEntries = Array.from((this.players as Map<string, any>).values()) as any[];
        const owner: any = playerEntries.find((p: any) => p?.player?.id === implant.ownerId);
        if (!owner) continue;

        const roll = Math.random();

        // Keylogger: rare interception and tiny victim balances.
        if (roll < 0.04) {
          if (!implant.discoveredAccounts) implant.discoveredAccounts = [];
          if (implant.discoveredAccounts.length < 2) {
            const accNum = `ACC-${Math.floor(Math.random() * 89999 + 10000)}`;
            const rawBalance = Math.round(25 + server.security.hasherLevel * 80 + Math.random() * 250);
            const balance = Math.min(BANK_PAYOUT_CAP, rawBalance);
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
        // Keylogger wallet interception: extremely rare and tiny balances.
        else if (roll < 0.055) {
          if (!implant.discoveredCrypto) implant.discoveredCrypto = [];
          if (implant.discoveredCrypto.length < 1) {
            const btcAmt = Number((Math.random() * 0.001 + 0.0001).toFixed(4));
            const victimCrypto = {
              symbol: 'BTC',
              amount: Math.min(BTC_PAYOUT_CAP, btcAmt),
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
                message: `🕵️ SPYWARE ALERTA: Carteira de Bitcoin interceptada em ${server.hostname}! Saldo: +${victimCrypto.amount} BTC pronto para drenagem.`,
              });
            }
          }
        }
      }
    }
  }, 15000);
};

// Clamp automatic/legacy bank findings so old oversized discoveries cannot bypass the rebalance.
const originalPlantSpyware = gameWorldPrototype.plantSpyware;
gameWorldPrototype.plantSpyware = function balancedPlantSpyware(userId: string, targetIp: string) {
  const result: any = originalPlantSpyware.call(this, userId, targetIp);
  if (result?.success && result.server?.activeSpyware) {
    const player: any = this.getPlayer(userId);
    const implant: any = result.server.activeSpyware.find((item: any) => item.ownerId === player.id);
    if (implant) {
      if (implant.discoveredAccounts) {
        for (const account of implant.discoveredAccounts) {
          if (typeof account.balance === 'number') account.balance = Math.min(BANK_PAYOUT_CAP, Math.max(1, account.balance));
        }
      }
      if (implant.discoveredCrypto) {
        for (const wallet of implant.discoveredCrypto) {
          if (typeof wallet.amount === 'number') wallet.amount = Math.min(BTC_PAYOUT_CAP, Math.max(0.0001, wallet.amount));
        }
      }
      dbHelpers.saveServer(result.server);
      result.server = this.getServer(targetIp);
    }
  }
  return result;
};

// Cap payouts from old discoveries as well as newly generated ones.
const originalSiphonAccount = gameWorldPrototype.siphonVictimAccount;
gameWorldPrototype.siphonVictimAccount = function balancedSiphonAccount(userId: string, targetIp: string, accountNumber: string) {
  const result: any = originalSiphonAccount.call(this, userId, targetIp, accountNumber);
  if (result?.success && typeof result.amount === 'number') {
    const ceiling = BANK_PAYOUT_CAP;
    const excess = result.amount - ceiling;
    if (excess > 0) {
      const player: any = this.getPlayer(userId);
      player.cash = Math.max(0, player.cash - excess);
      player.reputation = Math.max(0, player.reputation - 120);
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
  const result: any = originalSiphonCrypto.call(this, userId, targetIp, address);
  if (result?.success && typeof result.amount === 'number') {
    const ceiling = BTC_PAYOUT_CAP;
    const excess = Number((result.amount - ceiling).toFixed(6));
    if (excess > 0) {
      const player: any = this.getPlayer(userId);
      player.cryptoWallet.btc = Number(Math.max(0, (player.cryptoWallet.btc || 0) - excess).toFixed(6));
      player.crypto = player.cryptoWallet.btc;
      player.reputation = Math.max(0, player.reputation - Math.round(excess * 800));
      this.savePlayerState(userId);
      result.amount = ceiling;
      result.message = `Carteira interceptada drenada! +${ceiling.toFixed(4)} BTC transferidos para sua conta anônima.`;
    }
  }
  return result;
};

console.log('[balance] spyware/keylogger income rebalance v3 loaded');
