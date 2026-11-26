import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const [evidenceRoot, output] = process.argv.slice(2);
if (!output) throw new Error('Usage: node evidence-summary.mjs EVIDENCE_ROOT NEW_JSON');
const checks = [];
for (const entry of readdirSync(evidenceRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const path = join(evidenceRoot, entry.name, 'result.json');
  if (!existsSync(path)) continue;
  const result = JSON.parse(readFileSync(path, 'utf8'));
  checks.push({ id: entry.name, command: result.command, cwd: result.cwd, status: result.status, exitCode: result.exitCode, startedAt: result.startedAt, durationMs: result.durationMs, logSha256: result.logSha256 });
}
checks.sort((a, b) => a.startedAt.localeCompare(b.startedAt));
writeFileSync(output, `${JSON.stringify({ schemaVersion: 1, note: 'Command durations are single observations, not comparative benchmarks. Raw logs remain outside Git.', checks }, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify(checks.map(({ id, status, exitCode }) => ({ id, status, exitCode }))));
