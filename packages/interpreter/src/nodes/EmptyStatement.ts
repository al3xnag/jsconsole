import { EmptyStatement } from 'acorn'
import { CallStack, Context, EvaluateGenerator, Scope } from '../types'
import { EMPTY } from '../constants'

export function* evaluateEmptyStatement(
  _node: EmptyStatement,
  _scope: Scope,
  _callStack: CallStack,
  _context: Context,
): EvaluateGenerator {
  return { value: EMPTY }
}
