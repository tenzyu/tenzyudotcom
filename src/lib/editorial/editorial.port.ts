import type { NoteSourceEntry } from '@/app/[locale]/(main)/notes/_features/notes.domain'
import type { DashboardSourceCategory } from '@/app/[locale]/(main)/pointers/_features/dashboard/dashboard.domain'
import type { PuzzleCategory } from '@/app/[locale]/(main)/puzzles/_features/puzzles.domain'
import type { RecommendationSourceEntry } from '@/app/[locale]/(main)/recommendations/_features/recommendations.domain'
import type { MyLink } from '@/features/links/links.domain'

export type EditorialCollectionId =
  | 'recommendations'
  | 'notes'
  | 'puzzles'
  | 'pointers'
  | 'links'

export type EditorialCollectionData = {
  recommendations: readonly RecommendationSourceEntry[]
  notes: readonly NoteSourceEntry[]
  puzzles: readonly PuzzleCategory[]
  pointers: readonly DashboardSourceCategory[]
  links: readonly MyLink[]
}

export type EditorialState<K extends EditorialCollectionId> = {
  collection: EditorialCollectionData[K]
  serialized: string
  version: string
}

export type RevalidatePathTarget = {
  path: string
  type?: 'page' | 'layout'
}

export interface EditorialRepository {
  loadState<K extends EditorialCollectionId>(
    collectionId: K,
  ): Promise<EditorialState<K>>

  save(
    collectionId: EditorialCollectionId,
    rawJson: string,
    expectedVersion?: string,
  ): Promise<{
    version: string
  }>
}
