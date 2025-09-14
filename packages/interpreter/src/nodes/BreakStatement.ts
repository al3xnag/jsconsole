import { BreakStatement } from 'acorn'
import { Context, EvaluatedNode, EvaluateGenerator, Scope } from '../types'
import { UnsupportedOperationError } from '../lib/UnsupportedOperationError'
import { EMPTY, TYPE_BREAK } from '../constants'
import { logEvaluated, logEvaluating } from '../lib/log'

// https://tc39.es/ecma262/#sec-break-statement
// { [[Type]]: break, [[Value]]: empty, [[Target]]: empty }
// { [[Type]]: break, [[Value]]: empty, [[Target]]: label }
export function* evaluateBreakStatement(
  node: BreakStatement,
  _scope: Scope,
  context: Context,
): EvaluateGenerator {
  DEV: logEvaluating(node, context)

  if (node.label) {
    throw new UnsupportedOperationError('Labeled break statements are not supported')
  }

  const evaluated: EvaluatedNode = {
    type: TYPE_BREAK,
    // @ts-expect-error: node.label is never
    label: node.label?.name,
    value: EMPTY,
  }

  DEV: logEvaluated(evaluated, node, context)
  return yield evaluated
}
