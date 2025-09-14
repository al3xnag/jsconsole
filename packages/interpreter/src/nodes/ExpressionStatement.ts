import { ExpressionStatement } from 'acorn'
import { evaluateNode } from '.'
import { Context, EvaluateGenerator, Scope } from '../types'
import { logEvaluated, logEvaluating } from '../lib/log'

export function* evaluateExpressionStatement(
  node: ExpressionStatement,
  scope: Scope,
  context: Context,
): EvaluateGenerator {
  DEV: logEvaluating(node, context)

  node.expression.parent = node
  const evaluated = yield* evaluateNode(node.expression, scope, context)

  DEV: logEvaluated(evaluated, node, context)
  return yield evaluated
}
