import { lstatSync, readFileSync, realpathSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { updateCandidate } from './candidate-state.mjs';

function main() {
  const [command, directory, id, ...extra] = process.argv.slice(2);
  if (!['propose', 'show', 'approve'].includes(command) || !directory || !id || extra.length) throw new Error('usage: node candidate-state-cli.mjs propose|show|approve PRIVATE_DIR ID');
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(id)) throw new Error('invalid ID');
  const dir = resolve(directory);
  const info = lstatSync(dir);
  if (!info.isDirectory() || realpathSync(dir) !== dir || typeof process.getuid !== 'function' || info.uid !== process.getuid() || (info.mode & 0o077) !== 0) throw new Error('directory must be a non-symlink private directory owned by the current user');
  const file = join(dir, `${id}.json`);
  let exists = false;
  try {
    const entry = lstatSync(file);
    if (!entry.isFile() || entry.nlink !== 1 || entry.uid !== process.getuid() || (entry.mode & 0o077) !== 0) throw new Error('invalid state file');
    exists = true;
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (command === 'propose' && exists) throw new Error('ID already exists');
  if (command !== 'propose' && !exists) throw new Error('ID not found');
  if (command === 'show') {
    process.stdout.write(`${JSON.stringify(JSON.parse(readFileSync(file, 'utf8')), null, 2)}\n`);
    return;
  }
  const input = JSON.parse(readFileSync(0, 'utf8'));
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('JSON object required');
  const event = command === 'propose'
    ? { type: 'propose', identity: { task: id }, receivedAt: input.receivedAt, project: input.project, source: input.source, original: input.original, maxAttempts: input.maxAttempts }
    : { type: 'approve', identity: { task: id, worktree: input.worktree, session: input.session }, approval: input.approval };
  process.stdout.write(`${JSON.stringify(updateCandidate(file, event), null, 2)}\n`);
}

try { main(); } catch (error) { console.error(`candidate-state: ${error.message}`); process.exitCode = 1; }
