import { expect, test } from 'bun:test'

for (const fixture of [
  'editor-boundaries.fixture.ts',
  'editor-drafts.fixture.tsx',
]) {
  test(
    fixture,
    async () => {
      const child = Bun.spawn(
        [
          process.execPath,
          '--no-env-file',
          new URL(`../../../tests/fixtures/${fixture}`, import.meta.url).pathname,
        ],
        {
          cwd: process.cwd(),
          stdout: 'pipe',
          stderr: 'pipe',
        },
      )
      const [code, stdout, stderr] = await Promise.all([
        child.exited,
        new Response(child.stdout).text(),
        new Response(child.stderr).text(),
      ])
      expect({ code, output: stdout + stderr }).toEqual({ code: 0, output: '' })
    },
    20_000,
  )
}
