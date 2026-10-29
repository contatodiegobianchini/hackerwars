import { test } from 'node:test';
import assert from 'node:assert';
import { INITIAL_SOFTWARE, INITIAL_SERVERS, INITIAL_PLAYER, INITIAL_NEWS } from './database/defaultData.js';

test('INITIAL_SOFTWARE default configuration data', () => {
  assert(Array.isArray(INITIAL_SOFTWARE), 'INITIAL_SOFTWARE should be an array');
  assert.strictEqual(INITIAL_SOFTWARE.length, 8);

  for (const item of INITIAL_SOFTWARE) {
    assert(item.id, 'Software item must have an id');
    assert(item.name, 'Software item must have a name');
    assert(item.type, 'Software item must have a type');
    assert(typeof item.version === 'number', 'Software item version must be a number');
    assert(typeof item.sizeMb === 'number', 'Software item sizeMb must be a number');
  }
});

test('INITIAL_SERVERS default configuration data', () => {
  assert(Array.isArray(INITIAL_SERVERS), 'INITIAL_SERVERS should be an array');
  assert(INITIAL_SERVERS.length > 0, 'INITIAL_SERVERS must not be empty');

  for (const server of INITIAL_SERVERS) {
    assert(server.id, 'Server must have an id');
    assert(server.ip, 'Server must have an ip');
    assert(server.hostname, 'Server must have a hostname');
    assert(server.hardware, 'Server must have hardware object');
    assert(server.security, 'Server must have security object');
  }
});

test('INITIAL_PLAYER default configuration data', () => {
  assert(INITIAL_PLAYER, 'INITIAL_PLAYER should exist');
  assert.strictEqual(INITIAL_PLAYER.id, 'player-1');
  assert.strictEqual(INITIAL_PLAYER.username, 'zero_cool');
  assert(Array.isArray(INITIAL_PLAYER.software), 'INITIAL_PLAYER.software should be an array');
  assert.strictEqual(INITIAL_PLAYER.software.length, INITIAL_SOFTWARE.length);
  assert(INITIAL_PLAYER.hardware, 'INITIAL_PLAYER should have hardware');
});

test('INITIAL_NEWS default configuration data', () => {
  assert(Array.isArray(INITIAL_NEWS), 'INITIAL_NEWS should be an array');
  assert(INITIAL_NEWS.length > 0, 'INITIAL_NEWS must not be empty');

  for (const news of INITIAL_NEWS) {
    assert(news.id, 'News item must have an id');
    assert(news.headline, 'News item must have a headline');
    assert(news.category, 'News item must have a category');
  }
});
