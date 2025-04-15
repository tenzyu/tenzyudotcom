import { ArrowLeft, ArrowRight } from 'lucide-react'
import { memo } from 'react'

import {
  SettingsCard,
  SettingsData,
  SettingsDataItem,
  SettingsGrid,
  SettingsGridItem,
  SettingsVisualization,
} from '@/components/osu/settings-card'
import { cn } from '@/lib/utils'

import type { KeyboardSettings as KeyboardSettingsType } from '@/types/osu/settings'

type KeyProps = {
  label: string
  className?: string
}

const Key = memo(function Key({ label, className }: KeyProps) {
  return (
    <div
      className={cn(
        'bg-visualization-secondary flex h-29 w-29 items-center justify-center rounded-md',
        className,
      )}
      role="img"
      aria-label={`${label} key`}
    >
      <span className="text-visualization-fg text-lg font-medium">{label}</span>
    </div>
  )
})

type StatusIndicatorProps = {
  className?: string
  color: string
  label: string
}

const StatusIndicator = memo(function StatusIndicator({
  className,
  color,
  label,
}: StatusIndicatorProps) {
  return (
    <div
      className={cn('flex items-center gap-3', className)}
      role="status"
      aria-label={label}
    >
      <div
        className={cn('h-3 w-3 rounded-full', color)}
        role="presentation"
        aria-hidden="true"
      />
      <span className="text-muted-foreground">{label}</span>
    </div>
  )
})

export const KeyboardSettings = memo(function KeyboardSettings() {
  const settings: KeyboardSettingsType = {
    name: 'SayoDevice O3C v1 (QwQ)',
    keyMapping: {
      leftKey: 'C',
      middleKey: 'Z',
      rightKey: 'X',
    },
    knobFunctions: {
      press: 'Y',
      leftRotation: '←',
      rightRotation: '→',
    },
    actuation: {
      distance: 0.15,
      rtTrigger: 0.2,
      rtRelease: 0.2,
    },
  }

  return (
    <SettingsCard title="Keyboard">
      <SettingsVisualization>
        <div
          className="bg-visualization-bg relative mx-auto aspect-[4/3] max-w-[400px] rounded-md p-4"
          role="img"
          aria-label="Keyboard visualization"
        >
          {/* Knob */}
          <div
            className="bg-visualization-secondary absolute top-[4%] left-[3%] flex h-34 w-34 items-center justify-center rounded-full"
            role="img"
            aria-label="Keyboard knob"
          >
            <div className="bg-visualization-tertiary relative flex h-20 w-20 items-center justify-center rounded-full">
              <div className="text-lg font-medium text-[var(--color-visualization-fg)]">
                {settings.knobFunctions.press}
              </div>

              <div
                className="text-visualization-fg absolute top-1/2 -left-5 -translate-y-1/2 transform"
                aria-label="Left rotation"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </div>
              <div
                className="text-visualization-fg absolute top-1/2 -right-5 -translate-y-1/2 transform"
                aria-label="Right rotation"
              >
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>
          </div>

          {/* Keys */}
          <div
            className="absolute right-0 bottom-[5%] left-0 flex justify-center gap-2"
            role="group"
            aria-label="Keyboard keys"
          >
            <Key label={settings.keyMapping.leftKey} />
            <Key label={settings.keyMapping.middleKey} />
            <Key label={settings.keyMapping.rightKey} />
          </div>
        </div>
      </SettingsVisualization>

      <SettingsData>
        <SettingsDataItem label="Name">
          <div className="text-foreground text-lg">{settings.name}</div>
        </SettingsDataItem>

        <SettingsDataItem label="Key Mapping">
          <SettingsGrid columns={3}>
            <SettingsGridItem
              label="Left Key"
              value={settings.keyMapping.leftKey}
            />
            <SettingsGridItem
              label="Middle Key"
              value={settings.keyMapping.middleKey}
            />
            <SettingsGridItem
              label="Right Key"
              value={settings.keyMapping.rightKey}
            />
          </SettingsGrid>
        </SettingsDataItem>

        <SettingsDataItem label="Knob Functions">
          <SettingsGrid columns={3}>
            <SettingsGridItem
              label="Press"
              value={settings.knobFunctions.press}
            />
            <SettingsGridItem
              label="Left Rotation"
              value={settings.knobFunctions.leftRotation}
            />
            <SettingsGridItem
              label="Right Rotation"
              value={settings.knobFunctions.rightRotation}
            />
          </SettingsGrid>
        </SettingsDataItem>

        <div className="mt-3 text-sm">
          <StatusIndicator
            color="bg-green-500"
            label={`Actuation: ${settings.actuation.distance}mm`}
          />
          <StatusIndicator
            className="mt-2"
            color="bg-blue-500"
            label={`RT trigger: ${settings.actuation.rtTrigger}mm`}
          />
          <StatusIndicator
            className="mt-2"
            color="bg-red-500"
            label={`RT release: ${settings.actuation.rtRelease}mm`}
          />
        </div>
      </SettingsData>
    </SettingsCard>
  )
})
