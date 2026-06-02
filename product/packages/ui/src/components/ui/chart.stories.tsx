import type { Meta, StoryObj } from '@storybook/react-vite'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis } from 'recharts'

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from './chart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'

const data = [
  { month: 'Jan', desktop: 86, mobile: 42 },
  { month: 'Feb', desktop: 112, mobile: 63 },
  { month: 'Mar', desktop: 92, mobile: 81 },
  { month: 'Apr', desktop: 138, mobile: 98 },
]

const config = {
  desktop: { label: 'Desktop', color: 'var(--chart-1)' },
  mobile: { label: 'Mobile', color: 'var(--chart-2)' },
} satisfies ChartConfig

const meta = {
  title: 'Components/Chart',
  parameters: {
    layout: 'padded',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const AreaChartStory: Story = {
  render: () => (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Usage trend</CardTitle>
        <CardDescription>Tooltip and legend rendering with shared tokens.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-72 w-full">
          <AreaChart data={data} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              dataKey="desktop"
              type="monotone"
              fill="var(--color-desktop)"
              stroke="var(--color-desktop)"
            />
            <Area
              dataKey="mobile"
              type="monotone"
              fill="var(--color-mobile)"
              stroke="var(--color-mobile)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  ),
}

export const BarChartStory: Story = {
  render: () => (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Release throughput</CardTitle>
        <CardDescription>Bar chart with the same config contract.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-72 w-full">
          <BarChart data={data} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
            <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  ),
}
