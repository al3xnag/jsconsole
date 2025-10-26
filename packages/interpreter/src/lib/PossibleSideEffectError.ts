export class PossibleSideEffectError extends EvalError {
  constructor() {
    super('Possible side effect detected')
  }
}
