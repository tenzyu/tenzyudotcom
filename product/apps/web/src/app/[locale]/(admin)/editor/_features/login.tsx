import { useIntlayer } from 'next-intlayer/server'
import { ReadingColumn, PageIntro, EditorPanel } from '@tenzyu/ui/editorial'
import { Input } from '@tenzyu/ui/input'
import { Button } from '@tenzyu/ui/button'
import { EDITOR_ADMIN_LOCALE } from './editor-admin.constants'
import { loginEditorAdminAction } from './actions'
import { isEditorLoginConfigured } from './editor-config.assemble'

export function EditorLogin({
  locale,
  error,
}: {
  locale: string
  error?: string
}) {
  const content = useIntlayer('editorAdmin', EDITOR_ADMIN_LOCALE)
  const isConfigured = isEditorLoginConfigured()

  return (
    <ReadingColumn className="space-y-8">
      <PageIntro
        eyebrow="Private workspace"
        title={content.login.title.value}
        description={content.login.description.value}
      />
      {!isConfigured ? (
        <p className="text-sm">{content.login.missingMessage.value}</p>
      ) : (
        <EditorPanel>
          <form action={loginEditorAdminAction} className="space-y-4">
            <input type="hidden" name="locale" value={locale} />
            <label
              htmlFor="editor-password"
              className="flex flex-col gap-2 text-sm"
            >
              <span>{content.login.passwordLabel.value}</span>
              <Input
                id="editor-password"
                type="password"
                name="password"
                autoComplete="current-password"
                required
              />
            </label>
            {error ? (
              <p className="text-sm">{content.login.invalidMessage.value}</p>
            ) : null}
            <Button type="submit">{content.login.submitLabel.value}</Button>
          </form>
        </EditorPanel>
      )}
    </ReadingColumn>
  )
}
