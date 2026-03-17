import { useIntlayer } from 'next-intlayer/server'
import { memo } from 'react'
import {
  SettingsCard,
  SettingsData,
  SettingsDataItem,
  SettingsGrid,
  SettingsGridItem,
  SettingsVisualization,
} from './settings-card'
import type { MonitorSettings as MonitorSettingsType } from './types-settings'

type MonitorDisplayProps = {
  refreshRate: number
  size: number
  responseTime: number
}

const MonitorDisplay = memo(function MonitorDisplay({
  refreshRate,
  size,
  responseTime,
}: MonitorDisplayProps) {
  const settingsContent = useIntlayer('settings')

  return (
    <div
      className="bg-visualization-bg relative mx-auto overflow-hidden rounded-md"
      style={{
        aspectRatio: '16/9',
        maxWidth: '400px',
      }}
      role="img"
      aria-label={settingsContent.aria.monitorDisplay.value}
    >
      <div
        className="border-visualization-secondary absolute inset-2 rounded-md border-8"
        role="presentation"
        aria-hidden="true"
      >
        <div
          className="bg-visualization-tertiary absolute inset-0 flex items-center justify-center"
          role="presentation"
          aria-hidden="true"
        >
          <div className="text-center">
            <div className="text-visualization-primary text-2xl font-bold">
              <span className="sr-only">
                {settingsContent.aria.refreshRate.value}: {refreshRate}Hz
              </span>
              <span aria-hidden="true">{refreshRate}Hz</span>
            </div>
            <div className="text-visualization-fg text-sm">
              <span className="sr-only">
                {settingsContent.aria.screenSize.value}: {size}{' '}
                {settingsContent.units.inches.value}
              </span>
              <span aria-hidden="true">{size}&quot;</span>
            </div>
          </div>
        </div>
        <div
          className="bg-visualization-tertiary absolute bottom-0 left-1/2 h-4 w-16 -translate-x-1/2 translate-y-full transform"
          role="presentation"
          aria-hidden="true"
        />
      </div>
      <div className="bg-visualization-accent text-visualization-fg absolute top-3 right-3 rounded-full px-2 py-1 text-xs">
        <span className="sr-only">
          {settingsContent.aria.responseTime.value}: {responseTime}ms
        </span>
        <span aria-hidden="true">{responseTime}ms</span>
      </div>
    </div>
  )
})

export const MonitorSettings = memo(function MonitorSettings() {
  const settingsContent = useIntlayer('settings')
  const settings: MonitorSettingsType = {
    name: 'Acer XV252Q',
    display: {
      size: 24.5,
      resolution: '1920 × 1080',
    },
    performance: {
      refreshRate: 280,
      responseTime: 0.5,
    },
  }

  return (
    <SettingsCard title={settingsContent.monitor.value}>
      <SettingsVisualization>
        <MonitorDisplay
          refreshRate={settings.performance.refreshRate}
          size={settings.display.size}
          responseTime={settings.performance.responseTime}
        />
      </SettingsVisualization>

      <SettingsData>
        <SettingsDataItem label={settingsContent.name.value}>
          <div className="text-foreground text-lg">{settings.name}</div>
        </SettingsDataItem>

        <SettingsDataItem label={settingsContent.display.value}>
          <SettingsGrid>
            <SettingsGridItem
              label={settingsContent.size.value}
              value={`${settings.display.size} ${settingsContent.units.inches.value}`}
            />
            <SettingsGridItem
              label={settingsContent.resolution.value}
              value={settings.display.resolution}
            />
          </SettingsGrid>
        </SettingsDataItem>

        <SettingsDataItem label={settingsContent.performance.value}>
          <SettingsGrid>
            <SettingsGridItem
              label={settingsContent.refreshRate.value}
              value={`${settings.performance.refreshRate}Hz`}
            />
            <SettingsGridItem
              label={settingsContent.responseTime.value}
              value={`${settings.performance.responseTime}ms`}
            />
          </SettingsGrid>
        </SettingsDataItem>
      </SettingsData>
    </SettingsCard>
  )
})
