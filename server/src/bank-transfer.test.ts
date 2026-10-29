import { test } from 'node:test';
import assert from 'node:assert';
import { dbHelpers } from './database/sqlite.js';
import { GameWorld } from './engine/GameWorld.js';
import { VirtualServer } from './types/game.js';

test('bankTransfer correctly resolves destination account on another server via index', async () => {
  const mockServers: VirtualServer[] = [
    {
      id: 'srv-bank-1',
      ip: '12.189.44.10',
      hostname: 'megabank',
      type: 'bank',
      isOnline: true,
      hardware: { cpuPower: 10, ramGb: 16, hddMb: 1000, networkMbps: 100 },
      security: { hasherLevel: 1, firewallLevel: 1, password: 'pass', isBreached: false, openPorts: [] },
      files: [],
      bankAccounts: [
        {
          accountNumber: 'ACC-10001',
          bankIp: '12.189.44.10',
          bankName: 'MegaBank',
          balance: 1000,
        },
      ],
      logs: [],
      activeMiners: [],
    },
    {
      id: 'srv-bank-2',
      ip: '198.51.100.55',
      hostname: 'worldbank',
      type: 'bank',
      isOnline: true,
      hardware: { cpuPower: 10, ramGb: 16, hddMb: 1000, networkMbps: 100 },
      security: { hasherLevel: 1, firewallLevel: 1, password: 'pass', isBreached: false, openPorts: [] },
      files: [],
      bankAccounts: [
        {
          accountNumber: 'ACC-20002',
          bankIp: '198.51.100.55',
          bankName: 'WorldBank',
          balance: 2000,
        },
      ],
      logs: [],
      activeMiners: [],
    },
  ];

  // Override dbHelpers for test
  dbHelpers.getAllServers = () => mockServers;
  dbHelpers.saveServer = () => Promise.resolve();
  dbHelpers.savePlayer = () => Promise.resolve();
  dbHelpers.addNews = () => Promise.resolve();

  const world = new GameWorld();

  const player = world.getOrCreatePlayer('test-user-123');
  player.cash = 500;

  // Attempt transfer from ACC-10001 (on 12.189.44.10) to ACC-20002 (on 198.51.100.55)
  const result = world.bankTransfer(
    'test-user-123',
    'ACC-10001',
    'ACC-20002',
    150,
    '12.189.44.10'
  );

  assert.strictEqual(result.success, true, `Bank transfer should succeed: ${result.message}`);
  assert.strictEqual(mockServers[0].bankAccounts![0].balance, 850);
  assert.strictEqual(mockServers[1].bankAccounts![0].balance, 2150);
});
