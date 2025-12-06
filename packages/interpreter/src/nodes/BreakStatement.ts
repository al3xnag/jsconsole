import { BreakStatement } from 'acorn'
import { CallStack, Context, EvaluateGenerator, Scope } from '../types'
import { EMPTY, TYPE_BREAK } from '../constants'

// https://tc39.es/ecma262/#sec-break-statement
export function* evaluateBreakStatement(
  node: BreakStatement,
  _scope: Scope,
  _callStack: CallStack,
  _context: Context,
): EvaluateGenerator {
  return {
    type: TYPE_BREAK,
    label: node.label?.name,
    value: EMPTY,
  }
}
