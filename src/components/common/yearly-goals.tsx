'use client'

import { YEARLY_GOALS } from '@/data/goals'
import { cn } from '@/lib/utils'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import type { SupportedLocales } from '@/i18n/request'

export function YearlyGoals() {
  const t = useTranslations()
  const locale = useLocale() as SupportedLocales

  const getMonthName = (month: number): string => {
    if (locale === 'ja') {
      const monthNames = [
        '1月',
        '2月',
        '3月',
        '4月',
        '5月',
        '6月',
        '7月',
        '8月',
        '9月',
        '10月',
        '11月',
        '12月',
      ]
      return monthNames[month - 1]
    } else {
      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ]
      return monthNames[month - 1]
    }
  }

  // 現在の月を取得
  const currentMonth = new Date().getMonth() + 1 // JavaScriptの月は0から始まるため+1

  return (
    // FIX: grid のほうがいいかも
    <Table className='block rounded-lg border w-full max-w-md mx-auto wrap-normal text-md'>
      <TableBody className='block'>
        {YEARLY_GOALS.map((goal, index) => (
          <TableRow
            key={goal.month}
            className={cn(
              'block w-full flex',
              goal.month === currentMonth
                ? 'bg-primary/5 hover:bg-primary/5'
                : index % 2 === 0
                  ? 'bg-background hover:bg-background'
                  : 'bg-muted/20 hover:bg-muted/20',
              goal.month === 12 && 'rounded-b-lg', // FIX: なんか親に last: つけてもうまくいかない
            )}
          >
            <TableCell
              className={cn(
                'block py-5 pl-4 min-w-16',
                goal.month === currentMonth && 'text-primary',
              )}
            >
              {getMonthName(goal.month)}
            </TableCell>
            <TableCell
              className={cn(
                'block py-5',
                goal.month === currentMonth && 'text-primary',
              )}
            >
              <div className='flex items-center text-wrap'>
                {goal.title[locale] || '-'}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
