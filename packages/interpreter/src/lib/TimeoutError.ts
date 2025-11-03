import { InternalError } from './InternalError'

export class TimeoutError extends InternalError {
  name = 'TimeoutError'

  constructor() {
    super('Evaluation timed out')
  }
}
