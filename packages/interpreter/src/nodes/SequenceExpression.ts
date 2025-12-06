import { SequenceExpression } from 'acorn'
import { evaluateNode } from '.'
import { CallStack, Context, EvaluatedNode, EvaluateGenerator, Scope } from '../types'

export function* evaluateSequenceExpression(
  node: SequenceExpression,
  scope: Scope,
  callStack: CallStack,
  context: Context,
): EvaluateGenerator {
  let evaluated: EvaluatedNode

  for (const child of node.expressions) {
    evaluated = yield* evaluateNode(child, scope, callStack, context)
  }

  return evaluated!
}
