import { InternalError } from './InternalError'

export class UnsupportedOperationError extends InternalError {
  name = 'UnsupportedOperationError'

  static assert(condition: boolean): asserts condition {
    if (!condition) {
      throw new UnsupportedOperationError()
    }
  }
}
