import { SectionHeader } from '@/components/site/section-header'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

type Environment = {
  title: string
  subtitle: string
  description: string
  os: string
  role: string
}

const environments: Environment[] = [
  {
    title: 'neko3 (Windows 11 Host)',
    subtitle: 'Parsec経由のリモート開発ホスト',
    description: '主にリモート接続を受け入れるためのメインWindows環境。',
    os: 'Windows 11',
    role: 'Parsec Host',
  },
  {
    title: 'neko5 (Main Development Machine)',
    subtitle: 'NixOSラップトップ',
    description:
      '全ての環境の中枢を担うメイン開発機。NixOSを採用し、宣言的な環境構築を実践。',
    os: 'NixOS',
    role: 'Primary',
  },
  {
    title: 'neko6 (WSL2 on neko3)',
    subtitle: '開発用Linuxコンテナ・ターゲット',
    description:
      'neko3上のWSL2環境でNixOSを稼働させ、SSHのターゲットとして利用。',
    os: 'NixOS (WSL2)',
    role: 'SSH Target',
  },
  {
    title: 'neko7 (Remote Server)',
    subtitle: 'リモートデプロイ先サーバー',
    description:
      'Proxmox配下のVM環境。検証用のプライベートデプロイターゲット。',
    os: 'NixOS',
    role: 'Remote VM',
  },
]

export function DevEnvironmentSection() {
  return (
    <div className="space-y-8">
      <SectionHeader
        title="Development Environment"
        description="NixOSを中心としたリモート・分散開発環境の構成"
        variant="underline"
      />

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="environments">
          <AccordionTrigger className="text-sm font-semibold hover:no-underline">
            環境の詳細を表示
          </AccordionTrigger>
          <AccordionContent className="space-y-6 pt-4">
            <div className="space-y-6">
              {environments.map((env) => (
                <Card key={env.title} variant="soft">
                  <CardContent className="space-y-2 pt-6">
                    <h3 className="text-lg font-semibold">{env.title}</h3>
                    <p className="text-sm font-medium">{env.subtitle}</p>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {env.description}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Badge variant="secondary">{env.os}</Badge>
                      <Badge variant="secondary">{env.role}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card variant="outline">
              <CardContent className="space-y-3 pt-6">
                <h3 className="text-sm font-semibold">ネットワーク接続構成</h3>
                <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
                  <li>
                    neko5 から neko3 へ:
                    Parsecによる低遅延リモートデスクトップ接続
                  </li>
                  <li>neko5 から neko6 へ: SSH接続によるCLI開発</li>
                  <li>neko5 から neko7 へ: SSH接続によるリモートデプロイ</li>
                </ul>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
