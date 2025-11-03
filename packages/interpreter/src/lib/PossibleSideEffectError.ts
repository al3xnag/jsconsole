import { InternalError } from './InternalError'

export class PossibleSideEffectError extends InternalError {
  name = 'PossibleSideEffectError'

  constructor() {
    super('Possible side effect detected')
  }
}
