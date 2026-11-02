// ShardCloud launcher: builds client + server on first boot (or when dist is missing), then starts
// the single-process web server (API + Socket.IO + built client).
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

if (!existsSync('client/dist/index.html') || !existsSync('server/dist/serve-client.js')) {
  console.log('[shardcloud] building project...');
  run('npm', ['run', 'build:all']);
}
run('npm', ['--prefix', 'server', 'run', 'start:web']);
