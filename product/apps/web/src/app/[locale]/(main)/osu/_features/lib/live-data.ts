export type LiveOsuData<T> =
  | { status: 'available'; data: T }
  | { status: 'unavailable' }

export async function loadLiveOsuData<T>(
  load: () => Promise<T>
): Promise<LiveOsuData<T>> {
  try {
    return { status: 'available', data: await load() }
  } catch {
    return { status: 'unavailable' }
  }
}
