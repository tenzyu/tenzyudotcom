import type { NoteSourceEntry } from '@/app/[locale]/(main)/notes/_features/notes.domain'
import type { DashboardSourceCategory } from '@/app/[locale]/(main)/pointers/_features/dashboard/dashboard.domain'
import type { PuzzleCategory } from '@/app/[locale]/(main)/puzzles/_features/puzzles.domain'
import type { RecommendationSourceEntry } from '@/app/[locale]/(main)/recommendations/_features/recommendations.domain'
import type { MyLink } from '@/features/links/links.domain'

import type { MDXData } from '@/app/[locale]/(main)/blog/_features/blog.domain'

export type EditorCollectionId =
  | 'recommendations'
  | 'notes'
  | 'puzzles'
  | 'pointers'
  | 'links'
  | 'blog'

export type EditorCollectionData = {
  recommendations: readonly RecommendationSourceEntry[]
  notes: readonly NoteSourceEntry[]
  puzzles: readonly PuzzleCategory[]
  pointers: readonly DashboardSourceCategory[]
  links: readonly MyLink[]
  blog: readonly MDXData[]
}

export type EditorState<K extends EditorCollectionId> = {
  collection: EditorCollectionData[K]
  serialized: string
  version: string
}

export type RevalidatePathTarget = {
  path: string
  type?: 'page' | 'layout'
}

export class EditorStorageError extends Error {}
export class EditorStorageNotFoundError extends EditorStorageError {}
export class EditorVersionConflictError extends EditorStorageError {}
