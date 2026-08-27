import { initializeSupabaseDb } from '../server/src/database/supabase.js';

await initializeSupabaseDb();

const { default: server } = await import('../server/src/secure-server.js');

const requestListeners = server.listeners('request');
const requestHandler = requestListeners[0];

if (typeof requestHandler !== 'function') {
  throw new Error('HackerWars HTTP server did not expose an Express request handler.');
}

export default function handler(req, res) {
  return requestHandler(req, res);
}
