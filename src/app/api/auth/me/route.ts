import { NextResponse } from 'next/server'
import { hasEditorAdminSession } from '@/app/[locale]/(admin)/editor/_features/session'

export async function GET() {
  const isAdmin = await hasEditorAdminSession()
  
  return NextResponse.json({ isAdmin })
}
