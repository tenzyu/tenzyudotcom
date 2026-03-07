import { type Dictionary, t } from 'intlayer'

const portfolioContent = {
  key: 'page-portfolio',
  content: {
    metadata: {
      title: t({
        ja: 'ポートフォリオ',
        en: 'Portfolio',
      }),
      description: t({
        ja: 'これまでの経歴やスキル、制作物などをまとめています。',
        en: 'A summary of my experience, skills, and work.',
      }),
    },
    about: {
      name: t({
        ja: '天珠 (tenzyu)',
        en: 'Tenzyu',
      }),
      role: t({
        ja: 'フロントエンドエンジニア',
        en: 'Frontend Engineer',
      }),
      description: t({
        ja: '東京都在住のフロントエンドエンジニア。React / Next.js / TypeScript を用いたWebアプリケーション開発を専門としています。',
        en: 'Frontend engineer based in Tokyo, specializing in web applications built with React, Next.js, and TypeScript.',
      }),
      imageAlt: t({
        ja: 'プロフィール画像',
        en: 'Profile image',
      }),
      links: [
        {
          label: 'Blog',
          ariaLabel: t({
            ja: 'ブログを開く',
            en: 'Open Blog',
          }),
          url: 'https://tenzyu.com/blog',
        },
        {
          label: 'GitHub',
          ariaLabel: t({
            ja: 'GitHub を開く',
            en: 'Open GitHub',
          }),
          url: 'https://github.com/tenzyu',
        },
        {
          label: 'X',
          ariaLabel: t({
            ja: 'X を開く',
            en: 'Open X',
          }),
          url: 'https://x.com/tenzyudotcom',
        },
      ],
    },
    projects: {
      sectionTitle: t({
        ja: '個人開発プロジェクト',
        en: 'Personal Projects',
      }),
      motivationLabel: t({
        ja: '開発の動機:',
        en: 'Motivation:',
      }),
      githubLabel: t({
        ja: 'GitHub',
        en: 'GitHub',
      }),
      demoLabel: t({
        ja: 'デモ',
        en: 'Demo',
      }),
      notePrefix: t({
        ja: '※ ',
        en: 'Note: ',
      }),
      items: [
        {
          name: t({
            ja: '個人ウェブサイト',
            en: 'Personal Website',
          }),
          highlight: t({
            ja: 'Next.jsベースのポートフォリオ兼ブログ。osu!プレイヤーとしての世界観を表現',
            en: 'A Next.js portfolio + blog that reflects my world as an osu! player.',
          }),
          description: t({
            ja: 'osu!関連コンテンツを集約した個人サイト（現在閲覧中のサイト）',
            en: 'Personal site aggregating osu!-related content (this site).',
          }),
          motivation: t({
            ja: '趣味でosu!というリズムゲームをしていて、配信やYouTubeの投稿もしていたので、コンテンツを集中させた場所がほしくて作りました。',
            en: 'I play osu! as a hobby and stream/post to YouTube, so I built a place to gather it all.',
          }),
          technologies: ['TypeScript', 'NextJS'],
          github: 'https://github.com/tenzyu/tenzyudotcom',
          demo: 'https://tenzyu.com',
        },
        {
          name: t({
            ja: 'osu! bp database',
            en: 'osu! bp database',
          }),
          highlight: t({
            ja: '数十万ユーザーの数千万件に及ぶスコアを瞬時に検索・集計できる高速なDB',
            en: 'A fast database that can search and aggregate tens of millions of scores across hundreds of thousands of users.',
          }),
          description: t({
            ja: 'osu!というリズムゲームの、数十万のプレイヤーの数千万のベストスコアを、データテーブルとして操作できるウェブアプリ',
            en: 'A web app to explore millions of best scores from hundreds of thousands of osu! players in a data table.',
          }),
          motivation: t({
            ja: '多くのosu!のプレイヤーは、ランキングを上げるためにPerformance Pointと呼ばれるランキングを決定する数字を得やすい譜面（難易度）を常に探していて、私もその一人だったので作成しました。',
            en: 'Many osu! players (myself included) search for maps that maximize Performance Points, so I built a tool to make that easier.',
          }),
          technologies: ['TypeScript', 'NextJS', 'Postgres', 'Deno'],
          github: '',
          demo: 'https://youtu.be/d7cvjRIH4wI',
          note: t({
            ja: '開発当時の身内向けに撮影したデモ映像で、カジュアルなものになります。',
            en: 'A casual demo video recorded for friends during development.',
          }),
        },
        {
          name: t({
            ja: 'osu! skin remixer',
            en: 'osu! skin remixer',
          }),
          highlight: t({
            ja: 'インストール不要で、ブラウザ上で直感的にゲームスキンをブレンドできるツール',
            en: 'A no-install, browser-based tool to blend game skins intuitively.',
          }),
          description: t({
            ja: 'osu!というゲームには、スキンと呼ばれるゲーム画面のカスタマイズがあって、それらスキンを簡単に混ぜるためのウェブアプリ',
            en: 'A web app to mix osu! skins—customizations for the game UI.',
          }),
          motivation: t({
            ja: 'いろんなスキンの気に入った素材をチェリーピックして、自身のスキンを作る文化があって、それを初心者でも簡単にできることを目標にしています。既存のものは、インストールが必要だったり、素材の枠組みが大雑把すぎたり、逆に細かすぎて完成しなかったり、古すぎたり、意外と使いやすいものが存在しなかったので作りました。',
            en: 'There is a culture of cherry-picking favorite parts from different skins to build your own. I wanted to make that beginner-friendly. Existing tools were install-heavy, too coarse or too detailed, outdated, or simply hard to use—so I built one.',
          }),
          technologies: ['TypeScript', 'NextJS'],
          github: '',
          demo: 'https://youtu.be/2ooDARE6KN8',
          note: t({
            ja: '開発当時の身内向けに撮影したデモ映像で、カジュアルなものになります。',
            en: 'A casual demo video recorded for friends during development.',
          }),
        },
      ],
    },
    experience: {
      sectionTitle: t({
        ja: '実務経験',
        en: 'Professional Experience',
      }),
      businessLabel: t({
        ja: '事業内容:',
        en: 'Business:',
      }),
      capitalLabel: t({
        ja: '資本金:',
        en: 'Capital:',
      }),
      employeesLabel: t({
        ja: '従業員数:',
        en: 'Employees:',
      }),
      items: [
        {
          company: t({
            ja: 'Web開発会社',
            en: 'Web Development Company',
          }),
          period: t({
            ja: '2024年1月 - 2024年4月',
            en: 'Jan 2024 – Apr 2024',
          }),
          business: t({
            ja: '受託開発',
            en: 'Contract development',
          }),
          capital: t({
            ja: '30万円',
            en: '¥300,000',
          }),
          employees: t({
            ja: '4人 (2023年1月時点)',
            en: '4 employees (as of Jan 2023)',
          }),
          role: t({
            ja: 'プログラマー',
            en: 'Programmer',
          }),
          position: t({
            ja: 'メンバー',
            en: 'Member',
          }),
          responsibilities: [
            t({
              ja: '受託開発の営業・案件の見積もり',
              en: 'Sales and estimates for contract development projects',
            }),
            t({
              ja: '社内業務効率化／3件',
              en: 'Internal workflow automation (3 initiatives)',
            }),
            t({
              ja: 'OKR目標管理ウェブアプリの改善',
              en: 'Improvements to an OKR management web app',
            }),
            t({
              ja: '営業効率化プログラムの作成',
              en: 'Built tooling to streamline sales operations',
            }),
            t({
              ja: '勤怠管理のSlack連携作成',
              en: 'Implemented Slack integration for time tracking',
            }),
          ],
          technologies: ['TypeScript', 'Laravel'],
        },
        {
          company: t({
            ja: 'システム開発会社',
            en: 'Systems Development Company',
          }),
          period: t({
            ja: '2023年5月 - 2023年6月',
            en: 'May 2023 – Jun 2023',
          }),
          business: t({
            ja: 'システム開発',
            en: 'Systems development',
          }),
          capital: t({
            ja: '300万円',
            en: '¥3,000,000',
          }),
          employees: t({
            ja: '2人 (2023年5月時点)',
            en: '2 employees (as of May 2023)',
          }),
          role: t({
            ja: 'プログラマー',
            en: 'Programmer',
          }),
          position: t({
            ja: 'メンバー',
            en: 'Member',
          }),
          responsibilities: [
            t({
              ja: '地方の学校の図書の貸出履歴システム新規開発',
              en: 'Built a new library lending history system for a local school',
            }),
            t({
              ja: '教師向けダッシュボード開発',
              en: 'Developed a teacher dashboard',
            }),
            t({
              ja: '生徒向け履歴・本情報確認ウェブアプリ開発',
              en: 'Built a student-facing web app for history and book info',
            }),
          ],
          technologies: ['TypeScript', 'React', 'Laravel', 'PostgreSQL'],
        },
        {
          company: t({
            ja: '自社サービス開発会社',
            en: 'In-house Service Company',
          }),
          period: t({
            ja: '2022年5月 - 2023年3月',
            en: 'May 2022 – Mar 2023',
          }),
          business: t({
            ja: '自社サービス開発',
            en: 'In-house service development',
          }),
          capital: t({
            ja: '32,000,000円（資本剰余金含む・2025年7月15日時点）',
            en: '¥32,000,000 (incl. capital surplus, as of July 15, 2025)',
          }),
          employees: t({
            ja: '2人 (2022年5月時点)',
            en: '2 employees (as of May 2022)',
          }),
          role: t({
            ja: 'プログラマー',
            en: 'Programmer',
          }),
          position: t({
            ja: 'メンバー',
            en: 'Member',
          }),
          responsibilities: [
            t({
              ja: 'UIデザイン→UIコード変換サービス開発',
              en: 'Built a service that converts UI designs into UI code',
            }),
            t({
              ja: 'アジャイル開発',
              en: 'Agile development',
            }),
            t({
              ja: '入社初期はビルド時間10分→1分未満へ短縮',
              en: 'Reduced build time from 10 minutes to under 1 minute early on',
            }),
            t({
              ja: 'デザインオブジェクトをASTにパースしPrettierのDocへ変換、コード生成',
              en: 'Parsed design objects into AST and generated code via Prettier Doc',
            }),
            t({
              ja: 'Stripeによる決済実装',
              en: 'Implemented Stripe payments',
            }),
          ],
          technologies: ['TypeScript', 'React', 'Cloud Functions', 'Firestore'],
        },
      ],
    },
    philosophy: {
      sectionTitle: t({
        ja: 'プログラミングとの向き合い方',
        en: 'How I Approach Programming',
      }),
      paragraphs: [
        t({
          ja: '私はこれからプログラミングの仕事がAIで代替されていくことを良いことだと思っています。積極的にAIを採用し、課題解決や価値提供に集中できる時代が来ることを歓迎しています。',
          en: 'I see the rise of AI in programming as a good thing. I welcome a future where we embrace AI and focus more on solving problems and delivering value.',
        }),
        t({
          ja: '一方で、個人的にはエンタメの領域で「人の心を動かす」体験や、人々が思いつかなかった遊びを技術で表現したいと思っています。アイデアを形にし、ユーザーに新しい遊びや驚きを届けることが、私のプログラミングの原動力です。',
          en: 'At the same time, I want to create experiences in entertainment that move people and express new kinds of play through technology. Turning ideas into experiences that surprise users is what motivates me.',
        }),
        t({
          ja: 'これからもAIや最新技術を積極的に活用しつつ、「自分だからこそ作れるもの」「人の役に立つもの」を追求していきたいと考えています。',
          en: 'I will keep adopting AI and new technologies while pursuing things only I can make—things that help people.',
        }),
      ],
    },
    environments: {
      sectionTitle: t({
        ja: '開発環境',
        en: 'Development Environment',
      }),
      sectionDescription: t({
        ja: 'NixOSを中心としたリモート・分散開発環境の構成',
        en: 'A remote, distributed dev setup centered on NixOS',
      }),
      detailsTrigger: t({
        ja: '環境の詳細を表示',
        en: 'Show environment details',
      }),
      networkTitle: t({
        ja: 'ネットワーク接続構成',
        en: 'Network connections',
      }),
      networkItems: [
        t({
          ja: 'neko5 から neko3 へ: Parsecによる低遅延リモートデスクトップ接続',
          en: 'neko5 → neko3: low-latency remote desktop via Parsec',
        }),
        t({
          ja: 'neko5 から neko6 へ: SSH接続によるCLI開発',
          en: 'neko5 → neko6: CLI development over SSH',
        }),
        t({
          ja: 'neko5 から neko7 へ: SSH接続によるリモートデプロイ',
          en: 'neko5 → neko7: remote deployments over SSH',
        }),
      ],
      items: [
        {
          title: 'neko3 (Windows 11 Host)',
          subtitle: t({
            ja: 'Parsec経由のリモート開発ホスト',
            en: 'Remote dev host via Parsec',
          }),
          description: t({
            ja: '主にリモート接続を受け入れるためのメインWindows環境。',
            en: 'Main Windows environment that accepts remote connections.',
          }),
          os: 'Windows 11',
          role: 'Parsec Host',
        },
        {
          title: 'neko5 (Main Development Machine)',
          subtitle: t({
            ja: 'NixOSラップトップ',
            en: 'NixOS laptop',
          }),
          description: t({
            ja: '全ての環境の中枢を担うメイン開発機。NixOSを採用し、宣言的な環境構築を実践。',
            en: 'Primary dev machine. Built around NixOS with declarative environment setup.',
          }),
          os: 'NixOS',
          role: 'Primary',
        },
        {
          title: 'neko6 (WSL2 on neko3)',
          subtitle: t({
            ja: '開発用Linuxコンテナ・ターゲット',
            en: 'Linux container target for development',
          }),
          description: t({
            ja: 'neko3上のWSL2環境でNixOSを稼働させ、SSHのターゲットとして利用。',
            en: 'Runs NixOS on WSL2 (neko3) and acts as an SSH target.',
          }),
          os: 'NixOS (WSL2)',
          role: 'SSH Target',
        },
        {
          title: 'neko7 (Remote Server)',
          subtitle: t({
            ja: 'リモートデプロイ先サーバー',
            en: 'Remote deployment server',
          }),
          description: t({
            ja: 'Proxmox配下のVM環境。検証用のプライベートデプロイターゲット。',
            en: 'VM under Proxmox. Private deployment target for verification.',
          }),
          os: 'NixOS',
          role: 'Remote VM',
        },
      ],
    },
    footer: {
      note: t({
        ja: '初版：2025年7月18日 / 最終更新：2026年3月',
        en: 'First edition: July 18, 2025 / Last updated: March 2026',
      }),
    },
  },
} satisfies Dictionary

export default portfolioContent
