import { Context } from '../types'

export function throwError(error: unknown, context: Context): never {
  if (import.meta.env.DEV) {
    throw error
  }

  if (error instanceof TypeError) {
    throw new context.metadata.globals.TypeError(error.message)
  }

  if (error instanceof ReferenceError) {
    throw new context.metadata.globals.ReferenceError(error.message)
  }

  throw error
}
