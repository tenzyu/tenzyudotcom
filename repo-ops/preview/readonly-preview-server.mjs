import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { createPreviewGate } from './readonly-preview-gate.mjs';

const root = resolve(import.meta.dirname, '../..');
const next = spawn(process.execPath, [resolve(root, 'node_modules/next/dist/bin/next'), 'dev', '--hostname', '127.0.0.1', '--port', '0'], {
  cwd: resolve(root, 'product/apps/web'), stdio: ['ignore', 'pipe', 'inherit'], env: process.env,
});
let output = '';
let gate;
next.stdout.on('data', (chunk) => {
  process.stdout.write(chunk);
  output = `${output}${chunk}`.slice(-32768);
  const port = output.match(/http:\/\/127\.0\.0\.1:(\d+)/)?.[1];
  if (port && output.includes('Ready in') && !gate) {
    gate = createPreviewGate(Number(port));
    gate.on('error', (error) => { console.error(error); next.kill('SIGTERM'); process.exitCode = 1; });
    gate.listen(43192, '127.0.0.1', () => console.log('Preview gate listening on 127.0.0.1:43192'));
  }
});
next.on('error', (error) => { console.error(error); process.exitCode = 1; });
next.on('exit', () => { gate?.close(); process.exitCode = 1; });
