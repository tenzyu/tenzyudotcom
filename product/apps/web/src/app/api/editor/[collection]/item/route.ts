import { Payload } from './item-command.validation'
import { refreshLinksAfterSave } from '@/features/links/links-cache'
import { NextResponse } from 'next/server'
import { NoteCommand } from '@/features/notes/note-command.validation'
import {
  loadNoteEditView,
  runNoteCommand,
} from '@/features/notes/note-command.assemble'
import {
  getEditorAdminSessionExpiry,
  isSameOriginEditorRequest,
} from '@/features/editor-auth/editor-session'
import {
  loadLinkEditView,
  runLinkCommand,
} from '@/features/links/link-command.assemble'
import {
  InvalidItemCommand,
  type ItemCommandResult,
} from '@/platform/content-store/json-item-command.validation'

type Context = { params: Promise<{ collection: string }> }

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store' },
  })
}

export async function GET(request: Request, { params }: Context) {
  if (!(await getEditorAdminSessionExpiry()))
    return json({ kind: 'denied' }, 401)
  const { collection } = await params
  const query = new URL(request.url).searchParams
  try {
    if (collection === 'notes')
      return json(
        await loadNoteEditView(query.get('id'), query.get('locale') ?? 'ja'),
      )
    if (collection === 'links')
      return json(await loadLinkEditView(query.get('id')))
    return json({ kind: 'invalid', message: 'Unknown collection.' }, 404)
  } catch (error) {
    if (error instanceof InvalidItemCommand)
      return json({ kind: 'invalid', message: error.message }, 404)
    console.error('Unable to load item editor', error)
    return json({ kind: 'unavailable' }, 503)
  }
}

export async function POST(request: Request, { params }: Context) {
  if (!request.headers.has('origin') || !isSameOriginEditorRequest(request))
    return json({ kind: 'denied' }, 403)
  if (!(await getEditorAdminSessionExpiry()))
    return json({ kind: 'denied' }, 401)
  const { collection } = await params
  if (collection !== 'notes' && collection !== 'links')
    return json({ kind: 'invalid', message: 'Unknown collection.' }, 404)

  const parsed = Payload.safeParse(await request.json().catch(() => null))
  if (!parsed.success)
    return json({ kind: 'invalid', message: 'Invalid command version.' }, 400)
  const { base, operation, command } = parsed.data
  try {
    let result: ItemCommandResult
    if (collection === 'notes') {
      const note = NoteCommand.safeParse(command)
      if (!note.success)
        return json({ kind: 'invalid', message: 'Check the note fields.' }, 400)
      result = await runNoteCommand(base, operation, note.data)
    } else {
      result = await runLinkCommand(base, operation, command)
    }
    if (collection === 'links' && result.kind === 'saved') {
      try {
        refreshLinksAfterSave()
      } catch (error) {
        console.error('Unable to refresh links after a confirmed save', error)
      }
    }
    return json(result, result.kind === 'conflict' ? 409 : 200)
  } catch (error) {
    if (error instanceof InvalidItemCommand)
      return json({ kind: 'invalid', message: error.message }, 400)
    console.error('Unable to process item command', error)
    return json({ kind: 'unavailable' }, 503)
  }
}
