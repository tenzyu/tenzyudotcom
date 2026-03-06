import { SectionHeader } from '@/components/site/section-header'
import { Badge } from '@/components/ui/badge'

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

export function ExperienceSection() {
  return (
    <div className="space-y-8">
      <SectionHeader title="実務経験" variant="underline" />
      <div className="space-y-10">
        {experiences.map((exp) => (
          <div key={exp.company + exp.period} className="space-y-3">
            <div className="flex flex-col md:flex-row md:items-baseline md:justify-between">
              <h3 className="text-lg font-semibold">{exp.company}</h3>
              <span className="text-muted-foreground text-sm font-medium">
                {exp.period}
              </span>
            </div>
            <p className="text-sm font-medium">
              {exp.role}（{exp.position}）
            </p>
            <div className="text-muted-foreground text-sm leading-relaxed">
              <p>事業内容: {exp.business}</p>
              <p>
                資本金: {exp.capital} / 従業員数: {exp.employees}
              </p>
            </div>
            <ul className="text-foreground list-inside list-disc pl-2 text-sm leading-relaxed">
              {exp.responsibilities.map((resp, idx) => (
                <li key={idx}>{resp}</li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2 pt-2">
              {exp.technologies.map((tech) => (
                <Badge key={tech} variant="secondary">
                  {tech}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
