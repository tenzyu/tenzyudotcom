import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else if (entry.isFile() && path.endsWith('.js')) yield path;
  }
}

const relativeImport = /((?:import|export)\s+(?:[^'";]+?\s+from\s+)?["'])(\.{1,2}\/[^"']+)(["'])/g;

for await (const file of walk('dist')) {
  let code = await readFile(file, 'utf8');
  code = code.replace(relativeImport, (match, prefix, specifier, suffix) => {
    if (/\.(?:js|mjs|cjs|json|css)$/.test(specifier)) return match;
    return `${prefix}${specifier}.js${suffix}`;
  });
  await writeFile(file, code);
}
