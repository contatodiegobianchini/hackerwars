import test from 'node:test';
import assert from 'node:assert/strict';

// Mock browser globals for Node test environment
if (typeof globalThis.sessionStorage === 'undefined') {
  const store = new Map<string, string>();
  globalThis.sessionStorage = {
    getItem: (key: string) => store.get(key) || null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    length: 0,
    key: () => null,
  };
}

if (typeof globalThis.alert === 'undefined') {
  globalThis.alert = () => {};
}

if (typeof globalThis.confirm === 'undefined') {
  globalThis.confirm = () => true;
}

import { useGameStore } from '../stores/useGameStore.js';
import { useAttacks } from './useAttacks.js';

test('useAttacks handleCrack starts crack process on active connection', () => {
  let startedType = '';
  let startedParams: any = null;

  useGameStore.setState({
    activeConnection: {
      ip: '192.168.1.100',
      hostname: 'target-server',
    } as any,
    startProcess: (type: any, params: any) => {
      startedType = type;
      startedParams = params;
    },
  });

  const attacks = useAttacks(useGameStore.getState());
  attacks.handleCrack();

  assert.equal(startedType, 'crack');
  assert.deepEqual(startedParams, { targetIp: '192.168.1.100' });
});

test('useAttacks handleScan starts scan process on active connection', () => {
  let startedType = '';
  let startedParams: any = null;

  useGameStore.setState({
    activeConnection: {
      ip: '192.168.1.100',
      hostname: 'target-server',
    } as any,
    startProcess: (type: any, params: any) => {
      startedType = type;
      startedParams = params;
    },
  });

  const attacks = useAttacks(useGameStore.getState());
  attacks.handleScan();

  assert.equal(startedType, 'scan');
  assert.deepEqual(startedParams, { targetIp: '192.168.1.100' });
});

test('useAttacks handleDDoS starts ddos process on active connection', () => {
  let startedType = '';
  let startedParams: any = null;

  useGameStore.setState({
    activeConnection: {
      ip: '192.168.1.100',
      hostname: 'target-server',
    } as any,
    startProcess: (type: any, params: any) => {
      startedType = type;
      startedParams = params;
    },
  });

  const attacks = useAttacks(useGameStore.getState());
  attacks.handleDDoS();

  assert.equal(startedType, 'ddos');
  assert.equal(startedParams.targetIp, '192.168.1.100');
  assert.equal(startedParams.targetFileName, 'Ataque DDoS em target-server');
});

test('useAttacks handlePlantSpyware starts spyware process if player has spyware', () => {
  let startedType = '';
  let startedParams: any = null;

  useGameStore.setState({
    player: {
      id: 'p1',
      software: [{ id: 's1', type: 'spyware', name: 'SpyTrojan' }],
    } as any,
    activeConnection: {
      ip: '192.168.1.100',
      hostname: 'target-server',
    } as any,
    startProcess: (type: any, params: any) => {
      startedType = type;
      startedParams = params;
    },
  });

  const attacks = useAttacks(useGameStore.getState());
  attacks.handlePlantSpyware();

  assert.equal(startedType, 'plant_spyware');
  assert.equal(startedParams.targetIp, '192.168.1.100');
  assert.equal(startedParams.targetFileName, 'Implantando Spyware Trojan (SpyTrojan)');
});

test('useAttacks handleDownload starts download process for file', () => {
  let startedType = '';
  let startedParams: any = null;

  useGameStore.setState({
    activeConnection: {
      ip: '192.168.1.100',
      hostname: 'target-server',
    } as any,
    startProcess: (type: any, params: any) => {
      startedType = type;
      startedParams = params;
    },
  });

  const attacks = useAttacks(useGameStore.getState());
  attacks.handleDownload({ id: 'f1', name: 'secret.dat' } as any);

  assert.equal(startedType, 'download');
  assert.equal(startedParams.targetIp, '192.168.1.100');
  assert.equal(startedParams.targetFileId, 'f1');
  assert.equal(startedParams.targetFileName, 'secret.dat');
});

test('useAttacks handleBankHeist invokes bankTransfer with correct accounts', () => {
  let transferSource = '';
  let transferDest = '';
  let transferAmount = 0;
  let transferIp = '';

  useGameStore.setState({
    player: {
      id: 'p1',
      bankAccounts: [{ accountNumber: 'my-acc-123' }],
    } as any,
    activeConnection: {
      ip: '192.168.1.100',
      hostname: 'bank-server',
    } as any,
    bankTransfer: (sourceAcc: string, destAcc: string, amount: number, bankIp: string) => {
      transferSource = sourceAcc;
      transferDest = destAcc;
      transferAmount = amount;
      transferIp = bankIp;
    },
  });

  const attacks = useAttacks(useGameStore.getState());
  attacks.handleBankHeist({ accountNumber: 'victim-999', balance: 50000 });

  assert.equal(transferSource, 'victim-999');
  assert.equal(transferDest, 'my-acc-123');
  assert.equal(transferAmount, 50000);
  assert.equal(transferIp, '192.168.1.100');
});
