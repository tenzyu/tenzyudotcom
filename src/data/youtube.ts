export type YouTube = {
  id: string
  title: string
  type: 'video' | 'short'
}

export const YOUTUBE_VIDEOS: YouTube[] = [
  {
    id: 'ieKX5r1NRzo',
    title: 'ダイジェスト 4桁入りから自己ベスト更新まで【TENZYU/切り抜き】【osu!】',
    type: 'video'
  },
  {
    id: 'xpLVatdM_SA',
    title: 'MY NEW TOP PLAY 590PP',
    type: 'video'
  },
  {
    id: 'dAROJJlFYQY',
    title: 'MY NEW TOP PLAY 465PP',
    type: 'video'
  },
  {
    id: 'GhKEtFagPYE',
    title: 'MY NEW TOP PLAY 460PP',
    type: 'video'
  }
]

export const YOUTUBE_SHORTS: YouTube[] = [
  {
    id: 'g0xCSdVmtzc',
    title: '#shorts 4桁到達の瞬間 #osu #osugame #tenzyu #音ゲー',
    type: 'short'
  },
  {
    id: 'vGM6YwMeDCM',
    title: '#shorts osu!lazer の設定を紹介します #osu #osugame',
    type: 'short'
  },
  {
    id: 'yZ7xsxi66Ww',
    title: '#shorts osuのマップはこうやって見つける。スキルから見つける方法。【TENZYU/切り抜き】【2024/9/23】 #osu #osugame',
    type: 'short'
  },
]