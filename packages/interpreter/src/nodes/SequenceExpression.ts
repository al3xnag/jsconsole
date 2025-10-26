import { SequenceExpression } from 'acorn'
import { evaluateNode } from '.'
import { Context, EvaluatedNode, EvaluateGenerator, Scope } from '../types'

export function* evaluateSequenceExpression(
  node: SequenceExpression,
  scope: Scope,
  context: Context,
): EvaluateGenerator {
  let evaluated: EvaluatedNode

  for (const child of node.expressions) {
    evaluated = yield* evaluateNode(child, scope, context)
  }

  return evaluated!
}
