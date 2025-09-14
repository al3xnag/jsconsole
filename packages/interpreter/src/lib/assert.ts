import { InternalError } from './InternalError'

export function assertNever(value: never, message: string): never {
  console.assert(false, '[assertNever]', message, value)
  throw new InternalError(message)
}
