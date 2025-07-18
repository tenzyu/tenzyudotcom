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

export type Project = {
  name: string
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
    description: 'osu!関連コンテンツを集約した個人サイト（現在閲覧中のサイト）',
    motivation:
      '趣味でosu!というリズムゲームをしていて、配信やYouTubeの投稿もしていたので、コンテンツを集中させた場所がほしくて作りました。',
    technologies: ['TypeScript', 'NextJS'],
    github: 'https://github.com/tenzyu/tenzyudotcom',
    demo: 'https://tenzyu.com',
  },
  {
    name: 'osu! bp database',
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

const ProjectCard: FC<{ project: Project }> = ({ project }) => (
  <Card className="overflow-hidden pt-0">
    <CardHeader className="bg-muted p-4 px-6">
      <CardTitle className="text-xl font-semibold">{project.name}</CardTitle>
    </CardHeader>
    <CardContent>
      <Table>
        <TableBody>
          <TableRow>
            <TableCell className="w-32 align-top font-medium">概要</TableCell>
            <TableCell className="align-top break-words whitespace-normal">
              {project.description}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="align-top font-medium">開発の動機</TableCell>
            <TableCell className="align-top break-words whitespace-normal">
              {project.motivation}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="align-top font-medium">使用技術</TableCell>
            <TableCell className="align-top break-words whitespace-normal">
              <div className="flex flex-wrap gap-2">
                {project.technologies.map((tech) => (
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
          <TableRow>
            <TableCell className="align-top font-medium">GitHub</TableCell>
            <TableCell className="align-top break-words whitespace-normal">
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-blue-600 underline"
              >
                {project.github}
              </a>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="align-top font-medium">Demo</TableCell>
            <TableCell className="align-top break-words whitespace-normal">
              <a
                href={project.demo}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-blue-600 underline"
              >
                {project.demo}
              </a>
              {project.note && (
                <div className="text-muted-foreground mt-2 text-xs">
                  <b>備考</b>: {project.note}
                </div>
              )}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </CardContent>
  </Card>
)

export function ProjectsSection() {
  return (
    <>
      <h2 className="mb-8 text-center text-2xl font-bold">
        個人開発プロジェクト
      </h2>
      <div className="space-y-8">
        {projects.map((project) => (
          <ProjectCard key={project.name} project={project} />
        ))}
      </div>
    </>
  )
}
