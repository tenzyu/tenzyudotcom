import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream, writeFileSync } from 'node:fs';

const [archive, restoredRoot, output] = process.argv.slice(2);
if (!archive || !restoredRoot || !output) throw new Error('Usage: node verify-restore.mjs ARCHIVE RESTORED_ROOT NEW_REPORT');
const digest = createHash('sha256');
for await (const chunk of createReadStream(archive)) digest.update(chunk);
const comparison = spawnSync('tar', ['--compare', '--file', archive, '--directory', restoredRoot], {
  encoding: 'utf8', maxBuffer: 32 * 1024 * 1024,
});
const lines = `${comparison.stdout ?? ''}${comparison.stderr ?? ''}`.split('\n').filter(Boolean);
const groupDifferences = lines.filter((line) => line.endsWith(': Gid differs')).length;
const unexpected = lines.filter((line) => !line.endsWith(': Gid differs'));
const contentsMatch = !comparison.error && [0, 1].includes(comparison.status) && unexpected.length === 0;
const report = {
  archive, restoredRoot, checkedAt: new Date().toISOString(), sha256: digest.digest('hex'),
  tarExitCode: comparison.status, contentsMatch, groupDifferences,
  metadataIdentical: contentsMatch && groupDifferences === 0, unexpected,
};
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600, flag: 'wx' });
console.log(JSON.stringify(report));
process.exitCode = contentsMatch ? 0 : 1;
