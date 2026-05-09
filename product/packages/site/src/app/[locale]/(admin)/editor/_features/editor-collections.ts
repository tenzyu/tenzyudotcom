import type { MDXData } from '@/app/[locale]/(main)/blog/_features/blog.domain'
import type { NoteSourceEntry } from '@/app/[locale]/(main)/notes/_features/notes.domain'
import type { DashboardSourceCategory } from '@/app/[locale]/(main)/pointers/_features/dashboard/dashboard.domain'
import type { PuzzleCategory } from '@/app/[locale]/(main)/puzzles/_features/puzzles.domain'
import type { RecommendationSourceEntry } from '@/features/recommendations/recommendations.domain'
import type { MyLink } from '@/features/links/links.domain'
import type {
  RevalidatePathTarget,
  StoredCollectionState,
} from '@/lib/content-store/content-store.domain'
import {
  LOCALE_PREFIXES,
  withLocaleRevalidatePaths,
} from '@/lib/content-store/content-store.domain'

export const EDITOR_COLLECTION_IDS = [
  'recommendations',
  'notes',
  'puzzles',
  'pointers',
  'links',
  'blog',
] as const

export type EditorCollectionId = (typeof EDITOR_COLLECTION_IDS)[number]

export type EditorCollectionData = {
  recommendations: readonly RecommendationSourceEntry[]
  notes: readonly NoteSourceEntry[]
  puzzles: readonly PuzzleCategory[]
  pointers: readonly DashboardSourceCategory[]
  links: readonly MyLink[]
  blog: readonly MDXData[]
}

export type EditorCollectionState<K extends EditorCollectionId> =
  StoredCollectionState<EditorCollectionData[K]>

type EditorCollectionMeta = {
  id: EditorCollectionId
  label: string
  publicPaths: readonly RevalidatePathTarget[]
}

export const EDITOR_COLLECTIONS: Record<EditorCollectionId, EditorCollectionMeta> = {
  recommendations: {
    id: 'recommendations',
    label: 'Recommendations',
    publicPaths: withLocaleRevalidatePaths('/recommendations'),
  },
  notes: {
    id: 'notes',
    label: 'Notes',
    publicPaths: withLocaleRevalidatePaths('/notes'),
  },
  puzzles: {
    id: 'puzzles',
    label: 'Puzzles',
    publicPaths: withLocaleRevalidatePaths('/puzzles'),
  },
  pointers: {
    id: 'pointers',
    label: 'Pointers',
    publicPaths: withLocaleRevalidatePaths('/pointers'),
  },
  links: {
    id: 'links',
    label: 'Links',
    publicPaths: [
      ...withLocaleRevalidatePaths('/links'),
      ...LOCALE_PREFIXES.map((locale) => ({
        path: `${locale}/links/[shortUrl]`,
        type: 'page' as const,
      })),
    ],
  },
  blog: {
    id: 'blog',
    label: 'Blog',
    publicPaths: withLocaleRevalidatePaths('/blog'),
  },
}

export function getEditorCollectionMeta<K extends EditorCollectionId>(id: K) {
  return EDITOR_COLLECTIONS[id]
}

export function listEditorCollectionMeta() {
  return Object.values(EDITOR_COLLECTIONS)
}

export function isEditorCollectionId(value: string): value is EditorCollectionId {
  return EDITOR_COLLECTION_IDS.includes(value as EditorCollectionId)
}
