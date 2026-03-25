export type SaveBlogPostActionState = {
  error?: 'conflict' | 'invalid' | 'save' | 'validation'
  message?: string
}

export const INITIAL_SAVE_BLOG_POST_ACTION_STATE: SaveBlogPostActionState = {}
