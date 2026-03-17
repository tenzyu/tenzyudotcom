import type { DictionaryKeys } from '@intlayer/types'
import { defaultLocale, getIntlayer, getMultilingualUrls } from 'intlayer'
import type { Metadata } from 'next'
import type { LocalPromiseParams } from 'next-intlayer'

type IntlayerValue<T = unknown> = {
  value: T
}

type MetadataLike = Partial<Metadata> & {
  title?: Metadata['title'] | IntlayerValue<string> | null
  description?: Metadata['description'] | IntlayerValue<string> | null
  alternates?: Metadata['alternates']
  openGraph?: Record<string, unknown> | null
  twitter?: Record<string, unknown> | null
}

type CreatePageMetadataOptions<K extends DictionaryKeys> = {
  pathname?: string | ((content: ReturnType<typeof getIntlayer<K>>) => string)
  select?: (content: ReturnType<typeof getIntlayer<K>>) => MetadataLike
}

export async function resolvePageLocale(params: LocalPromiseParams['params']) {
  const { locale } = await params
  return locale
}

const hasValue = <T>(value: unknown): value is IntlayerValue<T> =>
  typeof value === 'object' && value !== null && 'value' in value

const unwrap = <T>(value: T | IntlayerValue<T> | undefined): T | undefined =>
  hasValue<T>(value) ? value.value : value

const normalizeNullable = <T>(value: T | null | undefined) => value ?? undefined

const resolvePathname = <K extends DictionaryKeys>(
  pathname: CreatePageMetadataOptions<K>['pathname'],
  content: ReturnType<typeof getIntlayer<K>>,
) => {
  if (typeof pathname === 'function') {
    return pathname(content)
  }

  return pathname
}

const createAlternates = (
  pathname: string,
  alternates: Metadata['alternates'] | undefined,
) => {
  const languages = getMultilingualUrls(pathname)
  const canonical =
    languages[defaultLocale as keyof typeof languages] ?? pathname

  return {
    ...alternates,
    canonical: alternates?.canonical ?? canonical,
    languages: {
      ...languages,
      'x-default': canonical,
      ...alternates?.languages,
    },
  } satisfies Metadata['alternates']
}

const createOpenGraph = (
  metadata: MetadataLike,
  localizedUrl: string | undefined,
  title: Metadata['title'],
  description: Metadata['description'],
) => {
  const openGraph = (metadata.openGraph ?? {}) as Record<string, unknown>

  return {
    ...openGraph,
    type: openGraph.type ?? 'website',
    url:
      normalizeNullable(
        unwrap(openGraph.url as string | IntlayerValue<string> | null),
      ) ?? localizedUrl,
    title: normalizeNullable(
      unwrap(
        openGraph.title as Metadata['title'] | IntlayerValue<string> | null,
      ) ?? title,
    ),
    description: normalizeNullable(
      unwrap(
        openGraph.description as
          | Metadata['description']
          | IntlayerValue<string>
          | null,
      ) ?? description,
    ),
  } as Metadata['openGraph']
}

const createTwitter = (
  metadata: MetadataLike,
  title: Metadata['title'],
  description: Metadata['description'],
) => {
  const twitter = (metadata.twitter ?? {}) as Record<string, unknown>
  const twitterImages = twitter.images
  const openGraphImages = (
    metadata.openGraph as Record<string, unknown> | null | undefined
  )?.images
  const hasLargeImage =
    (Array.isArray(twitterImages)
      ? twitterImages.length
      : Number(Boolean(twitterImages))) > 0 ||
    (Array.isArray(openGraphImages)
      ? openGraphImages.length
      : Number(Boolean(openGraphImages))) > 0

  return {
    ...twitter,
    card: twitter.card ?? (hasLargeImage ? 'summary_large_image' : 'summary'),
    title: normalizeNullable(
      unwrap(
        twitter.title as Metadata['title'] | IntlayerValue<string> | null,
      ) ?? title,
    ),
    description: normalizeNullable(
      unwrap(
        twitter.description as
          | Metadata['description']
          | IntlayerValue<string>
          | null,
      ) ?? description,
    ),
  } as Metadata['twitter']
}

export function createPageMetadata<K extends DictionaryKeys>(
  key: K,
  options: CreatePageMetadataOptions<K> = {},
) {
  return async ({ params }: LocalPromiseParams): Promise<Metadata> => {
    const locale = await resolvePageLocale(params)
    const content = getIntlayer(key, locale)
    const defaultMetadata = (content as { metadata?: MetadataLike })?.metadata
    const selectedMetadata = options.select?.(content) ?? defaultMetadata ?? {}
    const pathname = resolvePathname(options.pathname, content)
    const alternates = pathname
      ? createAlternates(pathname, selectedMetadata.alternates)
      : selectedMetadata.alternates
    const localizedUrl =
      pathname && alternates?.languages
        ? normalizeNullable(
            alternates.languages[locale as keyof typeof alternates.languages] as
              | string
              | null
              | undefined,
          )
        : undefined

    const title = normalizeNullable(
      unwrap(
        selectedMetadata.title as
          | Metadata['title']
          | IntlayerValue<string>
          | null,
      ),
    )
    const description = normalizeNullable(
      unwrap(
        selectedMetadata.description as
          | Metadata['description']
          | IntlayerValue<string>
          | null,
      ),
    )

    return {
      ...selectedMetadata,
      title,
      description,
      alternates,
      openGraph: createOpenGraph(
        selectedMetadata,
        localizedUrl,
        title,
        description,
      ),
      twitter: createTwitter(selectedMetadata, title, description),
    }
  }
}
