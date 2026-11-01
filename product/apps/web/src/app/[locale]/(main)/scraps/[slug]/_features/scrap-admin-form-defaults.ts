import {
  SCRAP_ENTRY_KINDS,
  type ContentLocale,
  type ScrapEntryKind,
} from '../../_features/scraps.domain'

export type AppendEntryFormDefaults = {
  locale: ContentLocale
  uiLocale: string
  scrapSlug: string
  kindOptions: readonly ScrapEntryKind[]
}

export function getAppendEntryFormDefaults(
  scrapSlug: string,
  locale: ContentLocale,
  uiLocale: string,
): AppendEntryFormDefaults {
  return {
    locale,
    uiLocale,
    scrapSlug,
    kindOptions: SCRAP_ENTRY_KINDS,
  }
}
