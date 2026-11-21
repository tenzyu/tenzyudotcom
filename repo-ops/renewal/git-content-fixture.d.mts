type GitContentFixture = {
  head(): string
  file(ref: string, path: string): Buffer | null
  parents(ref: string): string[]
  history(): string[]
  listing(ref: string): { path: string; mode: string; type: string; sha: string }[] | null
  advance(files: Record<string, string | null>, message: string): string
  fetch(input: string | URL | Request, init?: RequestInit): Promise<Response>
  isAncestor(base: string, tip: string): boolean
}

export const fixtureBase: string
export function openGitContentFixture(
  directory: string,
  options?: { allowNotesWrite?: boolean },
): GitContentFixture
export function initGitContentFixture(directory: string, files: Record<string, string>): GitContentFixture
