export class PossibleSideEffectError extends Error {
  constructor() {
    super('Possible side effect detected')
  }
}
