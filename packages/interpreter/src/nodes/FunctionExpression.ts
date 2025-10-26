import { FunctionExpression } from 'acorn'
import { createFunction } from '../lib/createFunction'
import { Context, EvaluateGenerator, Scope } from '../types'

export function* evaluateFunctionExpression(
  node: FunctionExpression,
  scope: Scope,
  context: Context,
): EvaluateGenerator {
  const fn = createFunction(node, scope, context)
  return { value: fn }
}
