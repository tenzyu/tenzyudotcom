export type EditorMutationState =
  | { status: 'idle' }
  | { status: 'saved'; message: string; version: string; slug: string }
  | {
      status: 'error'
      error: 'invalid' | 'conflict' | 'save' | 'uncertain'
      message: string
    }
