import { ExpressionStatement } from 'acorn'
import { evaluateNode } from '.'
import { CallStack, Context, EvaluateGenerator, Scope } from '../types'

export function* evaluateExpressionStatement(
  node: ExpressionStatement,
  scope: Scope,
  callStack: CallStack,
  context: Context,
): EvaluateGenerator {
  node.expression.parent = node
  const evaluated = yield* evaluateNode(node.expression, scope, callStack, context)
  return evaluated
}
