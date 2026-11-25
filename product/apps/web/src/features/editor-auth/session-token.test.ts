import { expect, test } from 'bun:test'
import { parseSession, serializeSession } from './session-token'

const key = 'fixture-signing-key-not-a-credential-0001'
const rotated = 'fixture-signing-key-not-a-credential-0002'
const payload = { sub: 'editor-admin', exp: 2000 } as const

test('session expiry, secret rotation and malformed tokens fail closed', () => {
  const token = serializeSession(payload, key)
  expect(parseSession(token, key, 1999)).toEqual(payload)
  expect(parseSession(token, key, 2000)).toBeNull()
  expect(parseSession(token, rotated, 1000)).toBeNull()
  expect(parseSession(serializeSession(payload, 'weak'), 'weak', 1000)).toBeNull()
  for (const malformed of ['', token + '.extra', token + '=', 'a'.repeat(1025), token.slice(0, -1) + (token.endsWith('a') ? 'b' : 'a')]) {
    expect(parseSession(malformed, key, 1000)).toBeNull()
  }
})
