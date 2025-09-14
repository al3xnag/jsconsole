import { ChainExpression } from 'acorn'
import { Context, EvaluateGenerator, Scope } from '../types'
import { evaluateNode } from '.'
import { logEvaluated, logEvaluating } from '../lib/log'

export function* evaluateChainExpression(
  node: ChainExpression,
  scope: Scope,
  context: Context,
): EvaluateGenerator {
  DEV: logEvaluating(node, context)

  node.expression.parent = node
  const evaluated = yield* evaluateNode(node.expression, scope, context)

  DEV: logEvaluated(evaluated, node, context)
  return yield evaluated
}
