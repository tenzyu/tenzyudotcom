import { NextResponse } from 'next/server'
import { hasEditorAdminSession } from '@/features/editor-auth/editor-session'

export async function GET() {
  const isAdmin = await hasEditorAdminSession()
  
  return NextResponse.json({ isAdmin })
}
