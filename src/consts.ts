// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = `tenzyu.com`;
export const SITE_DESCRIPTION = 'Scraps not worth posting on any platform';

export type MyLink = {
    title: string
    url: string
    shortenUrl: string
}

export const MY_LINKS: MyLink[]= [
    {
        title: 'osu - profile',
        url: 'https://osu.ppy.sh/u/tenzyu',
        shortenUrl: 'osu'
    },
    {
        title: 'osu - grip & area',
        url: 'https://x.com/tenzyuosu/status/1835714279963775408',
        shortenUrl: 'osusettings'
    },
    {
        title: 'osu - beatmaps for begginers',
        url: 'https://tenzyu.notion.site/107cca384d6780e0a504f5ee28d9dd94?v=6fc3622a159f4671a7635ebd2e32e5b1',
        shortenUrl: 'osuhistorical'
    },
    {
        title: 'Discord',
        url: 'https://discord.gg/vWEypRa86N',
        shortenUrl: 'discord'
    },
    {
        title: 'Twitch',
        url: 'https://www.twitch.tv/tenzyuosu',
        shortenUrl: 'twitch'
    },
    {
        title: 'YouTube',
        url: 'https://www.youtube.com/@tenzyuosu',
        shortenUrl: 'youtube'
    },
    {
        title: 'Donation',
        url: 'https://streamlabs.com/tenzyuosu/tip',
        shortenUrl: 'donation'
    },
    {
        title: 'Twitter',
        url: 'https://x.com/tenzyuosu',
        shortenUrl: 'twitter'
    },
    {
        title: 'Reddit',
        url: 'https://www.reddit.com/user/tenzyuosu/',
        shortenUrl: 'reddit'
    },
]
