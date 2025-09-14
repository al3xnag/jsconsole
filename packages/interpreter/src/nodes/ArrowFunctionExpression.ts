import { ArrowFunctionExpression } from 'acorn'
import { createFunction } from '../lib/createFunction'
import { Context, EvaluatedNode, EvaluateGenerator, Scope } from '../types'
import { logEvaluated, logEvaluating } from '../lib/log'

export function* evaluateArrowFunctionExpression(
  node: ArrowFunctionExpression,
  scope: Scope,
  context: Context,
): EvaluateGenerator {
  DEV: logEvaluating(node, context)

  const fn = createFunction(node, scope, context)
  const evaluated: EvaluatedNode = { value: fn }

  DEV: logEvaluated(evaluated, node, context)
  return yield evaluated
}
