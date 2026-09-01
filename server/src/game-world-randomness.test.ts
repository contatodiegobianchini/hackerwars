import { test } from 'node:test';
import assert from 'node:assert';
import { GameWorld } from './engine/GameWorld.js';

test('generateProceduralServer produces valid servers with CSPRNG values', () => {
  const world = new GameWorld();
  const server = world.generateProceduralServer('test-user-1');

  assert.ok(server);
  assert.ok(server.ip);
  assert.ok(server.hostname);
  assert.ok(server.security.hasherLevel >= 1.0);
  assert.ok(server.security.firewallLevel >= 1.0);
  assert.ok(server.security.password.startsWith('key_'));

  if (server.bankAccounts && server.bankAccounts.length > 0) {
    assert.ok(server.bankAccounts[0].accountNumber.startsWith('ACC-'));
    assert.ok(typeof server.bankAccounts[0].balance === 'number');
  }
});
