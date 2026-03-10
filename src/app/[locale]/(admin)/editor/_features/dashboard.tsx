import { getLocalizedUrl } from 'intlayer'
import Link from 'next/link'
import { useIntlayer } from 'next-intlayer/server'
import { Content } from '@/components/site-ui/content'
import { PageHeader } from '@/components/site-ui/page-header'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { env, isEditorBlobStorage } from '@/config/env.contract'
import { listEditorCollectionDescriptors } from '@/lib/editor/editor.contract'
import { logoutEditorAdminAction } from './actions'
import { EDITOR_ADMIN_LOCALE } from './constants'

export function EditorDashboard({ locale }: { locale: string }) {
  const content = useIntlayer('editorAdmin', EDITOR_ADMIN_LOCALE)
  const storageLabel = isEditorBlobStorage
    ? content.dashboard.blobStorage.value
    : content.dashboard.localStorage.value

  return (
    <Content size="4xl" className="space-y-8">
      <PageHeader
        title={content.dashboard.title.value}
        description={content.dashboard.description.value}
      />
      <form action={logoutEditorAdminAction}>
        <input type="hidden" name="locale" value={locale} />
        <button type="submit" className="text-sm underline underline-offset-4">
          {content.dashboard.logoutLabel.value}
        </button>
      </form>
      <div className="grid gap-4 md:grid-cols-2">
        {listEditorCollectionDescriptors().map((collection) => (
          <Card key={collection.id}>
            <CardHeader className="space-y-2">
              <CardTitle>{collection.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                <strong>{content.dashboard.storageLabel.value}:</strong>{' '}
                {storageLabel}
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
                href={getLocalizedUrl(`/editor/${collection.id}`, locale)}
                className="inline-flex text-sm underline underline-offset-4"
              >
                {content.dashboard.openLabel.value}
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-muted-foreground text-xs">
        EDITOR_STORAGE_DRIVER={env.editorStorageDriver}
      </p>
    </Content>
  )
}
