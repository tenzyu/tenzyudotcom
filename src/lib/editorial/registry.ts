import { parseNoteSourceEntries } from '@/app/[locale]/(main)/notes/_features/notes.contract'
import type { NoteSourceEntry } from '@/app/[locale]/(main)/notes/_features/notes.source'
import { NOTE_SOURCE_ENTRIES } from '@/app/[locale]/(main)/notes/_features/notes.source'
import { parseDashboardSourceCategories } from '@/app/[locale]/(main)/pointers/_features/dashboard/dashboard.contract'
import type { DashboardSourceCategory } from '@/app/[locale]/(main)/pointers/_features/dashboard/dashboard.source'
import { DASHBOARD_SOURCE_CATEGORIES } from '@/app/[locale]/(main)/pointers/_features/dashboard/dashboard.source'
import { parsePuzzleSourceCategories } from '@/app/[locale]/(main)/puzzles/_features/puzzles.contract'
import type { PuzzleCategory } from '@/app/[locale]/(main)/puzzles/_features/puzzles.source'
import { PUZZLE_SOURCE_CATEGORIES } from '@/app/[locale]/(main)/puzzles/_features/puzzles.source'
import { parseRecommendationSourceEntries } from '@/app/[locale]/(main)/recommendations/_features/recommendations.contract'
import type { RecommendationSourceEntry } from '@/app/[locale]/(main)/recommendations/_features/recommendations.source'
import { RECOMMENDATION_SOURCE_ENTRIES } from '@/app/[locale]/(main)/recommendations/_features/recommendations.source'
import type { MyLink } from '@/features/links/links.contract'
import { parseLinkSourceEntries } from '@/features/links/links.contract'
import { LINK_SOURCE_ENTRIES } from '@/features/links/links.source'

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

type EditorialCollectionDescriptor<K extends EditorialCollectionId> = {
  id: K
  label: string
  canonicalPath: string
  storagePath: string
  publicPaths: readonly RevalidatePathTarget[]
  getDefaultValue: () => EditorialCollectionData[K]
  parse: (raw: unknown) => EditorialCollectionData[K]
}

export type RevalidatePathTarget = {
  path: string
  type?: 'page' | 'layout'
}

const LOCALE_PREFIXES = ['/ja', '/en'] as const

function withLocales(pathname: string) {
  return LOCALE_PREFIXES.map((locale) => ({
    path: `${locale}${pathname}`,
  })) satisfies readonly RevalidatePathTarget[]
}

export const EDITORIAL_COLLECTIONS = {
  recommendations: {
    id: 'recommendations',
    label: 'Recommendations',
    canonicalPath:
      'src/app/[locale]/(main)/recommendations/_features/recommendations.source.ts',
    storagePath: 'recommendations.json',
    publicPaths: withLocales('/recommendations'),
    getDefaultValue: () => structuredClone(RECOMMENDATION_SOURCE_ENTRIES),
    parse: parseRecommendationSourceEntries,
  },
  notes: {
    id: 'notes',
    label: 'Notes',
    canonicalPath: 'src/app/[locale]/(main)/notes/_features/notes.source.ts',
    storagePath: 'notes.json',
    publicPaths: withLocales('/notes'),
    getDefaultValue: () => structuredClone(NOTE_SOURCE_ENTRIES),
    parse: parseNoteSourceEntries,
  },
  puzzles: {
    id: 'puzzles',
    label: 'Puzzles',
    canonicalPath:
      'src/app/[locale]/(main)/puzzles/_features/puzzles.source.ts',
    storagePath: 'puzzles.json',
    publicPaths: withLocales('/puzzles'),
    getDefaultValue: () => structuredClone(PUZZLE_SOURCE_CATEGORIES),
    parse: parsePuzzleSourceCategories,
  },
  pointers: {
    id: 'pointers',
    label: 'Pointers',
    canonicalPath:
      'src/app/[locale]/(main)/pointers/_features/dashboard/dashboard.source.ts',
    storagePath: 'pointers.json',
    publicPaths: withLocales('/pointers'),
    getDefaultValue: () => structuredClone(DASHBOARD_SOURCE_CATEGORIES),
    parse: parseDashboardSourceCategories,
  },
  links: {
    id: 'links',
    label: 'Links',
    canonicalPath: 'src/features/links/links.source.ts',
    storagePath: 'links.json',
    publicPaths: [
      ...withLocales('/links'),
      ...LOCALE_PREFIXES.map((locale) => ({
        path: `${locale}/links/[shortUrl]`,
        type: 'page' as const,
      })),
    ],
    getDefaultValue: () => structuredClone(LINK_SOURCE_ENTRIES),
    parse: parseLinkSourceEntries,
  },
} satisfies { [K in EditorialCollectionId]: EditorialCollectionDescriptor<K> }

export function getEditorialCollectionDescriptor<
  K extends EditorialCollectionId,
>(id: K) {
  return EDITORIAL_COLLECTIONS[id]
}

export function listEditorialCollectionDescriptors() {
  return Object.values(EDITORIAL_COLLECTIONS)
}
