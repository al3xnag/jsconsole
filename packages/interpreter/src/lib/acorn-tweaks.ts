import { Parser, getLineInfo } from 'acorn'

type AcornSyntaxError = SyntaxError & {
  pos: number
  loc: { line: number; column: number }
  raisedAt: number
}

const ParserPrototype = Parser.prototype as any

// Don't add position info to error message
// https://github.com/acornjs/acorn/blob/9e1243252a1f87d28f91c607b96f03d91ef3c16f/acorn/src/location.js#L12
ParserPrototype.raise = function (pos: number, message: string) {
  const loc = getLineInfo(this.input, pos)
  const err = new SyntaxError(message) as AcornSyntaxError
  err.pos = pos
  err.loc = loc
  err.raisedAt = this.pos
  throw err
}

ParserPrototype.raiseRecoverable = ParserPrototype.raise
