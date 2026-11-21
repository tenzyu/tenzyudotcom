import { NextResponse } from 'next/server'
import { getEditorAdminSessionExpiry } from '@/features/editor-auth/editor-session'

export async function GET() {
  const expiresAt = await getEditorAdminSessionExpiry()
  return NextResponse.json(
    { isAdmin: expiresAt !== null, expiresAt },
    {
      headers: { 'Cache-Control': 'private, no-store' },
    },
  )
}
