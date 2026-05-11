import { createHmac, timingSafeEqual } from 'node:crypto'
import { getLocalizedUrl } from 'intlayer'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  getRequiredEditorAdminCredentials,
  isProduction,
} from '@/config/env.infra'

const EDITOR_SESSION_COOKIE = 'editor_admin_session'
const EDITOR_SESSION_TTL_SECONDS = 60 * 60 * 24 * 14
const LOGIN_RATE_LIMIT_WINDOW_MS = 60 * 1000
const LOGIN_RATE_LIMIT_MAX_ATTEMPTS = 5

const loginAttempts = new Map<string, { count: number; resetAt: number }>()
let warnedWeakSessionSecret = false

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

function warnWeakSessionSecret(sessionSecret: string) {
  if (sessionSecret.length >= 32 || isProduction || warnedWeakSessionSecret) {
    return
  }

  warnedWeakSessionSecret = true
  console.warn(
    'EDITOR_SESSION_SECRET should be at least 32 characters before production.',
  )
}

function expectedOriginFromHeaders(headerStore: Headers) {
  const host =
    headerStore.get('x-forwarded-host') ??
    headerStore.get('host')
  if (!host) return null

  const protocol =
    headerStore.get('x-forwarded-proto') ??
    (isProduction ? 'https' : 'http')

  return `${protocol}://${host}`
}

function assertSameOrigin(headerStore: Headers) {
  const origin = headerStore.get('origin')
  const expectedOrigin = expectedOriginFromHeaders(headerStore)

  if (!origin || !expectedOrigin) {
    if (isProduction) {
      throw new Error('Missing Origin or Host header for editor mutation.')
    }
    return
  }

  if (origin !== expectedOrigin) {
    throw new Error('Editor mutation rejected because Origin does not match Host.')
  }
}

function getClientKey(headerStore: Headers) {
  return (
    headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headerStore.get('x-real-ip') ??
    'local'
  )
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
  warnWeakSessionSecret(sessionSecret)

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

function isValidEditorAdminPassword(input: string, expected: string) {
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

export async function requireEditorSameOriginRequest() {
  const headerStore = await headers()
  assertSameOrigin(headerStore)
}

export function isSameOriginEditorRequest(request: Request) {
  try {
    assertSameOrigin(request.headers)
    return true
  } catch {
    return false
  }
}

export async function checkEditorLoginRateLimit() {
  const headerStore = await headers()
  const key = getClientKey(headerStore)
  const now = Date.now()
  const current = loginAttempts.get(key)

  if (!current || current.resetAt <= now) {
    loginAttempts.set(key, {
      count: 1,
      resetAt: now + LOGIN_RATE_LIMIT_WINDOW_MS,
    })
    return true
  }

  current.count += 1

  return current.count <= LOGIN_RATE_LIMIT_MAX_ATTEMPTS
}

export async function clearEditorLoginRateLimit() {
  const headerStore = await headers()
  loginAttempts.delete(getClientKey(headerStore))
}
