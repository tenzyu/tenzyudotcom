import { toast } from 'sonner'

import { AppError } from './types'

export const handleError = (error: unknown) => {
  console.error(error)

  if (error instanceof AppError) {
    toast.error(error.message)
    return
  }

  if (error instanceof Error) {
    toast.error(error.message)
    return
  }

  toast.error('予期せぬエラーが発生しました')
}

export const handleAPIError = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json()
    throw new AppError(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (error.message as string) || 'APIエラーが発生しました',
      'API_ERROR',
      response.status,
    )
  }
  return response
}
