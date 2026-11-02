import { ZodError } from 'zod'

export function isEditorValidationError(error: unknown) {
  return error instanceof ZodError || error instanceof SyntaxError
}
