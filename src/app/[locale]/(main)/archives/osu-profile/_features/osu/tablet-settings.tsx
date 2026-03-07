import { useIntlayer } from 'next-intlayer/server'
import { memo } from 'react'

import type { TabletSettings as TabletSettingsType } from '../../_type/settings'

import {
  SettingsCard,
  SettingsData,
  SettingsDataItem,
  SettingsGrid,
  SettingsGridItem,
  SettingsVisualization,
} from './settings-card'

type TabletAreaProps = {
  width: number
  height: number
  x: number
  y: number
}

const TabletArea = memo(function TabletArea({
  width,
  height,
  x,
  y,
}: TabletAreaProps) {
  const settings = useIntlayer('settings')

  return (
    <div
      className="bg-visualization-bg relative mx-auto overflow-hidden rounded-md"
      style={{
        aspectRatio: '152/95',
        width: '100%',
        maxWidth: '400px',
      }}
      role="img"
      aria-label={settings.aria.tabletArea.value}
    >
      <div
        className="bg-visualization-secondary absolute inset-2 rounded-md"
        role="presentation"
        aria-hidden="true"
      >
        <div
          role="presentation"
          aria-hidden="true"
          className="bg-visualization-primary absolute rounded-sm"
          style={{
            left: `${((x - width / 2) / 152) * 100}%`,
            top: `${((y - height / 2) / 95) * 100}%`,
            width: `${(width / 152) * 100}%`,
            height: `${(height / 95) * 100}%`,
          }}
        >
          <div className="text-visualization-fg absolute top-1/2 left-1/2 z-30 -translate-x-1/2 -translate-y-1/2 transform px-2 py-0.5 text-lg">
            {width} x {height}
          </div>
        </div>
      </div>
    </div>
  )
})

export const TabletSettings = memo(function TabletSettings() {
  const settingsContent = useIntlayer('settings')
  const settings: TabletSettingsType = {
    name: 'Wacom CTL-472',
    area: {
      width: 58.0,
      height: 45.24,
    },
    position: {
      x: 83.06,
      y: 26.43,
      rotation: 180,
    },
  }

  return (
    <SettingsCard title={settingsContent.tablet.value}>
      <SettingsVisualization>
        <TabletArea
          width={settings.area.width}
          height={settings.area.height}
          x={settings.position.x}
          y={settings.position.y}
        />
      </SettingsVisualization>

      <SettingsData>
        <SettingsDataItem label={settingsContent.name.value}>
          <div className="text-foreground text-lg">{settings.name}</div>
        </SettingsDataItem>

        <SettingsDataItem label={settingsContent.area.value}>
          <SettingsGrid>
            <SettingsGridItem
              label={settingsContent.width.value}
              value={settings.area.width}
            />
            <SettingsGridItem
              label={settingsContent.height.value}
              value={settings.area.height}
            />
          </SettingsGrid>
        </SettingsDataItem>

        <SettingsDataItem label={settingsContent.position.value}>
          <SettingsGrid columns={3}>
            <SettingsGridItem
              label={settingsContent.x.value}
              value={settings.position.x}
            />
            <SettingsGridItem
              label={settingsContent.y.value}
              value={settings.position.y}
            />
            <SettingsGridItem
              label={settingsContent.rotation.value}
              value={settings.position.rotation}
            />
          </SettingsGrid>
        </SettingsDataItem>
      </SettingsData>
    </SettingsCard>
  )
})
