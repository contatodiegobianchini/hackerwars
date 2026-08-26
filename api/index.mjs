import { initializeSupabaseDb } from '../server/src/database/supabase.js';

await initializeSupabaseDb();

const { default: server } = await import('../server/src/secure-server.js');

export default server;
