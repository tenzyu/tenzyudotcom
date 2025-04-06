'use client'

import { Card, CardContent } from '@/components/ui/card'
import { YEARLY_GOALS } from '@/data/goals'

export function YearlyGoals() {
  const getMonthName = (month: number): string => {
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ]
    return monthNames[month - 1]
  }

  // 現在の月を取得
  const currentMonth = new Date().getMonth() + 1 // JavaScriptの月は0から始まるため+1

  return (
    <Card className='w-full max-w-md mx-auto'>
      <CardContent className='px-6 pb-4'>
        <div className='overflow-hidden rounded-lg border'>
          <table className='w-full'>
            <thead>
              <tr className='bg-muted/50'>
                <th className='py-2 px-4 text-left font-medium text-muted-foreground'>
                  月
                </th>
                <th className='py-2 px-4 text-left font-medium text-muted-foreground'>
                  目標
                </th>
              </tr>
            </thead>
            <tbody>
              {YEARLY_GOALS.map((goal, index) => (
                <tr
                  key={goal.month}
                  className={`border-t ${goal.month === currentMonth ? 'bg-primary/5' : index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}
                >
                  <td
                    className={`py-3 px-4 ${goal.month === currentMonth ? 'text-primary font-medium' : ''}`}
                  >
                    {getMonthName(goal.month)}
                  </td>
                  <td
                    className={`py-3 px-4 ${goal.month === currentMonth ? 'text-primary font-medium' : ''}`}
                  >
                    {goal.title || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
