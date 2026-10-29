import { BankAccount } from '../types/game.js';

export function benchmark() {
  const numServers = 2000;
  const servers = new Map<string, { bankAccounts?: BankAccount[] }>();
  const allAccounts: BankAccount[] = [];

  for (let i = 0; i < numServers; i++) {
    const ip = '10.0.' + Math.floor(i / 256) + '.' + (i % 256);
    const bankAccounts: BankAccount[] = [];

    // 25% of servers have bank accounts
    if (i % 4 === 0) {
      for (let a = 0; a < 2; a++) {
        const acc: BankAccount = {
          accountNumber: `ACC-${i}-${a}`,
          bankIp: ip,
          bankName: `Bank ${i}`,
          balance: 1000 * (i + 1),
        };
        bankAccounts.push(acc);
        allAccounts.push(acc);
      }
    }

    servers.set(ip, { bankAccounts: bankAccounts.length > 0 ? bankAccounts : undefined });
  }

  // Pre-build index for new method
  const bankAccountMap = new Map<string, BankAccount>();
  for (const s of servers.values()) {
    if (s.bankAccounts) {
      for (const acc of s.bankAccounts) {
        bankAccountMap.set(acc.accountNumber, acc);
      }
    }
  }

  // Prepare test target account numbers
  const lookupTargets: string[] = [];
  for (let i = allAccounts.length - 100; i < allAccounts.length; i++) {
    lookupTargets.push(allAccounts[i].accountNumber);
  }
  for (let i = 0; i < 100; i++) {
    lookupTargets.push(`NON-EXISTENT-${i}`);
  }

  function oldLookup(destAccNum: string): BankAccount | undefined {
    for (const s of servers.values()) {
      if (s.bankAccounts) {
        const found = s.bankAccounts.find(a => a.accountNumber === destAccNum);
        if (found) {
          return found;
        }
      }
    }
    return undefined;
  }

  function newLookup(destAccNum: string): BankAccount | undefined {
    return bankAccountMap.get(destAccNum);
  }

  const iterations = 50;

  const startOld = performance.now();
  for (let iter = 0; iter < iterations; iter++) {
    for (const target of lookupTargets) {
      oldLookup(target);
    }
  }
  const endOld = performance.now();

  const startNew = performance.now();
  for (let iter = 0; iter < iterations; iter++) {
    for (const target of lookupTargets) {
      newLookup(target);
    }
  }
  const endNew = performance.now();

  const oldTime = endOld - startOld;
  const newTime = endNew - startNew;
  const speedup = oldTime / newTime;

  console.log(`[Benchmark] Old linear scan lookup (${iterations * lookupTargets.length} total lookups): ${oldTime.toFixed(2)} ms`);
  console.log(`[Benchmark] New Map index lookup (${iterations * lookupTargets.length} total lookups): ${newTime.toFixed(2)} ms`);
  console.log(`[Benchmark] Speedup factor: ${speedup.toFixed(1)}x`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  benchmark();
}
