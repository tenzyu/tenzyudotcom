export const PERSONAL_BEST_HISTORY_VIDEO_IDS = [
  'xpLVatdM_SA',
  'dAROJJlFYQY',
  'GhKEtFagPYE',
] as const

export const FEATURED_VIDEO_IDS = [
  '9TCExaK1ZVM',
  'ieKX5r1NRzo',
  'vykLwlk0NXg',
  'T7Eqmn0pXuQ',
  'c-G7vHbzb_M',
] as const

export type OsuProfileVideoId =
  | (typeof PERSONAL_BEST_HISTORY_VIDEO_IDS)[number]
  | (typeof FEATURED_VIDEO_IDS)[number]
