export class InternalError extends EvalError {
  name = 'InternalError'

  constructor(message: string) {
    super(message)
  }
}
