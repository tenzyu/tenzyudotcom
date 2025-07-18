'use client'

import {
  Monitor,
  Laptop,
  Server,
  Terminal,
  Users,
  Zap,
  HardDrive,
  Network,
} from 'lucide-react'

import { EnvironmentCard, EnvironmentCardProps } from './environment-card'

const environments: EnvironmentCardProps[] = [
  {
    title: 'neko3',
    subtitle: 'Windows 11 Host',
    icon: Monitor,
    description: 'Windows環境。Parsec経由でリモート操作可能',
    theme: {
      bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
      border: 'border-blue-200',
      iconBg: 'bg-blue-500',
      titleColor: 'text-blue-800',
      subtitleColor: 'text-blue-600',
    },
    badges: [
      {
        icon: Monitor,
        text: 'Windows 11',
        bgColor: 'bg-blue-200',
        textColor: 'text-blue-800',
      },
      {
        icon: Zap,
        text: 'Parsec Host',
        bgColor: 'bg-green-200',
        textColor: 'text-green-800',
      },
    ],
  },
  {
    title: 'neko5',
    subtitle: 'Main Development Machine',
    icon: Laptop,
    description: 'メインのNixOSラップトップ。全環境への接続拠点',
    theme: {
      bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
      border: 'border-emerald-200',
      iconBg: 'bg-emerald-500',
      titleColor: 'text-emerald-800',
      subtitleColor: 'text-emerald-600',
    },
    badges: [
      {
        icon: Laptop,
        text: 'NixOS',
        bgColor: 'bg-emerald-200',
        textColor: 'text-emerald-800',
      },
      {
        icon: Zap,
        text: 'Primary',
        bgColor: 'bg-yellow-200',
        textColor: 'text-yellow-800',
      },
    ],
  },
  {
    title: 'neko6',
    subtitle: 'WSL2 on neko3',
    icon: Terminal,
    description: 'neko3上のWSL2環境。開発用コンテナとして活用',
    theme: {
      bg: 'bg-gradient-to-br from-purple-50 to-purple-100',
      border: 'border-purple-200',
      iconBg: 'bg-purple-500',
      titleColor: 'text-purple-800',
      subtitleColor: 'text-purple-600',
    },
    badges: [
      {
        icon: HardDrive,
        text: 'NixOS',
        bgColor: 'bg-purple-200',
        textColor: 'text-purple-800',
      },
      {
        icon: Network,
        text: 'SSH Target',
        bgColor: 'bg-orange-200',
        textColor: 'text-orange-800',
      },
    ],
  },
  {
    title: 'neko7',
    subtitle: 'Remote Server',
    icon: Server,
    description: '友人の自宅サーバー。Proxmox配下のVMで、デプロイ先のひとつ',
    theme: {
      bg: 'bg-gradient-to-br from-orange-50 to-orange-100',
      border: 'border-orange-200',
      iconBg: 'bg-orange-500',
      titleColor: 'text-orange-800',
      subtitleColor: 'text-orange-600',
    },
    badges: [
      {
        icon: Server,
        text: 'NixOS',
        bgColor: 'bg-orange-200',
        textColor: 'text-orange-800',
      },
      {
        icon: Users,
        text: '友人サーバー',
        bgColor: 'bg-blue-200',
        textColor: 'text-blue-800',
      },
    ],
  },
]

export const DevEnvironmentSection = () => {
  return (
    <div className="mx-auto px-4 md:px-8">
      <div className="mb-12 text-center">
        <h2 className="mb-4 text-2xl font-bold md:text-3xl">
          Development Environment
        </h2>
        <p className="mx-auto max-w-2xl text-lg">
          NixOS中心の開発環境 - neko5から接続してどこでも開発
        </p>
      </div>
      <div className="grid items-center gap-8">
        <div className="space-y-6">
          {environments.map((env) => (
            <EnvironmentCard key={env.title} {...env} />
          ))}
        </div>
      </div>
      <div className="mt-4 rounded-xl p-6 shadow-lg">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Network className="h-5 w-5" />
          接続構成
        </h3>
        <div className="grid grid-cols-1 gap-4 text-sm">
          <div>• neko5 → neko3 (Parsec)</div>
          <div>• neko5 → neko6 (SSH)</div>
          <div>• neko5 → neko7 (SSH)</div>
        </div>
      </div>
    </div>
  )
}
