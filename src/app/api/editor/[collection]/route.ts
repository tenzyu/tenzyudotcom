import { type NextRequest, NextResponse } from 'next/server'
import { hasEditorAdminSession } from '@/app/[locale]/(admin)/editor/_features/editor-session'
import {
  makeLoadEditorCollectionUseCase,
  makeSaveEditorCollectionUseCase,
} from '@/app/[locale]/(admin)/editor/_features/editor.assemble'
import {
  EditorVersionConflictError,
  type EditorCollectionId,
} from '@/lib/editor/editor.domain'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ collection: string }> }
) {
  const isAdmin = await hasEditorAdminSession()
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { collection } = await params
  
  try {
    const loadUseCase = makeLoadEditorCollectionUseCase()
    const state = await loadUseCase.execute(collection as EditorCollectionId)
    return NextResponse.json(state)
  } catch (error) {
    console.error('Failed to load collection:', error)
    return NextResponse.json({ error: 'Failed to load collection' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ collection: string }> }
) {
  const isAdmin = await hasEditorAdminSession()
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { collection } = await params

  try {
    const body = (await request.json()) as {
      sourceJson?: string
      expectedVersion?: string
    }

    if (typeof body.sourceJson !== 'string' || body.sourceJson.trim().length < 2) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const saveUseCase = makeSaveEditorCollectionUseCase()
    const result = await saveUseCase.execute(
      collection as EditorCollectionId,
      body.sourceJson,
      body.expectedVersion,
    )

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof EditorVersionConflictError) {
      return NextResponse.json({ error: 'conflict' }, { status: 409 })
    }

    console.error('Failed to save collection:', error)
    return NextResponse.json({ error: 'Failed to save collection' }, { status: 500 })
  }
}
