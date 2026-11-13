import { expect, test } from 'bun:test'
import { getDictionary } from 'intlayer'
import pageContent from './page.content'
import settingsContent from './_features/osu/settings.content'

test('Japanese metadata describes the live osu page and its settings', () => {
  const content = getDictionary(pageContent, 'ja')
  expect(String(content.metadata.title)).toBe('osu! | 天珠')
  expect(String(content.metadata.description)).toBe(
    '天珠のosu!プロフィール、ベストスコア、プレイ動画、年代別のデバイス設定。'
  )
  expect(content.sections).not.toHaveProperty('yearlyGoals')
})

test('English metadata describes the live osu page and its settings', () => {
  const content = getDictionary(pageContent, 'en')
  expect(String(content.metadata.title)).toBe('osu! | Tenzyu')
  expect(String(content.metadata.description)).toBe(
    "Tenzyu's osu! profile, best scores, gameplay videos, and device settings by era."
  )
  expect(content.sections).not.toHaveProperty('yearlyGoals')
})

test('era tabs have Japanese and English labels', () => {
  const ja = getDictionary(settingsContent, 'ja')
  const en = getDictionary(settingsContent, 'en')
  expect(String(ja.until2025)).toBe('2025年まで')
  expect(String(ja.from2026)).toBe('2026年から')
  expect(String(en.until2025)).toBe('Until 2025')
  expect(String(en.from2026)).toBe('From 2026')
})
