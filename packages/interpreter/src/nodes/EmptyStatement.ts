import { EmptyStatement } from 'acorn'
import { Context, EvaluateGenerator, Scope } from '../types'
import { EMPTY } from '../constants'

export function* evaluateEmptyStatement(
  _node: EmptyStatement,
  _scope: Scope,
  _context: Context,
): EvaluateGenerator {
  return yield { value: EMPTY }
}
