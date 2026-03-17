import { useIntlayer } from 'next-intlayer/server'

import { Content } from '@/app/[locale]/_features/content'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils/common'

export function YearlyGoals() {
  const content = useIntlayer('yearlyGoals')
  const goals = content.goals as ReadonlyArray<{
    month: { value: number }
    title?: string
  }>

  const currentMonth = new Date().getMonth() + 1

  return (
    <Content size="md">
      {/* FIX: grid のほうがいいかも */}
      <Table className="text-md block w-full rounded-lg border wrap-normal">
        <TableBody className="block">
          {goals.map((goal, index) => (
            <TableRow
              key={goal.month.value}
              className={cn(
                'flex w-full',
                goal.month.value === currentMonth
                  ? 'bg-primary/5 hover:bg-primary/5'
                  : index % 2 === 0
                    ? 'bg-background hover:bg-background'
                    : 'bg-muted hover:bg-muted',
                goal.month.value === 12 && 'rounded-b-lg', // FIX: なんか親に last: つけてもうまくいかない
              )}
            >
              <TableCell
                className={cn(
                  'block min-w-16 py-5 pl-4',
                  goal.month.value === currentMonth && 'text-primary',
                )}
              >
                {content.monthNames[goal.month.value - 1]}
              </TableCell>
              <TableCell
                className={cn(
                  'block py-5',
                  goal.month.value === currentMonth && 'text-primary',
                )}
              >
                <div className="flex items-center text-wrap">
                  {goal.title || '-'}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Content>
  )
}
