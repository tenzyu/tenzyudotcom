import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const [input, output] = process.argv.slice(2);
if (!input || !output) throw new Error('Usage: node catalog.mjs INVENTORY_JSON NEW_CSV');
const inventory = JSON.parse(readFileSync(input, 'utf8'));
const inventorySha = createHash('sha256').update(readFileSync(input)).digest('hex');
function owner(path) {
  if (/atelier/i.test(path) || path.startsWith('harness/')) return 'atelier-or-legacy-harness';
  const product = path.match(/^product\/(apps|packages)\/([^/]+)/);
  if (product) return product[2];
  return path.split('/')[0];
}
function classification(entry) {
  if (entry.kind === 'secret-location') return ['保持', '秘密の所在のみ。値を転記しない', '資格情報の移行・権限は別途確認'];
  if (entry.path.includes('atelier')) return ['アーカイブ', '本人の廃止方針。不可逆削除の承認は未取得', '旧履歴・運用データ・CLI利用元を保全'];
  if (entry.kind === 'directory') return ['判断保留', '生成物・依存等の探索除外を明示', 'バックアップ対象。不存在とは判断しない'];
  if (entry.kind === 'test') return ['保持', '既存挙動の観測資産。対象廃止時に再評価', '実行済みとは限らない'];
  if (entry.path.includes('/archives/osu-profile/')) return ['改善', 'osu! 復帰候補。履歴とAPI現在値の分離が必要', '出典・取得日時・外部メディア権利は未検証'];
  if (entry.kind === 'media' || entry.kind === 'data') return ['保持', '移行前の資産保全。公開継続とは別判断', '削除不可。権利・更新日を確認'];
  return ['判断保留', '存在は確認。利用・保守価値の個別評価は未完了', '依存を解決してから採否判断'];
}
const quote = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
const rows = [['path', 'kind', 'git_state', 'bytes', 'owner', 'classification', 'reason', 'risk', 'evidence', 'approval']];
for (const entry of inventory.entries) {
  const [classificationValue, reason, risk] = classification(entry);
  rows.push([entry.path, entry.kind, entry.state ?? entry.coverage, entry.bytes, owner(entry.path), classificationValue, reason, risk, `inventory-sha256:${inventorySha};observed:${inventory.observedAt};path:${entry.path}`, '未承認・機械分類']);
}
writeFileSync(output, `${rows.map((row) => row.map(quote).join(',')).join('\n')}\n`, { flag: 'wx' });
const groups = Object.groupBy(inventory.entries, (entry) => owner(entry.path));
console.log(JSON.stringify({
  summary: inventory.summary,
  owners: Object.fromEntries(Object.entries(groups).map(([key, entries]) => [key, { files: entries.length, bytes: entries.reduce((sum, entry) => sum + (entry.bytes ?? 0), 0) }])),
  routes: inventory.entries.filter((entry) => entry.kind === 'route').map((entry) => entry.path),
  symlinks: inventory.entries.filter((entry) => entry.kind === 'symlink'),
  secretLocations: inventory.entries.filter((entry) => entry.kind === 'secret-location').map((entry) => entry.path),
  packages: inventory.packages.map((pkg) => ({ name: pkg.name, dependencies: Object.entries(pkg.dependencies ?? {}).filter(([, value]) => value.startsWith('workspace:')).map(([name]) => name) })),
}, null, 2));
