import { AwaitExpression } from 'acorn'
import { Context, EvaluatedNode, EvaluateGenerator, Scope } from '../types'
import { evaluateNode } from '.'
import { TYPE_AWAIT } from '../constants'
import { PossibleSideEffectError } from '../lib/PossibleSideEffectError'
import { syncContext } from '../lib/syncContext'

export function* evaluateAwaitExpression(
  node: AwaitExpression,
  scope: Scope,
  context: Context,
): EvaluateGenerator {
  if (syncContext?.throwOnSideEffect) {
    throw new PossibleSideEffectError()
  }

  const { value } = yield* evaluateNode(node.argument, scope, context)
  const evaluated: EvaluatedNode = {
    type: TYPE_AWAIT,
    value,
  }

  return yield evaluated
}
