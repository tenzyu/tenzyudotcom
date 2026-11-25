import { timingSafeEqual } from 'node:crypto'
import { parseSession, serializeSession, type EditorSessionPayload } from './session-token'
import { getLocalizedUrl } from 'intlayer'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createLoginRateLimiter } from './login-rate-limit'
import {
  env,
  getRequiredEditorAdminCredentials,
  isProduction,
} from '@/config/env.infra'

const EDITOR_SESSION_COOKIE = 'editor_admin_session'
const EDITOR_SESSION_TTL_SECONDS = 60 * 60 * 24 * 14
const LOGIN_RATE_LIMIT_WINDOW_MS = 60 * 1000
const LOGIN_RATE_LIMIT_MAX_ATTEMPTS = 5

const loginAttempts = createLoginRateLimiter({
  windowMs: LOGIN_RATE_LIMIT_WINDOW_MS,
  maxAttempts: LOGIN_RATE_LIMIT_MAX_ATTEMPTS,
  maxClients: 1,
})
let warnedWeakSessionSecret = false

function warnWeakSessionSecret(sessionSecret: string) {
  if (sessionSecret.length >= 32 || isProduction || warnedWeakSessionSecret) {
    return
  }

  warnedWeakSessionSecret = true
  console.warn(
    'EDITOR_SESSION_SECRET should be at least 32 characters before production.',
  )
}

// A client-supplied Host or forwarded header is not an authorization authority.
// Production defaults to the configured canonical site, not the request host.
function assertSameOrigin(headerStore: Headers) {
  const origin = headerStore.get('origin')
  if (!origin) throw new Error('Missing Origin header for editor mutation.')
  const configured = env.editorAllowedOrigin ?? (isProduction ? env.siteUrl : undefined)
  if (configured) {
    const expected = new URL(configured).origin
    if (origin === expected) return
  } else {
    const host = headerStore.get('host')
    const parsed = new URL(origin)
    if (parsed.protocol === 'http:' &&
        ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname) &&
        parsed.host === host && origin === parsed.origin) return
  }
  throw new Error('Editor mutation rejected: origin is not authorized.')
}

export async function createEditorAdminSession() {
  const { sessionSecret } = getRequiredEditorAdminCredentials()
  warnWeakSessionSecret(sessionSecret)

  if (sessionSecret.length < 32) {
    throw new Error(
      'EDITOR_SESSION_SECRET must be at least 32 characters .',
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

export async function getEditorAdminSessionExpiry() {
  try {
    const { sessionSecret } = getRequiredEditorAdminCredentials()
    if (sessionSecret.length < 32) return null
    const cookieStore = await cookies()
    const token = cookieStore.get(EDITOR_SESSION_COOKIE)?.value

    if (!token) {
      return null
    }

    return parseSession(token, sessionSecret)?.exp ?? null
  } catch {
    return null
  }
}

export async function hasEditorAdminSession() {
  return (await getEditorAdminSessionExpiry()) !== null
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
  // Without a verified ingress identity, use one bounded per-process budget.
  return loginAttempts.consume('editor-login', Date.now())
}

export async function clearEditorLoginRateLimit() {
  loginAttempts.clear('editor-login')
}
