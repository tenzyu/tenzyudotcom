import { SectionHeader } from '@/components/site/section-header'
import { ExternalLink } from '@/components/site/external-link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export type Project = {
  name: string
  highlight: string
  description: string
  motivation: string
  technologies: string[]
  github: string
  demo: string
  note?: string
}

const projects: Project[] = [
  {
    name: '個人ウェブサイト',
    highlight:
      'Next.jsベースのポートフォリオ兼ブログ。osu!プレイヤーとしての世界観を表現',
    description: 'osu!関連コンテンツを集約した個人サイト（現在閲覧中のサイト）',
    motivation:
      '趣味でosu!というリズムゲームをしていて、配信やYouTubeの投稿もしていたので、コンテンツを集中させた場所がほしくて作りました。',
    technologies: ['TypeScript', 'NextJS'],
    github: 'https://github.com/tenzyu/tenzyudotcom',
    demo: 'https://tenzyu.com',
  },
  {
    name: 'osu! bp database',
    highlight:
      '数十万ユーザーの数千万件に及ぶスコアを瞬時に検索・集計できる高速なDB',
    description:
      'osu!というリズムゲームの、数十万のプレイヤーの数千万のベストスコアを、データテーブルとして操作できるウェブアプリ',
    motivation:
      '多くのosu!のプレイヤーは、ランキングを上げるためにPerformance Pointと呼ばれるランキングを決定する数字を得やすい譜面（難易度）を常に探していて、私もその一人だったので作成しました。',
    technologies: ['TypeScript', 'NextJS', 'Postgres', 'Deno'],
    github: '',
    demo: 'https://youtu.be/d7cvjRIH4wI',
    note: '開発当時の身内向けに撮影したデモ映像で、カジュアルなものになります。',
  },
  {
    name: 'osu! skin remixer',
    highlight:
      'インストール不要で、ブラウザ上で直感的にゲームスキンをブレンドできるツール',
    description:
      'osu!というゲームには、スキンと呼ばれるゲーム画面のカスタマイズがあって、それらスキンを簡単に混ぜるためのウェブアプリ',
    motivation:
      'いろんなスキンの気に入った素材をチェリーピックして、自身のスキンを作る文化があって、それを初心者でも簡単にできることを目標にしています。既存のものは、インストールが必要だったり、素材の枠組みが大雑把すぎたり、逆に細かすぎて完成しなかったり、古すぎたり、意外と使いやすいものが存在しなかったので作りました。',
    technologies: ['TypeScript', 'NextJS'],
    github: '',
    demo: 'https://youtu.be/2ooDARE6KN8',
    note: '開発当時の身内向けに撮影したデモ映像で、カジュアルなものになります。',
  },
]

export function ProjectsSection() {
  return (
    <div className="space-y-8">
      <SectionHeader title="個人開発プロジェクト" variant="underline" />
      <div className="space-y-10">
        {projects.map((project) => (
          <Card key={project.name} variant="soft" className="p-0">
            <CardHeader className="gap-2">
              <CardTitle className="text-lg font-semibold">
                {project.name}
              </CardTitle>
              <p className="text-primary text-sm leading-relaxed font-medium">
                {project.highlight}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm leading-relaxed">{project.description}</p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                <strong>開発の動機:</strong> {project.motivation}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {project.technologies.map((tech) => (
                  <Badge key={tech} variant="secondary">
                    {tech}
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-4 pt-2 text-sm font-medium">
                {project.github ? (
                  <Button
                    variant="ghost"
                    className="h-auto px-0 text-primary hover:bg-transparent hover:underline"
                    asChild
                  >
                    <ExternalLink href={project.github}>
                      GitHub &rarr;
                    </ExternalLink>
                  </Button>
                ) : null}
                {project.demo ? (
                  <Button
                    variant="ghost"
                    className="h-auto px-0 text-primary hover:bg-transparent hover:underline"
                    asChild
                  >
                    <ExternalLink href={project.demo}>
                      Demo &rarr;
                    </ExternalLink>
                  </Button>
                ) : null}
              </div>
              {project.note ? (
                <p className="text-muted-foreground text-xs">
                  ※ {project.note}
                </p>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
