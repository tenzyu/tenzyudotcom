import { OsuAPIError } from './utils'

export type LiveOsuData<T> =
  | { status: 'available'; data: T }
  | { status: 'unavailable' }

export async function loadLiveOsuData<T>(
  load: () => Promise<T>,
): Promise<LiveOsuData<T>> {
  try {
    return { status: 'available', data: await load() }
  } catch (error) {
    if (
      error instanceof OsuAPIError &&
      error.code === 'OSU_API_CREDENTIALS_MISSING'
    ) {
      return { status: 'unavailable' }
    }
    throw error
  }
}
