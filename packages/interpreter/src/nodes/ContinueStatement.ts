import { ContinueStatement } from 'acorn'
import { Context, EvaluatedNode, EvaluateGenerator, Scope } from '../types'
import { UnsupportedOperationError } from '../lib/UnsupportedOperationError'
import { EMPTY, TYPE_CONTINUE } from '../constants'
import { logEvaluated, logEvaluating } from '../lib/log'

export function* evaluateContinueStatement(
  node: ContinueStatement,
  _scope: Scope,
  context: Context,
): EvaluateGenerator {
  DEV: logEvaluating(node, context)

  if (node.label) {
    throw new UnsupportedOperationError('Labeled continue statements are not supported')
  }

  const evaluated: EvaluatedNode = {
    type: TYPE_CONTINUE,
    // @ts-expect-error: node.label is never
    label: node.label?.name,
    value: EMPTY,
  }

  DEV: logEvaluated(evaluated, node, context)
  return yield evaluated
}
