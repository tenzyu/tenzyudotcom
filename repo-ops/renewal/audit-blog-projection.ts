import { isDeepStrictEqual } from 'node:util';
import { parseBlogIndex, projectBlogIndexEntry } from '../../product/apps/web/src/app/[locale]/(main)/blog/_features/blog-index.assemble';
import { readBlogSource } from '../../product/apps/web/src/app/[locale]/(main)/blog/_features/blog-source.assemble';
import { openGitContentFixture } from './git-content-fixture.mjs';

export function auditBlogProjection(
  repo: Pick<ReturnType<typeof openGitContentFixture>, 'listing' | 'file'>,
  revision: string,
  root = 'storage',
) {
  const tree = repo.listing(revision);
  if (!tree) throw new Error('The specified Git revision is unavailable');
  const prefix = root ? `${root}/` : '';
  const sourcePaths = new Set(tree.filter(({ type, path }) =>
    type === 'blob' && path.startsWith(`${prefix}blog/`) && path.endsWith('.mdx'),
  ).map(({ path }) => path.slice(prefix.length)));
  const index = repo.file(revision, `${prefix}blog/index.json`);
  const issues: { path: string; reason: string }[] = [];
  let entries: ReturnType<typeof parseBlogIndex>;
  try {
    entries = parseBlogIndex(index?.toString());
  } catch {
    return [{ path: 'blog/index.json', reason: 'invalid-index' }];
  }
  for (const entry of entries) {
    if (!sourcePaths.delete(entry.pathname)) {
      issues.push({ path: entry.pathname, reason: 'missing-body' });
      continue;
    }
    try {
      const source = repo.file(revision, `${prefix}${entry.pathname}`);
      if (!source) throw new Error('Git blob unavailable');
      const { metadata } = readBlogSource(source.toString(), entry.pathname);
      const projection = projectBlogIndexEntry(entry.slug, entry.pathname, metadata, entry);
      if (!isDeepStrictEqual(entry, projection)) issues.push({ path: entry.pathname, reason: 'metadata-drift' });
    } catch {
      issues.push({ path: entry.pathname, reason: 'invalid-body' });
    }
  }
  for (const path of sourcePaths) issues.push({ path, reason: 'unlisted-body' });
  return issues;
}

if (import.meta.main) {
  const [directory, revision, root] = process.argv.slice(2);
  if (!directory || !/^[0-9a-f]{40}$/.test(revision ?? '')) {
    throw new Error('Pass a local Git checkout and an explicit commit OID');
  }
  const discrepancies = auditBlogProjection(openGitContentFixture(directory), revision, root);
  console.log(JSON.stringify({ revision, discrepancies }, null, 2));
  if (discrepancies.length) process.exitCode = 1;
}
