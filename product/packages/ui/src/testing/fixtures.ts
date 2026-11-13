export const foundationColors = [
  { name: 'Background', token: 'background', className: 'bg-background' },
  { name: 'Foreground', token: 'foreground', className: 'bg-foreground' },
  { name: 'Primary', token: 'primary', className: 'bg-primary' },
  { name: 'Secondary', token: 'secondary', className: 'bg-secondary' },
  { name: 'Muted', token: 'muted', className: 'bg-muted' },
  { name: 'Destructive', token: 'destructive', className: 'bg-destructive' },
] as const

export const accordionItems = [
  {
    value: 'principles',
    title: 'Design principles',
    content:
      'Tokens, components, and patterns stay close enough that changes are visible during review.',
  },
  {
    value: 'api',
    title: 'Public API',
    content:
      'Root exports stay focused on foundations while component entries remain available as subpaths.',
  },
  {
    value: 'regression',
    title: 'Regression checks',
    content:
      'Dense layouts, long text, and dark mode examples stay in Storybook for quick visual scans.',
  },
] as const

export const navigationItems = ['Dashboard', 'Projects', 'Settings'] as const
