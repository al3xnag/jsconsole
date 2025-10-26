import { ChainExpression } from 'acorn'
import { Context, EvaluateGenerator, Scope } from '../types'
import { evaluateNode } from '.'

export function* evaluateChainExpression(
  node: ChainExpression,
  scope: Scope,
  context: Context,
): EvaluateGenerator {
  node.expression.parent = node
  const evaluated = yield* evaluateNode(node.expression, scope, context)
  return evaluated
}
