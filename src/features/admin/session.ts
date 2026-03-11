import { createHmac, timingSafeEqual } from 'node:crypto'
import { getLocalizedUrl } from 'intlayer'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  getRequiredEditorAdminCredentials,
  isProduction,
} from '@/config/env.contract'

const EDITOR_SESSION_COOKIE = 'editor_admin_session'
const EDITOR_SESSION_TTL_SECONDS = 60 * 60 * 24 * 14

type EditorSessionPayload = {
  sub: 'editor-admin'
  exp: number
}

function encodeBase64Url(value: string) {
  return Buffer.from(value).toString('base64url')
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8')
}

function signToken(payload: string, secret: string) {
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

function serializeSession(payload: EditorSessionPayload, secret: string) {
  const encodedPayload = encodeBase64Url(JSON.stringify(payload))
  const signature = signToken(encodedPayload, secret)
  return `${encodedPayload}.${signature}`
}

function parseSession(
  token: string,
  secret: string,
): EditorSessionPayload | null {
  const [encodedPayload, signature] = token.split('.')
  if (!encodedPayload || !signature) {
    return null
  }

  const expectedSignature = signToken(encodedPayload, secret)
  const signatureBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expectedSignature)

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null
  }

  try {
    const payload = JSON.parse(
      decodeBase64Url(encodedPayload),
    ) as EditorSessionPayload

    if (payload.sub !== 'editor-admin' || payload.exp <= Date.now()) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

export async function createEditorAdminSession() {
  const { sessionSecret } = getRequiredEditorAdminCredentials()

  if (sessionSecret.length < 32 && isProduction) {
    throw new Error(
      'EDITOR_SESSION_SECRET must be at least 32 characters in production.',
    )
  }

  const payload: EditorSessionPayload = {
    sub: 'editor-admin',
    exp: Date.now() + EDITOR_SESSION_TTL_SECONDS * 1000,
  }
  const cookieStore = await cookies()

  cookieStore.set(
    EDITOR_SESSION_COOKIE,
    serializeSession(payload, sessionSecret),
    {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
      path: '/',
      maxAge: EDITOR_SESSION_TTL_SECONDS,
      priority: 'high',
    },
  )
}

export async function clearEditorAdminSession() {
  const cookieStore = await cookies()
  cookieStore.delete(EDITOR_SESSION_COOKIE)
}

export async function hasEditorAdminSession() {
  try {
    const { sessionSecret } = getRequiredEditorAdminCredentials()
    const cookieStore = await cookies()
    const token = cookieStore.get(EDITOR_SESSION_COOKIE)?.value

    if (!token) {
      return false
    }

    return parseSession(token, sessionSecret) !== null
  } catch {
    return false
  }
}

export function isValidEditorAdminPassword(input: string, expected: string) {
  const inputBuffer = Buffer.from(input)
  const expectedBuffer = Buffer.from(expected)

  if (inputBuffer.length !== expectedBuffer.length) {
    return false
  }

  return timingSafeEqual(inputBuffer, expectedBuffer)
}

export function verifyEditorAdminPassword(input: string) {
  try {
    const { password } = getRequiredEditorAdminCredentials()
    return isValidEditorAdminPassword(input, password)
  } catch {
    return false
  }
}

export async function requireEditorAdminSession(locale: string) {
  if (!(await hasEditorAdminSession())) {
    redirect(getLocalizedUrl('/editor/login', locale))
  }
}
