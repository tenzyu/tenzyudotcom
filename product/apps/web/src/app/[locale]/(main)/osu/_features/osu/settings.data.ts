import type {
  KeyboardSettings,
  MonitorSettings,
  TabletSettings,
} from './types-settings'

export const KEYPAD_SETTINGS = {
  name: 'SayoDevice O3C v1 (QwQ)',
  keyMapping: { leftKey: 'C', middleKey: 'Z', rightKey: 'X' },
  knobFunctions: { press: 'Y', leftRotation: '←', rightRotation: '→' },
  actuation: { distance: 0.15, rtTrigger: 0.2, rtRelease: 0.2 },
} satisfies KeyboardSettings

export const TABLET_SETTINGS = {
  name: 'Wacom CTL-472',
  area: { width: 58.0, height: 45.24 },
  position: { x: 83.06, y: 26.43, rotation: 180 },
} satisfies TabletSettings

export const HISTORICAL_MONITOR_SETTINGS = {
  name: 'Acer XV252Q',
  display: { size: 24.5, resolution: '1920 × 1080' },
  performance: { refreshRate: 280, responseTime: 0.5 },
} satisfies MonitorSettings

export const SETTINGS_BY_ERA = {
  until2025: {
    keyboard: KEYPAD_SETTINGS,
    tablet: TABLET_SETTINGS,
    monitor: HISTORICAL_MONITOR_SETTINGS,
  },
  from2026: {
    keyboard: KEYPAD_SETTINGS,
    tablet: TABLET_SETTINGS,
    laptop: { name: 'dynabook BJ65/FS', model: 'A6BJFSFAL511' },
  },
}

export type SettingsEra = keyof typeof SETTINGS_BY_ERA

export const DEFAULT_SETTINGS_ERA: SettingsEra = 'from2026'
