import { type NextRequest, NextResponse } from 'next/server'
import { hasEditorAdminSession } from '@/features/admin/session'
import { makeLoadEditorCollectionUseCase } from '@/app/[locale]/(admin)/editor/_features/editor.assemble'
import type { EditorCollectionId } from '@/lib/editor/editor.port'

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
