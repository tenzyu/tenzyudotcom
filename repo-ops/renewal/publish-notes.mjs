import { constants, copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';

const [sourceArg, targetArg, browserArg, privateNoteArg, catalogArg] = process.argv.slice(2);
if (!catalogArg) throw new Error('Usage: node publish-notes.mjs DOCS NEW_VAULT_PROJECT BROWSER_EVIDENCE PRIVATE_NOTE FILE_CATALOG');
const source = resolve(sourceArg);
const target = resolve(targetArg);
if (existsSync(target)) throw new Error('Refusing to overwrite an existing notes project');
mkdirSync(target, { recursive: true, mode: 0o700 });
const files = [];
function publish(from, relative) {
  const destination = join(target, relative);
  copyFileSync(from, destination, constants.COPYFILE_EXCL);
  const hash = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
  const sourceSha256 = hash(from);
  if (sourceSha256 !== hash(destination)) throw new Error(`Published copy differs: ${relative}`);
  files.push({ path: relative, sha256: sourceSha256 });
}
for (const entry of readdirSync(source, { withFileTypes: true })) {
  if (entry.isFile() && /\.(md|csv|json)$/.test(entry.name)) publish(join(source, entry.name), entry.name);
}
mkdirSync(join(target, 'evidence'), { mode: 0o700 });
for (const entry of readdirSync(browserArg, { withFileTypes: true })) {
  if (entry.isFile() && (/\.(png|zip)$/.test(entry.name) || entry.name === 'observations.json')) publish(join(browserArg, entry.name), `evidence/${entry.name}`);
}
publish(privateNoteArg, '11-local-evidence.md');
publish(catalogArg, 'file-inventory.csv');
writeFileSync(join(target, 'publication.json'), `${JSON.stringify({ publishedAt: new Date().toISOString(), source, files }, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
console.log(JSON.stringify({ target, verifiedFiles: files.length }));
