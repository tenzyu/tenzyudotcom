import { describe, expect, test } from 'bun:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { SettingsEraTabs } from './settings-era-tabs'
import { DEFAULT_SETTINGS_ERA, SETTINGS_BY_ERA } from './settings.data'

describe('osu settings eras', () => {
  test('opens the actual UI Tabs on from2026 with the historical panel hidden', () => {
    const html = renderToStaticMarkup(
      <SettingsEraTabs
        label="Settings era"
        until2025Label="Until 2025"
        from2026Label="From 2026"
        until2025={<p>Acer XV252Q</p>}
        from2026={<p>dynabook BJ65/FS A6BJFSFAL511</p>}
      />,
    )

    expect(DEFAULT_SETTINGS_ERA).toBe('from2026')
    expect(html).toMatch(
      /<button[^>]*aria-selected="true"[^>]*>From 2026<\/button>/,
    )
    expect(html).toMatch(
      /<button[^>]*aria-selected="false"[^>]*>Until 2025<\/button>/,
    )
    expect(html).toContain('dynabook BJ65/FS A6BJFSFAL511')
    expect(html).not.toContain('Acer XV252Q')
  })

  for (const era of ['until2025', 'from2026'] satisfies Array<
    keyof typeof SETTINGS_BY_ERA
  >) {
    test(`${era} retains the exact keypad mapping, knob and actuation`, () => {
      expect(SETTINGS_BY_ERA[era].keyboard).toEqual({
        name: 'SayoDevice O3C v1 (QwQ)',
        keyMapping: { leftKey: 'C', middleKey: 'Z', rightKey: 'X' },
        knobFunctions: { press: 'Y', leftRotation: '←', rightRotation: '→' },
        actuation: { distance: 0.15, rtTrigger: 0.2, rtRelease: 0.2 },
      })
    })
  }

  test('keeps historical tablet settings and uses the new position and firmware in 2026', () => {
    expect(SETTINGS_BY_ERA.until2025.tablet.position).toEqual({
      x: 83.06,
      y: 26.43,
      rotation: 180,
    })
    expect(SETTINGS_BY_ERA.from2026.tablet.position).toEqual({
      x: 127,
      y: 22,
      rotation: 180,
    })
    expect(SETTINGS_BY_ERA.from2026.tablet.pollingRate).toBe(400)
  })

  test('the current computer contains only the supplied laptop identity', () => {
    expect(SETTINGS_BY_ERA.from2026.laptop).toEqual({
      name: 'dynabook BJ65/FS',
      model: 'A6BJFSFAL511',
    })
    expect(SETTINGS_BY_ERA.from2026).not.toHaveProperty('monitor')
  })

  test('the old monitor specifications belong only to the historical era', () => {
    expect(SETTINGS_BY_ERA.until2025.monitor).toEqual({
      name: 'Acer XV252Q',
      display: { size: 24.5, resolution: '1920 × 1080' },
      performance: { refreshRate: 280, responseTime: 0.5 },
    })
    expect(SETTINGS_BY_ERA.until2025).not.toHaveProperty('laptop')
  })
})
