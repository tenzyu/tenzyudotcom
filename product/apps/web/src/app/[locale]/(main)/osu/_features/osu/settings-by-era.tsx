import { useIntlayer } from 'next-intlayer/server'
import { Content } from '@/components/site/content'
import { KeyboardSettings } from './keyboard-settings'
import { MonitorSettings } from './monitor-settings'
import { SettingsCard, SettingsData, SettingsDataItem } from './settings-card'
import { SettingsEraTabs } from './settings-era-tabs'
import { SETTINGS_BY_ERA } from './settings.data'
import { TabletSettings } from './tablet-settings'

export function SettingsByEra() {
  const content = useIntlayer('settings')
  const { laptop } = SETTINGS_BY_ERA.from2026

  return (
    <Content size="2xl">
      <SettingsEraTabs
        label={content.era.value}
        until2025Label={content.until2025.value}
        from2026Label={content.from2026.value}
        until2025={
          <>
            <p className="text-muted-foreground">
              {content.historicalNote.value}
            </p>
            <TabletSettings />
            <KeyboardSettings />
            <MonitorSettings />
          </>
        }
        from2026={
          <>
            <SettingsCard title={content.laptop.value}>
              <SettingsData>
                <SettingsDataItem label={content.name.value}>
                  {laptop.name}
                </SettingsDataItem>
                <SettingsDataItem label={content.model.value}>
                  {laptop.model}
                </SettingsDataItem>
                <p className="text-muted-foreground">
                  {content.laptopNote.value}
                </p>
              </SettingsData>
            </SettingsCard>
            <TabletSettings />
            <KeyboardSettings />
          </>
        }
      />
    </Content>
  )
}
