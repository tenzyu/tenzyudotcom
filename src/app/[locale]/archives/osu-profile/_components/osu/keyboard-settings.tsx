import { ArrowLeft, ArrowRight } from 'lucide-react'
import { memo } from 'react'
import { useIntlayer } from 'next-intlayer/server'

import { cn } from '@/lib/utils'

import type { KeyboardSettings as KeyboardSettingsType } from '@/app/[locale]/archives/osu-profile/_type/settings'

import {
  SettingsCard,
  SettingsData,
  SettingsDataItem,
  SettingsGrid,
  SettingsGridItem,
  SettingsVisualization,
} from './settings-card'

type KeyProps = {
  label: string
  className?: string
}

const Key = memo(function Key({ label, className }: KeyProps) {
  const settings = useIntlayer('settings')

  return (
    <div
      className={cn(
        'bg-visualization-secondary flex h-29 w-29 items-center justify-center rounded-md',
        className,
      )}
      role="img"
      aria-label={`${label} ${settings.aria.keySuffix.value}`}
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
  const settingsContent = useIntlayer('settings')
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
    <SettingsCard title={settingsContent.keyboard.value}>
      <SettingsVisualization>
        <div
          className="bg-visualization-bg relative mx-auto aspect-4/3 max-w-[400px] rounded-md p-4"
          role="img"
          aria-label={settingsContent.aria.keyboardVisualization.value}
        >
          {/* Knob */}
          <div
            className="bg-visualization-secondary absolute top-[4%] left-[3%] flex h-34 w-34 items-center justify-center rounded-full"
            role="img"
            aria-label={settingsContent.aria.keyboardKnob.value}
          >
            <div className="bg-visualization-tertiary relative flex h-20 w-20 items-center justify-center rounded-full">
              <div className="text-visualization-fg text-lg font-medium">
                {settings.knobFunctions.press}
              </div>

              <div
                className="text-visualization-fg absolute top-1/2 -left-5 -translate-y-1/2 transform"
                aria-label={settingsContent.aria.leftRotation.value}
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </div>
              <div
                className="text-visualization-fg absolute top-1/2 -right-5 -translate-y-1/2 transform"
                aria-label={settingsContent.aria.rightRotation.value}
              >
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>
          </div>

          {/* Keys */}
          <div
            className="absolute right-0 bottom-[5%] left-0 flex justify-center gap-2"
            role="group"
            aria-label={settingsContent.aria.keyboardKeys.value}
          >
            <Key label={settings.keyMapping.leftKey} />
            <Key label={settings.keyMapping.middleKey} />
            <Key label={settings.keyMapping.rightKey} />
          </div>
        </div>
      </SettingsVisualization>

      <SettingsData>
        <SettingsDataItem label={settingsContent.name.value}>
          <div className="text-foreground text-lg">{settings.name}</div>
        </SettingsDataItem>

        <SettingsDataItem label={settingsContent.keyMapping.value}>
          <SettingsGrid columns={3}>
            <SettingsGridItem
              label={settingsContent.leftKey.value}
              value={settings.keyMapping.leftKey}
            />
            <SettingsGridItem
              label={settingsContent.middleKey.value}
              value={settings.keyMapping.middleKey}
            />
            <SettingsGridItem
              label={settingsContent.rightKey.value}
              value={settings.keyMapping.rightKey}
            />
          </SettingsGrid>
        </SettingsDataItem>

        <SettingsDataItem label={settingsContent.knobFunctions.value}>
          <SettingsGrid columns={3}>
            <SettingsGridItem
              label={settingsContent.press.value}
              value={settings.knobFunctions.press}
            />
            <SettingsGridItem
              label={settingsContent.leftRotation.value}
              value={settings.knobFunctions.leftRotation}
            />
            <SettingsGridItem
              label={settingsContent.rightRotation.value}
              value={settings.knobFunctions.rightRotation}
            />
          </SettingsGrid>
        </SettingsDataItem>

        <div className="mt-3 text-sm">
          <StatusIndicator
            color="bg-green-500"
            label={`${settingsContent.actuation.value}: ${settings.actuation.distance}mm`}
          />
          <StatusIndicator
            className="mt-2"
            color="bg-blue-500"
            label={`${settingsContent.rtTrigger.value}: ${settings.actuation.rtTrigger}mm`}
          />
          <StatusIndicator
            className="mt-2"
            color="bg-red-500"
            label={`${settingsContent.rtRelease.value}: ${settings.actuation.rtRelease}mm`}
          />
        </div>
      </SettingsData>
    </SettingsCard>
  )
})
