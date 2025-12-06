import { FunctionExpression } from 'acorn'
import { createFunction } from '../lib/createFunction'
import { CallStack, Context, EvaluateGenerator, Scope } from '../types'

export function* evaluateFunctionExpression(
  node: FunctionExpression,
  scope: Scope,
  _callStack: CallStack,
  context: Context,
): EvaluateGenerator {
  const { fn } = createFunction(node, scope, context)
  return { value: fn }
}
