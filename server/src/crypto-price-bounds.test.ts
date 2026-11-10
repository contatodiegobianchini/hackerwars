import { test } from 'node:test';
import assert from 'node:assert';

process.env.NODE_ENV = 'test';
const { CryptoEngine } = await import('./engine/CryptoEngine.js');

test('crypto prices stay bounded around their base price over a week of ticks', () => {
  const engine = new CryptoEngine();
  const base = Object.fromEntries(Object.values(engine.getState().coins).map(c => [c.id, c.priceUsd]));
  const sumLog: Record<string, number> = {};
  const ticks = 151_200; // 7 days at one tick every 4s

  for (let i = 0; i < ticks; i++) {
    engine.tickPrices();
    for (const coin of Object.values(engine.getState().coins)) {
      assert.ok(coin.priceUsd >= base[coin.id] / 4.01 && coin.priceUsd <= base[coin.id] * 4.01,
        `${coin.id} out of bounds: ${coin.priceUsd}`);
      sumLog[coin.id] = (sumLog[coin.id] || 0) + Math.log(coin.priceUsd / base[coin.id]);
    }
  }

  for (const [id, total] of Object.entries(sumLog)) {
    const meanRatio = Math.exp(total / ticks);
    assert.ok(meanRatio > 0.75 && meanRatio < 1.33, `${id} drifted: geometric mean ratio ${meanRatio}`);
  }
});
