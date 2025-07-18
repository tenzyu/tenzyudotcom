import { Badge } from '@/components/shadcn-ui/badge'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/shadcn-ui/card'
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/shadcn-ui/table'

import type { FC } from 'react'

export type Experience = {
  company: string
  period: string
  business: string
  capital: string
  employees: string
  role: string
  position: string
  responsibilities: string[]
  technologies: string[]
}

const experiences: Experience[] = [
  {
    company: 'Web開発会社',
    period: '2024年1月 - 2024年4月',
    business: '受託開発',
    capital: '30万円',
    employees: '4人 (2023年1月時点)',
    role: 'プログラマー',
    position: 'メンバー',
    responsibilities: [
      '受託開発の営業・案件の見積もり',
      '社内業務効率化／3件',
      'OKR目標管理ウェブアプリの改善',
      '営業効率化プログラムの作成',
      '勤怠管理のSlack連携作成',
    ],
    technologies: ['TypeScript', 'Laravel'],
  },
  {
    company: 'システム開発会社',
    period: '2023年5月 - 2023年6月',
    business: 'システム開発',
    capital: '300万円',
    employees: '2人 (2023年5月時点)',
    role: 'プログラマー',
    position: 'メンバー',
    responsibilities: [
      '地方の学校の図書の貸出履歴システム新規開発',
      '教師向けダッシュボード開発',
      '生徒向け履歴・本情報確認ウェブアプリ開発',
    ],
    technologies: ['TypeScript', 'React', 'Laravel', 'PostgreSQL'],
  },
  {
    company: '自社サービス開発会社',
    period: '2022年5月 - 2023年3月',
    business: '自社サービス開発',
    capital: '32,000,000円（資本剰余金含む・2025年7月15日時点）',
    employees: '2人 (2022年5月時点)',
    role: 'プログラマー',
    position: 'メンバー',
    responsibilities: [
      'UIデザイン→UIコード変換サービス開発',
      'アジャイル開発',
      '入社初期はビルド時間10分→1分未満へ短縮',
      'デザインオブジェクトをASTにパースしPrettierのDocへ変換、コード生成',
      'Stripeによる決済実装',
    ],
    technologies: ['TypeScript', 'React', 'Cloud Functions', 'Firestore'],
  },
]

const ExperienceCard: FC<{ exp: Experience }> = ({ exp }) => (
  <Card className="overflow-hidden pt-0">
    <CardHeader className="bg-muted p-4 px-6">
      <CardTitle className="text-xl font-semibold">{exp.company}</CardTitle>
      <div className="text-muted-foreground mt-2">{exp.period}</div>
    </CardHeader>
    <CardContent>
      <Table>
        <TableBody>
          <TableRow>
            <TableCell className="w-32 align-top font-medium">役割</TableCell>
            <TableCell className="align-top break-words whitespace-normal">
              {exp.role}（{exp.position}）
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="align-top font-medium">事業内容</TableCell>
            <TableCell className="align-top break-words whitespace-normal">
              {exp.business}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="align-top font-medium">資本金</TableCell>
            <TableCell className="align-top break-words whitespace-normal">
              {exp.capital}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="align-top font-medium">従業員数</TableCell>
            <TableCell className="align-top break-words whitespace-normal">
              {exp.employees}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="align-top font-medium">
              業務内容・実績
            </TableCell>
            <TableCell className="align-top break-words whitespace-normal">
              <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
                {exp.responsibilities.map((resp, idx) => (
                  <li key={idx}>{resp}</li>
                ))}
              </ul>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="align-top font-medium">
              技術スタック
            </TableCell>
            <TableCell className="align-top break-words whitespace-normal">
              <div className="flex flex-wrap gap-2">
                {exp.technologies.map((tech) => (
                  <Badge
                    key={tech}
                    variant="secondary"
                    className="bg-gray-600 px-2 py-0.5 text-xs text-white"
                  >
                    {tech}
                  </Badge>
                ))}
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </CardContent>
  </Card>
)

export function ExperienceSection() {
  return (
    <>
      <h2 className="mb-8 text-center text-2xl font-bold">実務経験</h2>
      <div className="space-y-8">
        {experiences.map((exp) => (
          <ExperienceCard key={exp.company + exp.period} exp={exp} />
        ))}
      </div>
    </>
  )
}
