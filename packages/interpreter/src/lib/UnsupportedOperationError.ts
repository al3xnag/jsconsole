import { InternalError } from './InternalError'

export class UnsupportedOperationError extends InternalError {
  name = 'UnsupportedOperationError'

  constructor(message: string) {
    super(message)
  }
}
