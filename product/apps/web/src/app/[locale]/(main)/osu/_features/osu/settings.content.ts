import { type Dictionary, t } from 'intlayer'

const settingsContent = {
  key: 'settings',
  content: {
    era: t({ ja: '設定の年代', en: 'Settings era' }),
    until2025: t({ ja: '2025年まで', en: 'Until 2025' }),
    from2026: t({ ja: '2026年から', en: 'From 2026' }),
    historicalNote: t({
      ja: '2025年までのデバイスと設定です。',
      en: 'Devices and settings used until 2025.',
    }),
    laptop: t({ ja: 'ノートPC', en: 'Laptop' }),
    model: t({ ja: '型番', en: 'Model number' }),
    laptopNote: t({
      ja: '2026年から使用しているノートPCです。詳細な仕様は未掲載です。キーパッドとタブレットの設定は以前と同じです。',
      en: 'The laptop used from 2026. Detailed specifications are not listed. Keypad and tablet settings are unchanged.',
    }),
    tablet: t({
      ja: 'タブレット',
      en: 'Tablet',
    }),
    keyboard: t({
      ja: 'キーボード',
      en: 'Keyboard',
    }),
    monitor: t({
      ja: 'モニター',
      en: 'Monitor',
    }),
    name: t({
      ja: '名前',
      en: 'Name',
    }),
    area: t({
      ja: '範囲',
      en: 'Area',
    }),
    width: t({
      ja: '幅 (mm)',
      en: 'Width (mm)',
    }),
    height: t({
      ja: '高さ (mm)',
      en: 'Height (mm)',
    }),
    position: t({
      ja: '位置',
      en: 'Position',
    }),
    x: t({
      ja: 'X (mm)',
      en: 'X (mm)',
    }),
    y: t({
      ja: 'Y (mm)',
      en: 'Y (mm)',
    }),
    rotation: t({
      ja: '回転 (deg)',
      en: 'R (deg)',
    }),
    keyMapping: t({
      ja: 'キー割り当て',
      en: 'Key Mapping',
    }),
    leftKey: t({
      ja: '左キー',
      en: 'Left Key',
    }),
    middleKey: t({
      ja: '中央キー',
      en: 'Middle Key',
    }),
    rightKey: t({
      ja: '右キー',
      en: 'Right Key',
    }),
    knobFunctions: t({
      ja: 'ノブ操作',
      en: 'Knob Functions',
    }),
    press: t({
      ja: '押し込み',
      en: 'Press',
    }),
    leftRotation: t({
      ja: '左回転',
      en: 'Left Rotation',
    }),
    rightRotation: t({
      ja: '右回転',
      en: 'Right Rotation',
    }),
    actuation: t({
      ja: 'アクチュエーション',
      en: 'Actuation',
    }),
    rtTrigger: t({
      ja: 'RTトリガー',
      en: 'RT trigger',
    }),
    rtRelease: t({
      ja: 'RTリリース',
      en: 'RT release',
    }),
    display: t({
      ja: 'ディスプレイ',
      en: 'Display',
    }),
    size: t({
      ja: 'サイズ',
      en: 'Size',
    }),
    resolution: t({
      ja: '解像度',
      en: 'Resolution',
    }),
    performance: t({
      ja: 'パフォーマンス',
      en: 'Performance',
    }),
    refreshRate: t({
      ja: 'リフレッシュレート',
      en: 'Refresh Rate',
    }),
    responseTime: t({
      ja: '応答速度',
      en: 'Response Time',
    }),
    units: {
      inches: t({
        ja: 'インチ',
        en: 'inches',
      }),
    },
    aria: {
      tabletArea: t({
        ja: 'タブレットの入力範囲',
        en: 'Tablet area visualization',
      }),
      settingsVisualization: t({
        ja: '設定のビジュアル',
        en: 'Settings visualization',
      }),
      settingsDetails: t({
        ja: '設定の詳細',
        en: 'Settings details',
      }),
      settingsContent: t({
        ja: '設定内容',
        en: 'Settings content',
      }),
      keyboardVisualization: t({
        ja: 'キーボードのビジュアル',
        en: 'Keyboard visualization',
      }),
      keyboardKnob: t({
        ja: 'キーボードのノブ',
        en: 'Keyboard knob',
      }),
      leftRotation: t({
        ja: '左回転',
        en: 'Left rotation',
      }),
      rightRotation: t({
        ja: '右回転',
        en: 'Right rotation',
      }),
      keyboardKeys: t({
        ja: 'キー配置',
        en: 'Keyboard keys',
      }),
      keySuffix: t({
        ja: 'キー',
        en: 'key',
      }),
      monitorDisplay: t({
        ja: 'モニター表示',
        en: 'Monitor display visualization',
      }),
      refreshRate: t({
        ja: 'リフレッシュレート',
        en: 'Refresh rate',
      }),
      screenSize: t({
        ja: '画面サイズ',
        en: 'Screen size',
      }),
      responseTime: t({
        ja: '応答速度',
        en: 'Response time',
      }),
    },
  },
} satisfies Dictionary

export default settingsContent
