export type MyLink = {
  name: string
  id: string
  url: string
  shortenUrl: string
  icon: string
}

export const MY_LINKS: MyLink[] = [
  {
    name: 'osu!',
    id: '@tenzyu',
    url: 'https://osu.ppy.sh/users/23318599',
    shortenUrl: 'osu',
    icon: 'osu',
  },
  {
    name: 'Discord',
    id: 'server',
    url: 'https://discord.gg/vWEypRa86N',
    shortenUrl: 'discord',
    icon: 'discord',
  },
  {
    name: 'Twitch',
    id: '@tenzyudotcom',
    url: 'https://www.twitch.tv/tenzyudotcom',
    shortenUrl: 'twitch',
    icon: 'twitch',
  },
  {
    name: 'YouTube',
    id: '@tenzyudotcom',
    url: 'https://www.youtube.com/@tenzyudotcom',
    shortenUrl: 'youtube',
    icon: 'youtube',
  },
  {
    name: 'GitHub',
    id: '@tenzyu',
    url: 'https://github.com/tenzyu',
    shortenUrl: 'github',
    icon: 'github',
  },
  {
    name: 'Reddit',
    id: 'u/tenzyudotcom',
    url: 'https://www.reddit.com/user/tenzyudotcom/',
    shortenUrl: 'reddit',
    icon: 'reddit',
  },
  {
    name: 'X (Twitter)',
    id: '@FlawInAffection',
    url: 'https://x.com/FlawInAffection',
    shortenUrl: 'x',
    icon: 'x',
  },
  {
    name: 'Twitter (old)',
    id: '@tenzyudotcom',
    url: 'https://x.com/tenzyudotcom',
    shortenUrl: 'twitter',
    icon: 'x',
  },
  {
    name: 'Reddit (old)',
    id: 'tenzyuosu',
    url: 'https://www.reddit.com/user/tenzyuosu/',
    shortenUrl: 'reddit-old',
    icon: 'reddit',
  },
  {
    name: 'Notion (old)',
    id: 'osu! beatmaps for beginners',
    url: 'https://tenzyu.notion.site/107cca384d6780e0a504f5ee28d9dd94?v=6fc3622a159f4671a7635ebd2e32e5b1',
    shortenUrl: 'osuhistorical',
    icon: 'notion',
  },
]
