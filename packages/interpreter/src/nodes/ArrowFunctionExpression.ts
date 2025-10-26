import { ArrowFunctionExpression } from 'acorn'
import { createFunction } from '../lib/createFunction'
import { Context, EvaluatedNode, EvaluateGenerator, Scope } from '../types'

export function* evaluateArrowFunctionExpression(
  node: ArrowFunctionExpression,
  scope: Scope,
  context: Context,
): EvaluateGenerator {
  const fn = createFunction(node, scope, context)
  const evaluated: EvaluatedNode = { value: fn }
  return evaluated
}
