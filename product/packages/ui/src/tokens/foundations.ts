export const tenzyuFoundationTokens = {
  colorRoles: [
    'background',
    'foreground',
    'card',
    'primary',
    'secondary',
    'tertiary',
    'muted',
    'accent',
    'destructive',
    'warning',
    'success',
    'info',
    'link',
    'border',
    'input',
    'ring',
  ],
  contrastPolicy: {
    text: '>= 4.5:1',
    nonText: '>= 3:1',
    focusVisible: 'must not rely on color only',
  },
  typographyPolicy: {
    bodyMinimumPx: 16,
    exceptionalSmallPx: 14,
    bodyLineHeight: 1.6,
    denseUiLineHeight: [1.2, 1.3, 1.4],
  },
  layoutPolicy: {
    gridColumns: 12,
    minPageMargin: '1rem',
    gutter: 'clamp(1.5rem, 3vw, 2rem)',
    touchTarget: '2.75rem',
    compactTarget: '2rem',
  },
} as const

export type TenzyuFoundationTokenName = keyof typeof tenzyuFoundationTokens
