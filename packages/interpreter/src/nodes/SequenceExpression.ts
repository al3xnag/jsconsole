import { SequenceExpression } from 'acorn'
import { evaluateNode } from '.'
import { Context, EvaluatedNode, EvaluateGenerator, Scope } from '../types'
import { logEvaluated, logEvaluating } from '../lib/log'

export function* evaluateSequenceExpression(
  node: SequenceExpression,
  scope: Scope,
  context: Context,
): EvaluateGenerator {
  DEV: logEvaluating(node, context)

  let evaluated: EvaluatedNode

  for (const child of node.expressions) {
    evaluated = yield* evaluateNode(child, scope, context)
  }

  DEV: logEvaluated(evaluated!, node, context)
  return yield evaluated!
}
