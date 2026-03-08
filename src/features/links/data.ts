export type LinkCategory = 'Watch' | 'Social' | 'Build' | 'Legacy'

export type MyLink = {
  name: string
  id: string
  url: string
  shortenUrl: string
  icon: string
  category: LinkCategory
}

export const MY_LINKS: MyLink[] = [
  {
    name: 'Twitch',
    id: '@tenzyudotcom',
    url: 'https://www.twitch.tv/tenzyudotcom',
    shortenUrl: 'twitch',
    icon: 'twitch',
    category: 'Watch',
  },
  {
    name: 'YouTube',
    id: '@tenzyudotcom',
    url: 'https://www.youtube.com/@tenzyudotcom',
    shortenUrl: 'youtube',
    icon: 'youtube',
    category: 'Watch',
  },
  {
    name: 'X',
    id: '@FlawInAffection',
    url: 'https://x.com/FlawInAffection',
    shortenUrl: 'x',
    icon: 'x',
    category: 'Social',
  },
  {
    name: 'Bluesky',
    id: '@tenzyu.com',
    url: 'https://bsky.app/profile/tenzyu.com',
    shortenUrl: 'bsky',
    icon: 'bsky',
    category: 'Social',
  },
  {
    name: 'Ko-fi',
    id: '@tenzyu',
    url: 'https://ko-fi.com/tenzyu',
    shortenUrl: 'kofi',
    icon: 'kofi',
    category: 'Social',
  },
  {
    name: 'TikTok',
    id: '@flawinaffection',
    url: 'https://www.tiktok.com/@flawinaffection',
    shortenUrl: 'tiktok',
    icon: 'tiktok',
    category: 'Social',
  },
  {
    name: 'Instagram',
    id: '@flawinaffection',
    url: 'https://www.instagram.com/flawinaffection/',
    shortenUrl: 'instagram',
    icon: 'instagram',
    category: 'Social',
  },
  {
    name: 'Discord',
    id: 'server',
    url: 'https://discord.gg/vWEypRa86N',
    shortenUrl: 'discord',
    icon: 'discord',
    category: 'Social',
  },
  {
    name: 'Reddit',
    id: 'u/tenzyudotcom',
    url: 'https://www.reddit.com/user/tenzyudotcom/',
    shortenUrl: 'reddit',
    icon: 'reddit',
    category: 'Social',
  },
  {
    name: 'osu!',
    id: '@tenzyu',
    url: 'https://osu.ppy.sh/users/23318599',
    shortenUrl: 'osu',
    icon: 'osu',
    category: 'Social',
  },
  {
    name: 'GitHub',
    id: '@tenzyu',
    url: 'https://github.com/tenzyu',
    shortenUrl: 'github',
    icon: 'github',
    category: 'Build',
  },
  {
    name: 'GitHub',
    id: '@tenzyulab',
    url: 'https://github.com/tenzyulab',
    shortenUrl: 'tenzyulab',
    icon: 'github',
    category: 'Build',
  },
  {
    name: 'X',
    id: '@tenzyudotcom',
    url: 'https://x.com/tenzyudotcom',
    shortenUrl: 'twitter',
    icon: 'x',
    category: 'Legacy',
  },
  {
    name: 'Reddit',
    id: 'tenzyuosu',
    url: 'https://www.reddit.com/user/tenzyuosu/',
    shortenUrl: 'reddit-old',
    icon: 'reddit',
    category: 'Legacy',
  },
  {
    name: 'Notion',
    id: 'osu! beatmaps for beginners',
    url: 'https://tenzyu.notion.site/107cca384d6780e0a504f5ee28d9dd94?v=6fc3622a159f4671a7635ebd2e32e5b1',
    shortenUrl: 'osuhistorical',
    icon: 'notion',
    category: 'Legacy',
  },
]
