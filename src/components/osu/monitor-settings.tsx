import { memo } from 'react'

import {
  SettingsCard,
  SettingsData,
  SettingsDataItem,
  SettingsGrid,
  SettingsGridItem,
  SettingsVisualization,
} from '@/components/osu/settings-card'

export const MonitorSettings = memo(function MonitorSettings() {
  const refreshRate = 280
  const size = 24.5
  const responseTime = 0.5
  const resolution = '1980 x 1080'

  return (
    <SettingsCard title="Monitor">
      <SettingsVisualization>
        <div
          className="relative mx-auto overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800"
          style={{
            aspectRatio: '16/9',
            maxWidth: '400px',
          }}
        >
          <div className="absolute inset-2 rounded-md border-8 border-gray-700 dark:border-gray-900">
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-600">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {refreshRate}Hz
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {size}&quot;
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 left-1/2 h-4 w-16 -translate-x-1/2 translate-y-full transform bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="absolute top-3 right-3 rounded-full bg-purple-500 px-2 py-1 text-xs text-white">
            {responseTime}ms
          </div>
        </div>
      </SettingsVisualization>

      <SettingsData>
        <SettingsDataItem label="Name">
          <div className="text-lg">Acer XV252Q</div>
        </SettingsDataItem>

        <SettingsDataItem label="Display">
          <SettingsGrid>
            <SettingsGridItem label="Size" value={`${size} inches`} />
            <SettingsGridItem label="Resolution" value={resolution} />
          </SettingsGrid>
        </SettingsDataItem>

        <SettingsDataItem label="Performance">
          <SettingsGrid>
            <SettingsGridItem label="Refresh Rate" value={`${refreshRate}Hz`} />
            <SettingsGridItem
              label="Response Time"
              value={`${responseTime}ms`}
            />
          </SettingsGrid>
        </SettingsDataItem>
      </SettingsData>
    </SettingsCard>
  )
})
