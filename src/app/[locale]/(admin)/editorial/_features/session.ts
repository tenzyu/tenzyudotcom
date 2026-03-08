import { createHmac, timingSafeEqual } from 'node:crypto'
import { getLocalizedUrl } from 'intlayer'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  getRequiredEditorialAdminCredentials,
  isProduction,
} from '@/config/env.contract'

const EDITORIAL_SESSION_COOKIE = 'editorial_admin_session'
const EDITORIAL_SESSION_TTL_SECONDS = 60 * 60 * 24 * 14

type EditorialSessionPayload = {
  sub: 'editorial-admin'
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

function serializeSession(payload: EditorialSessionPayload, secret: string) {
  const encodedPayload = encodeBase64Url(JSON.stringify(payload))
  const signature = signToken(encodedPayload, secret)
  return `${encodedPayload}.${signature}`
}

function parseSession(
  token: string,
  secret: string,
): EditorialSessionPayload | null {
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
    ) as EditorialSessionPayload

    if (payload.sub !== 'editorial-admin' || payload.exp <= Date.now()) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

export async function createEditorialAdminSession() {
  const { sessionSecret } = getRequiredEditorialAdminCredentials()
  const payload: EditorialSessionPayload = {
    sub: 'editorial-admin',
    exp: Date.now() + EDITORIAL_SESSION_TTL_SECONDS * 1000,
  }
  const cookieStore = await cookies()

  cookieStore.set(
    EDITORIAL_SESSION_COOKIE,
    serializeSession(payload, sessionSecret),
    {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
      path: '/',
      maxAge: EDITORIAL_SESSION_TTL_SECONDS,
    },
  )
}

export async function clearEditorialAdminSession() {
  const cookieStore = await cookies()
  cookieStore.delete(EDITORIAL_SESSION_COOKIE)
}

export async function hasEditorialAdminSession() {
  try {
    const { sessionSecret } = getRequiredEditorialAdminCredentials()
    const cookieStore = await cookies()
    const token = cookieStore.get(EDITORIAL_SESSION_COOKIE)?.value

    if (!token) {
      return false
    }

    return parseSession(token, sessionSecret) !== null
  } catch {
    return false
  }
}

export function isValidEditorialAdminPassword(input: string, expected: string) {
  const inputBuffer = Buffer.from(input)
  const expectedBuffer = Buffer.from(expected)

  if (inputBuffer.length !== expectedBuffer.length) {
    return false
  }

  return timingSafeEqual(inputBuffer, expectedBuffer)
}

export async function requireEditorialAdminSession(locale: string) {
  if (!(await hasEditorialAdminSession())) {
    redirect(getLocalizedUrl('/editorial/login', locale))
  }
}
