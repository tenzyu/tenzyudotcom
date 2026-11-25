import { lstatSync, realpathSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';

// Resolve the existing prefix, including symlinks, before creating any output.
// This is a guard for trusted local operators, not a race-resistant sandbox.
function canonicalPath(path) {
  try {
    lstatSync(path);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const parent = dirname(path);
    if (parent === path) throw error;
    return resolve(canonicalPath(parent), relative(parent, path));
  }
  // A dangling symlink must fail closed rather than be treated as a missing file.
  return realpathSync(path);
}

function contains(root, path) {
  const rel = relative(root, path);
  return rel === '' || (!isAbsolute(rel) && rel !== '..' && !rel.startsWith('..' + sep));
}

export function externalEvidencePath(workspace, destination, { disjoint = true } = {}) {
  const root = realpathSync(resolve(workspace));
  const requested = resolve(destination);
  const canonical = canonicalPath(requested);
  for (const path of [requested, canonical]) {
    if (contains(root, path) || (disjoint && contains(path, root))) {
      throw new Error('Evidence must be outside the checkout (and not an ancestor for exclusive output)');
    }
  }
  return canonical;
}
