import { FunctionExpression } from 'acorn'
import { createFunction } from '../lib/createFunction'
import { Context, EvaluatedNode, EvaluateGenerator, Scope } from '../types'
import { logEvaluated, logEvaluating } from '../lib/log'

export function* evaluateFunctionExpression(
  node: FunctionExpression,
  scope: Scope,
  context: Context,
): EvaluateGenerator {
  DEV: logEvaluating(node, context)

  const fn = createFunction(node, scope, context)

  const evaluated: EvaluatedNode = { value: fn }
  DEV: logEvaluated(evaluated, node, context)
  return yield evaluated
}
