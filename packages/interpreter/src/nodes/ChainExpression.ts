import { ChainExpression } from 'acorn'
import { CallStack, Context, EvaluateGenerator, Scope } from '../types'
import { evaluateNode } from '.'

export function* evaluateChainExpression(
  node: ChainExpression,
  scope: Scope,
  callStack: CallStack,
  context: Context,
): EvaluateGenerator {
  node.expression.parent = node
  const evaluated = yield* evaluateNode(node.expression, scope, callStack, context)
  return evaluated
}
