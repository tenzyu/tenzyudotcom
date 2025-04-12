export type BaseDeviceSettings = {
  name: string
}

export type KeyboardSettings = BaseDeviceSettings & {
  keyMapping: {
    leftKey: string
    middleKey: string
    rightKey: string
  }
  knobFunctions: {
    press: string
    leftRotation: string
    rightRotation: string
  }
  actuation: {
    distance: number
    rtTrigger: number
    rtRelease: number
  }
}

export type MonitorSettings = BaseDeviceSettings & {
  display: {
    size: number
    resolution: string
  }
  performance: {
    refreshRate: number
    responseTime: number
  }
}

export type TabletSettings = BaseDeviceSettings & {
  area: {
    width: number
    height: number
  }
  position: {
    x: number
    y: number
    rotation: number
  }
}

export type DeviceSettings = {
  keyboard: KeyboardSettings
  monitor: MonitorSettings
  tablet: TabletSettings
}
