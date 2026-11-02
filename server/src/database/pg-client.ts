import pg from 'pg';

// Minimal PostgREST-like query builder on top of node-postgres, so the persistence layer
// can run against any Postgres (e.g. a ShardCloud database) without extra services.

pg.types.setTypeParser(20, (v: string) => Number(v));      // bigint
pg.types.setTypeParser(700, (v: string) => parseFloat(v)); // float4
pg.types.setTypeParser(701, (v: string) => parseFloat(v)); // float8
pg.types.setTypeParser(1700, (v: string) => parseFloat(v)); // numeric
pg.types.setTypeParser(1184, (v: string) => v);            // timestamptz -> raw string
pg.types.setTypeParser(1114, (v: string) => v);            // timestamp -> raw string

const TABLES = new Set(['game_users', 'players', 'game_servers', 'game_news', 'server_miners']);
const IDENT = /^[a-z_][a-z0-9_]*$/;
const ident = (name: string): string => {
  if (!IDENT.test(name)) throw new Error(`Invalid SQL identifier: ${name}`);
  return `"${name}"`;
};

export type QueryResult = { data: any[] | null; error: { message: string } | null };

const SCHEMA = `
CREATE TABLE IF NOT EXISTS game_users (
  id text PRIMARY KEY,
  username text NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  role text NOT NULL DEFAULT 'player',
  is_banned boolean NOT NULL DEFAULT false,
  ban_reason text
);
CREATE UNIQUE INDEX IF NOT EXISTS game_users_username_lower_idx ON game_users (lower(username));
CREATE TABLE IF NOT EXISTS players (
  id text PRIMARY KEY,
  user_id text NOT NULL UNIQUE,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS game_servers (
  id text PRIMARY KEY,
  ip text NOT NULL UNIQUE,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS game_news (
  id text PRIMARY KEY,
  headline text NOT NULL,
  category text NOT NULL,
  timestamp bigint NOT NULL
);
CREATE TABLE IF NOT EXISTS server_miners (
  id text PRIMARY KEY,
  server_ip text NOT NULL,
  owner_user_id text NOT NULL,
  owner_player_id text,
  miner_level double precision NOT NULL DEFAULT 1,
  hash_rate double precision NOT NULL DEFAULT 0,
  coin_id text NOT NULL DEFAULT 'btc',
  UNIQUE (server_ip, owner_user_id)
);
`;

class Query implements PromiseLike<QueryResult> {
  private op: 'select' | 'insert' | 'upsert' | 'update' | 'delete' = 'select';
  private columns = '*';
  private payload: Record<string, unknown> = {};
  private conflict: string[] = ['id'];
  private filters: Array<{ col: string; op: '=' | '<>'; val: unknown }> = [];

  constructor(private client: PgClient, private table: string) {
    if (!TABLES.has(table)) throw new Error(`Unknown table: ${table}`);
  }

  select(columns = '*') { this.op = 'select'; this.columns = columns; return this; }
  insert(row: Record<string, unknown>) { this.op = 'insert'; this.payload = row; return this; }
  upsert(row: Record<string, unknown>, opts?: { onConflict?: string }) {
    this.op = 'upsert'; this.payload = row;
    if (opts?.onConflict) this.conflict = opts.onConflict.split(',').map(s => s.trim());
    return this;
  }
  update(values: Record<string, unknown>) { this.op = 'update'; this.payload = values; return this; }
  delete() { this.op = 'delete'; return this; }
  eq(col: string, val: unknown) { this.filters.push({ col, op: '=', val }); return this; }
  neq(col: string, val: unknown) { this.filters.push({ col, op: '<>', val }); return this; }

  private build(): { sql: string; params: unknown[]; write: boolean } {
    const t = ident(this.table);
    const params: unknown[] = [];
    const param = (v: unknown) => { params.push(v); return `$${params.length}`; };
    const where = () => this.filters.length
      ? ' WHERE ' + this.filters.map(f => `${ident(f.col)} ${f.op} ${param(f.val)}`).join(' AND ')
      : '';

    switch (this.op) {
      case 'select': {
        const cols = this.columns === '*' ? '*' : this.columns.split(',').map(c => ident(c.trim())).join(', ');
        return { sql: `SELECT ${cols} FROM ${t}${where()}`, params, write: false };
      }
      case 'insert':
      case 'upsert': {
        const keys = Object.keys(this.payload);
        const cols = keys.map(ident).join(', ');
        const vals = keys.map(k => param(this.payload[k])).join(', ');
        let sql = `INSERT INTO ${t} (${cols}) VALUES (${vals})`;
        if (this.op === 'upsert') {
          const updates = keys.filter(k => !this.conflict.includes(k));
          sql += ` ON CONFLICT (${this.conflict.map(ident).join(', ')}) ` +
            (updates.length ? `DO UPDATE SET ${updates.map(k => `${ident(k)} = EXCLUDED.${ident(k)}`).join(', ')}` : 'DO NOTHING');
        }
        return { sql, params, write: true };
      }
      case 'update': {
        const sets = Object.keys(this.payload).map(k => `${ident(k)} = ${param(this.payload[k])}`).join(', ');
        return { sql: `UPDATE ${t} SET ${sets}${where()}`, params, write: true };
      }
      case 'delete':
        return { sql: `DELETE FROM ${t}${where()}`, params, write: true };
    }
  }

  private execute(): Promise<QueryResult> {
    let built: ReturnType<Query['build']>;
    try { built = this.build(); } catch (e) {
      return Promise.resolve({ data: null, error: { message: (e as Error).message } });
    }
    const run = () => this.client.ensureSchema().then(() => this.client.pool.query(built.sql, built.params))
      .then((r): QueryResult => ({ data: built.write ? null : r.rows, error: null }))
      .catch((e): QueryResult => ({ data: null, error: { message: e.message } }));
    // Writes run strictly in order so an older snapshot can never overwrite a newer one.
    return built.write ? this.client.enqueue(run) : run();
  }

  then<R1 = QueryResult, R2 = never>(
    onfulfilled?: ((value: QueryResult) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: any) => R2 | PromiseLike<R2>) | null,
  ): Promise<R1 | R2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  catch<R = never>(onrejected?: ((reason: any) => R | PromiseLike<R>) | null): Promise<QueryResult | R> {
    return this.execute().catch(onrejected);
  }
}

export class PgClient {
  readonly pool: pg.Pool;
  private tail: Promise<unknown> = Promise.resolve();

  constructor(connectionString: string) {
    this.pool = new pg.Pool({ connectionString, max: 5 });
    this.pool.on('error', (err) => console.error('[Postgres pool]', err.message));
  }

  enqueue<T>(task: () => Promise<T>): Promise<T> {
    const next = this.tail.then(task, task);
    this.tail = next.catch(() => undefined);
    return next;
  }

  from(table: string) { return new Query(this, table); }

  private schemaReady?: Promise<void>;

  // Memoized: every query waits for it, so early callers (patches loaded before init) are safe.
  ensureSchema(): Promise<void> {
    this.schemaReady ??= this.pool.query(SCHEMA).then(() => undefined);
    return this.schemaReady;
  }
}
