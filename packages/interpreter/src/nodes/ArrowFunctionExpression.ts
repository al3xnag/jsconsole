import { ArrowFunctionExpression } from 'acorn'
import { createFunction } from '../lib/createFunction'
import { CallStack, Context, EvaluatedNode, EvaluateGenerator, Scope } from '../types'

export function* evaluateArrowFunctionExpression(
  node: ArrowFunctionExpression,
  scope: Scope,
  _callStack: CallStack,
  context: Context,
): EvaluateGenerator {
  const { fn } = createFunction(node, scope, context)
  const evaluated: EvaluatedNode = { value: fn }
  return evaluated
}
