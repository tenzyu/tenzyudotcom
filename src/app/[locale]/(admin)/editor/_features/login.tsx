import { useIntlayer } from 'next-intlayer/server'
import { Content } from '@/components/site-ui/content'
import { PageHeader } from '@/components/site-ui/page-header'
import { Button } from '@/components/ui/button'
import { env } from '@/config/env.contract'
import { loginEditorAdminAction } from './actions'
import { EDITOR_ADMIN_LOCALE } from './constants'

export function EditorLogin({
  locale,
  error,
}: {
  locale: string
  error?: string
}) {
  const content = useIntlayer('editorAdmin', EDITOR_ADMIN_LOCALE)
  const isConfigured =
    !!env.editorAdminPassword && !!env.editorSessionSecret

  return (
    <Content size="sm" className="space-y-8 py-12">
      <PageHeader
        title={content.login.title.value}
        description={content.login.description.value}
      />
      {!isConfigured ? (
        <p className="text-sm">{content.login.missingMessage.value}</p>
      ) : (
        <form action={loginEditorAdminAction} className="space-y-4">
          <input type="hidden" name="locale" value={locale} />
          <label className="flex flex-col gap-2 text-sm">
            <span>{content.login.passwordLabel.value}</span>
            <input
              type="password"
              name="password"
              className="rounded-md border px-3 py-2"
              required
            />
          </label>
          {error ? (
            <p className="text-sm">{content.login.invalidMessage.value}</p>
          ) : null}
          <Button type="submit">{content.login.submitLabel.value}</Button>
        </form>
      )}
    </Content>
  )
}
