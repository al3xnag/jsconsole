import { SpreadElement } from 'acorn'
import { evaluateNode } from '.'
import { Context, EvaluateGenerator, Scope } from '../types'
import { assertObjectSpreadSideEffectFree } from '../lib/assertObjectSpreadSideEffectFree'
import { assertIterableSideEffectFree } from '../lib/assertIterableSideEffectFree'
import { syncContext } from '../lib/syncContext'

export function* evaluateSpreadElement(
  node: SpreadElement,
  scope: Scope,
  context: Context,
): EvaluateGenerator {
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
  return { value }
}
