import { test } from 'node:test';
import assert from 'node:assert';
import express from 'express';
import rateLimit from 'express-rate-limit';

test('auth rate limiter blocks requests after exceeding limit', async () => {
  const app = express();
  app.use(express.json());

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Muitas tentativas de autenticação. Tente novamente mais tarde.' },
  });

  app.post('/api/auth/login', authLimiter, (_req, res) => {
    res.json({ success: true });
  });

  app.post('/api/auth/register', authLimiter, (_req, res) => {
    res.json({ success: true });
  });

  const server = app.listen(0);
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Failed to bind server');
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    // 5 allowed login requests
    for (let i = 0; i < 5; i++) {
      const res = await fetch(`${baseUrl}/api/auth/login`, { method: 'POST' });
      assert.strictEqual(res.status, 200);
    }

    // 6th request to login should return HTTP 429 Too Many Requests
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, { method: 'POST' });
    assert.strictEqual(loginRes.status, 429);
    const loginData = await loginRes.json();
    assert.strictEqual(loginData.error, 'Muitas tentativas de autenticação. Tente novamente mais tarde.');

    // 6th request to register should also return HTTP 429 because rateLimit key is IP-based
    const regRes = await fetch(`${baseUrl}/api/auth/register`, { method: 'POST' });
    assert.strictEqual(regRes.status, 429);
  } finally {
    server.close();
  }
});
