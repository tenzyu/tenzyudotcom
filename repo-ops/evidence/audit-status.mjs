import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function auditStatus(raw, status, stderr = '') {
  if (stderr.trim()) throw new Error('Bun audit emitted stderr; inspect the private scanner diagnostic');
  const parsed = JSON.parse(raw);
  if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') throw new Error('Unexpected audit response shape');
  let count = 0;
  for (const advisories of Object.values(parsed)) {
    if (!Array.isArray(advisories) || !advisories.length || advisories.some(a =>
      !a || typeof a !== 'object' || typeof a.id !== 'number' ||
      typeof a.vulnerable_versions !== 'string' || typeof a.severity !== 'string')) {
      throw new Error('Unexpected advisory response shape');
    }
    count += advisories.length;
  }
  if ((count === 0 && status !== 0) || (count > 0 && status !== 1)) {
    throw new Error('Audit exit status contradicts advisory response');
  }
  return { status: count ? 'advisories-found' : 'no-advisories-reported', count };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [report, status, stderr] = process.argv.slice(2);
  console.log(JSON.stringify(auditStatus(readFileSync(report, 'utf8'), Number(status), readFileSync(stderr, 'utf8'))));
}
