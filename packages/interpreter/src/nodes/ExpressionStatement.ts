import { ExpressionStatement } from 'acorn'
import { evaluateNode } from '.'
import { Context, EvaluateGenerator, Scope } from '../types'

export function* evaluateExpressionStatement(
  node: ExpressionStatement,
  scope: Scope,
  context: Context,
): EvaluateGenerator {
  node.expression.parent = node
  const evaluated = yield* evaluateNode(node.expression, scope, context)
  return evaluated
}
