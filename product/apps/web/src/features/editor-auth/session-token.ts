import { createHmac, timingSafeEqual } from 'node:crypto'

export type EditorSessionPayload = {
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

export function serializeSession(payload: EditorSessionPayload, secret: string) {
  const encodedPayload = encodeBase64Url(JSON.stringify(payload))
  const signature = signToken(encodedPayload, secret)
  return `${encodedPayload}.${signature}`
}

export function parseSession(
  token: string,
  secret: string,
  now: number = Date.now(),
): EditorSessionPayload | null {
  if (token.length > 1024 || secret.length < 32) return null
  const [encodedPayload, signature, ...extra] = token.split('.')
  if (!encodedPayload || !signature || extra.length !== 0 || !/^[A-Za-z0-9_-]+$/.test(encodedPayload)) {
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
      !Number.isSafeInteger(payload.exp) ||
      payload.exp <= now
    ) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

