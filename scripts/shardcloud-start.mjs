// ShardCloud launcher: builds client + server when the source changed since the last
// build (or when dist is missing), then starts the single-process web server
// (API + Socket.IO + built client).
//
// ShardCloud keeps the previous dist/ folders between deploys, so checking only for
// their existence would keep serving an old build after a new commit is deployed.
// A content hash of the sources is stored next to the build and compared on boot.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

const SOURCES = [
  'package.json',
  'client/package.json', 'client/package-lock.json', 'client/index.html', 'client/vite.config.ts',
  'client/tailwind.config.js', 'client/postcss.config.js', 'client/tsconfig.json', 'client/src', 'client/public',
  'server/package.json', 'server/package-lock.json', 'server/tsconfig.json', 'server/src',
];
const STAMP = 'server/dist/.build-hash';

function collect(path, files) {
  if (!existsSync(path)) return;
  const stat = statSync(path);
  if (stat.isDirectory()) {
    for (const name of readdirSync(path).sort()) {
      if (name === 'node_modules' || name === 'dist' || name.startsWith('.')) continue;
      collect(join(path, name), files);
    }
  } else {
    files.push(path);
  }
}

function sourceHash() {
  const files = [];
  for (const source of SOURCES) collect(source, files);
  const hash = createHash('sha256');
  for (const file of files) {
    hash.update(file);
    hash.update('\0');
    hash.update(readFileSync(file));
    hash.update('\0');
  }
  return hash.digest('hex');
}

const current = sourceHash();
const previous = existsSync(STAMP) ? readFileSync(STAMP, 'utf8').trim() : '';
const hasBuild = existsSync('client/dist/index.html') && existsSync('server/dist/serve-client.js');

if (!hasBuild || previous !== current) {
  console.log(`[shardcloud] ${hasBuild ? 'source changed since last build' : 'no build found'}; building project...`);
  run('npm', ['run', 'build:all']);
  writeFileSync(STAMP, current);
  console.log(`[shardcloud] build ${current.slice(0, 12)} ready`);
} else {
  console.log(`[shardcloud] build ${current.slice(0, 12)} is up to date`);
}

run('npm', ['--prefix', 'server', 'run', 'start:web']);
