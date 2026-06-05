/**
 * Re-render every view across every component.
 */
const STEPS: Array<{ cli: string; args: string[] }> = [
  { cli: '.atelier-bootstrap/indexer/src/cli.ts', args: ['render'] },
  { cli: '.atelier-bootstrap/reader/src/cli.ts', args: ['render'] },
  { cli: '.atelier-bootstrap/transformer/src/cli.ts', args: ['render'] },
  { cli: '.atelier-bootstrap/executor/src/cli.ts', args: ['render'] },
]

export async function runRender(): Promise<{ rendered: number; failed: number }> {
  let rendered = 0
  let failed = 0
  for (const step of STEPS) {
    const proc = Bun.spawnSync(['bun', step.cli, ...step.args], {
      cwd: process.cwd(),
      env: process.env,
    })
    if (proc.exitCode === 0) rendered += 1
    else failed += 1
  }
  return { rendered, failed }
}
