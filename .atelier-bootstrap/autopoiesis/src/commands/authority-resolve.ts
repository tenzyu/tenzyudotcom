/**
 * `atelier:authority:resolve` command.
 *
 * Resolves authority for every authority class in
 * `.atelier/v0/autopoiesis/authority-rules.ndjson` and emits a
 * JSON payload conforming to `atelier.authority-resolution/v1`.
 *
 * Usage:
 *   bun .atelier-bootstrap/autopoiesis/src/commands/authority-resolve.ts -- --scope .
 *
 * The command always seeds the 11 default `AuthorityRule` records
 * on first run; subsequent runs are a no-op for the seed step.
 *
 * The command exits 0 even when no record wins authority. A
 * missing winner is a normal "no authority" state, not a defect.
 *
 * The emitted payload includes a `warnings: string[]` array that
 * surfaces any on-disk `AuthorityRule.precedence` values that
 * disagree with the canonical `DEFAULT_PRECEDENCE` table. The
 * warnings are non-fatal: the resolver still uses the on-disk
 * rule, but operators should review the disagreement before
 * relying on the resolution.
 */
import { DEFAULT_PRECEDENCE, resolveAll, seedDefaults, type AuthorityClass } from '../lib/authority.ts'

export async function runAuthorityResolveCommand(argv: readonly string[]): Promise<number> {
  const opts = parseArgs(argv)
  await seedDefaults()
  const result = await resolveAll(opts.scope)
  const warnings: string[] = []
  for (const r of result.resolutions) {
    for (const rule of r.chain) {
      const ann = rule as unknown as { disagrees_with_default?: boolean; applies_to_class?: AuthorityClass }
      if (ann.disagrees_with_default && ann.applies_to_class === r.class) {
        const defaultP = DEFAULT_PRECEDENCE.get(r.class) ?? 0
        warnings.push(
          `on-disk AuthorityRule '${rule.id}' precedence=${rule.precedence} disagrees with DEFAULT_PRECEDENCE['${r.class}']=${defaultP}; the resolver uses the on-disk value`,
        )
      }
    }
  }
  const payload = {
    schema: 'atelier.authority-resolution/v1',
    scope: result.scope,
    resolutions: result.resolutions.map((r) => ({
      class: r.class,
      scope: r.scope,
      winner_id: r.winner_id,
      winner_precedence: r.winner_precedence,
      candidate_ids: r.candidate_ids,
      candidates: r.candidates,
      conflicts: r.conflicts,
      chain: r.chain,
    })),
    warnings,
    generated_at: new Date().toISOString(),
  }
  process.stdout.write(JSON.stringify(payload, null, 2) + '\n')
  return 0
}

/* -------------------------------------------------------------------------- */
/*                              Argv parsing                                  */
/* -------------------------------------------------------------------------- */

function parseArgs(argv: readonly string[]): { scope: string } {
  let scope = '.'
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--scope') {
      const v = argv[i + 1]
      if (typeof v === 'string' && !v.startsWith('--')) {
        scope = v
        i++
      }
    } else if (a && a.startsWith('--scope=')) {
      scope = a.slice('--scope='.length)
    }
  }
  return { scope }
}

if (import.meta.main) {
  runAuthorityResolveCommand(process.argv.slice(2)).then((code) => process.exit(code))
}
