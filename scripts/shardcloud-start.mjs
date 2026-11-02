// ShardCloud launcher: builds client + server when the sources changed (or dist is missing), then
// starts the single-process web server (API + Socket.IO + built client).
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

const SKIP = new Set(['node_modules', 'dist', '.git']);
const hash = createHash('sha256');
const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (SKIP.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else { hash.update(full); hash.update(readFileSync(full)); }
  }
};
for (const dir of ['client', 'server']) walk(dir);
for (const file of ['package.json']) hash.update(readFileSync(file));
const current = hash.digest('hex');

const STAMP = '.build-hash';
const previous = existsSync(STAMP) ? readFileSync(STAMP, 'utf8').trim() : '';
const built = existsSync('client/dist/index.html') && existsSync('server/dist/serve-client.js');

if (!built || previous !== current) {
  console.log('[shardcloud] building project...');
  run('npm', ['run', 'build:all']);
  writeFileSync(STAMP, current);
}
run('npm', ['--prefix', 'server', 'run', 'start:web']);
