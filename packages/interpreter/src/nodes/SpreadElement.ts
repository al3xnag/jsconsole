import { SpreadElement } from 'acorn'
import { evaluateNode } from '.'
import { Context, EvaluatedNode, EvaluateGenerator, Scope } from '../types'
import { assertObjectSpreadSideEffectFree } from '../lib/assertObjectSpreadSideEffectFree'
import { assertIterableSideEffectFree } from '../lib/assertIterableSideEffectFree'
import { syncContext } from '../lib/syncContext'
import { logEvaluated, logEvaluating } from '../lib/log'

export function* evaluateSpreadElement(
  node: SpreadElement,
  scope: Scope,
  context: Context,
): EvaluateGenerator {
  DEV: logEvaluating(node, context)

  node.argument.parent = node
  const { value } = yield* evaluateNode(node.argument, scope, context)

  if (syncContext?.throwOnSideEffect) {
    if (node.parent!.type === 'ObjectExpression') {
      assertObjectSpreadSideEffectFree(value, context)
    } else {
      assertIterableSideEffectFree(value, context)
    }
  }

  // Return intermediate value, should be handled by parent node.
  const evaluated: EvaluatedNode = { value }
  DEV: logEvaluated(evaluated, node, context)
  return yield evaluated
}
