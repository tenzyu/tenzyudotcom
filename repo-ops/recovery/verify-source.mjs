import { readFileSync, lstatSync, readlinkSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
const [inventoryPath, restoredRoot, reportPath] = process.argv.slice(2);
if (!reportPath) throw new Error('Usage: node verify-source.mjs INVENTORY RESTORED_REPO NEW_REPORT');
const { entries, root } = JSON.parse(readFileSync(inventoryPath, 'utf8'));
const changed = [];
const missingSaved = [];
const missingCurrent = [];
let checked = 0;
const stat = (path) => {
  try { return lstatSync(path); } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
};
const selected = entries.filter((entry) => ['tracked', 'untracked'].includes(entry.state));
for (const entry of selected) {
  const current = join(root, entry.path);
  const saved = join(restoredRoot, entry.path);
  if (!stat(saved)) { missingSaved.push(entry.path); continue; }
  if (!stat(current)) { missingCurrent.push(entry.path); continue; }
  checked++;
  const hash = (path) => lstatSync(path).isSymbolicLink() ? readlinkSync(path) : createHash('sha256').update(readFileSync(path)).digest('hex');
  if (hash(current) !== hash(saved)) changed.push(entry.path);
}
const complete = selected.length > 0 && checked === selected.length && changed.length === 0;
const report = { checkedAt: new Date().toISOString(), root, restoredRoot, expected: selected.length, checked, changed, missingSaved, missingCurrent, complete };
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
console.log(JSON.stringify(report));
process.exitCode = complete ? 0 : 1;
