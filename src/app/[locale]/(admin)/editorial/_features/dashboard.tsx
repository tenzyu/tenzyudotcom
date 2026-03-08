import Link from 'next/link'
import { getLocalizedUrl } from 'intlayer'
import { useIntlayer } from 'next-intlayer/server'
import { Content } from '@/components/site-ui/content'
import { PageHeader } from '@/components/site-ui/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { listEditorialCollectionDescriptors } from '@/lib/editorial/registry'
import { env, isEditorialBlobStorage } from '@/config/env.contract'
import { logoutEditorialAdminAction } from './actions'
import { EDITORIAL_ADMIN_LOCALE } from './constants'

export function EditorialDashboard({ locale }: { locale: string }) {
  const content = useIntlayer('editorialAdmin', EDITORIAL_ADMIN_LOCALE)
  const storageLabel = isEditorialBlobStorage
    ? content.dashboard.blobStorage.value
    : content.dashboard.localStorage.value

  return (
    <Content size="4xl" className="space-y-8">
      <PageHeader
        title={content.dashboard.title.value}
        description={content.dashboard.description.value}
      />
      <form action={logoutEditorialAdminAction}>
        <input type="hidden" name="locale" value={locale} />
        <button type="submit" className="text-sm underline underline-offset-4">
          {content.dashboard.logoutLabel.value}
        </button>
      </form>
      <div className="grid gap-4 md:grid-cols-2">
        {listEditorialCollectionDescriptors().map((collection) => (
          <Card key={collection.id}>
            <CardHeader className="space-y-2">
              <CardTitle>{collection.label}</CardTitle>
              <CardDescription>{collection.canonicalPath}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                <strong>{content.dashboard.storageLabel.value}:</strong> {storageLabel}
              </p>
              <div className="space-y-1">
                <strong>{content.dashboard.publicPathsLabel.value}:</strong>
                <ul className="list-disc pl-5">
                  {collection.publicPaths.map((path) => (
                    <li key={path.path}>{path.path}</li>
                  ))}
                </ul>
              </div>
              <Link
                href={getLocalizedUrl(`/editorial/${collection.id}`, locale)}
                className="inline-flex text-sm underline underline-offset-4"
              >
                {content.dashboard.openLabel.value}
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-muted-foreground text-xs">
        EDITORIAL_STORAGE_DRIVER={env.editorialStorageDriver}
      </p>
    </Content>
  )
}
