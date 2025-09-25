import { BreakStatement } from 'acorn'
import { Context, EvaluatedNode, EvaluateGenerator, Scope } from '../types'
import { EMPTY, TYPE_BREAK } from '../constants'
import { logEvaluated, logEvaluating } from '../lib/log'

// https://tc39.es/ecma262/#sec-break-statement
export function* evaluateBreakStatement(
  node: BreakStatement,
  _scope: Scope,
  context: Context,
): EvaluateGenerator {
  DEV: logEvaluating(node, context)

  const evaluated: EvaluatedNode = {
    type: TYPE_BREAK,
    label: node.label?.name,
    value: EMPTY,
  }

  DEV: logEvaluated(evaluated, node, context)
  return yield evaluated
}
