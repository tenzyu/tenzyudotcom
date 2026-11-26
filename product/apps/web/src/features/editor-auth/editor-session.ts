import { createHmac, timingSafeEqual } from 'node:crypto'
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

function parseSession(
  token: string,
  secret: string,
): EditorSessionPayload | null {
  const [encodedPayload, signature, ...extra] = token.split('.')
  if (!encodedPayload || !signature || extra.length !== 0) {
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

    if (
      payload.sub !== 'editor-admin' ||
      !Number.isFinite(payload.exp) ||
      payload.exp <= Date.now()
    ) {
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

export async function getEditorAdminSessionExpiry() {
  try {
    const { sessionSecret } = getRequiredEditorAdminCredentials()
    if (isProduction && sessionSecret.length < 32) return null
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
