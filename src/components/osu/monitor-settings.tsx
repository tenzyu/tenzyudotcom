import { memo } from 'react'

import {
  SettingsCard,
  SettingsData,
  SettingsDataItem,
  SettingsGrid,
  SettingsGridItem,
  SettingsVisualization,
} from '@/components/osu/settings-card'

import type { MonitorSettings as MonitorSettingsType } from '@/types/osu/settings'

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
  return (
    <div
      className="bg-visualization-bg relative mx-auto overflow-hidden rounded-md"
      style={{
        aspectRatio: '16/9',
        maxWidth: '400px',
      }}
      role="img"
      aria-label="Monitor display visualization"
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
            <div
              className="text-visualization-primary text-2xl font-bold"
              aria-label={`Refresh rate: ${refreshRate}Hz`}
            >
              {refreshRate}Hz
            </div>
            <div
              className="text-visualization-fg text-sm"
              aria-label={`Screen size: ${size} inches`}
            >
              {size}&quot;
            </div>
          </div>
        </div>
        <div
          className="bg-visualization-tertiary absolute bottom-0 left-1/2 h-4 w-16 -translate-x-1/2 translate-y-full transform"
          role="presentation"
          aria-hidden="true"
        />
      </div>
      <div
        className="bg-visualization-accent text-visualization-fg absolute top-3 right-3 rounded-full px-2 py-1 text-xs"
        aria-label={`Response time: ${responseTime}ms`}
      >
        {responseTime}ms
      </div>
    </div>
  )
})

export const MonitorSettings = memo(function MonitorSettings() {
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
    <SettingsCard title="Monitor">
      <SettingsVisualization>
        <MonitorDisplay
          refreshRate={settings.performance.refreshRate}
          size={settings.display.size}
          responseTime={settings.performance.responseTime}
        />
      </SettingsVisualization>

      <SettingsData>
        <SettingsDataItem label="Name">
          <div className="text-foreground text-lg">{settings.name}</div>
        </SettingsDataItem>

        <SettingsDataItem label="Display">
          <SettingsGrid>
            <SettingsGridItem
              label="Size"
              value={`${settings.display.size} inches`}
            />
            <SettingsGridItem
              label="Resolution"
              value={settings.display.resolution}
            />
          </SettingsGrid>
        </SettingsDataItem>

        <SettingsDataItem label="Performance">
          <SettingsGrid>
            <SettingsGridItem
              label="Refresh Rate"
              value={`${settings.performance.refreshRate}Hz`}
            />
            <SettingsGridItem
              label="Response Time"
              value={`${settings.performance.responseTime}ms`}
            />
          </SettingsGrid>
        </SettingsDataItem>
      </SettingsData>
    </SettingsCard>
  )
})
