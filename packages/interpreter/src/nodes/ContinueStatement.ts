import { ContinueStatement } from 'acorn'
import { CallStack, Context, EvaluatedNode, EvaluateGenerator, Scope } from '../types'
import { EMPTY, TYPE_CONTINUE } from '../constants'

// https://tc39.es/ecma262/#sec-continue-statement
export function* evaluateContinueStatement(
  node: ContinueStatement,
  _scope: Scope,
  _callStack: CallStack,
  _context: Context,
): EvaluateGenerator {
  const evaluated: EvaluatedNode = {
    type: TYPE_CONTINUE,
    label: node.label?.name,
    value: EMPTY,
  }

  return evaluated
}
