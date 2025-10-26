import { TryStatement } from 'acorn'
import { BlockScope, Context, EvaluatedNode, EvaluateGenerator, Scope } from '../types'
import { evaluateNode } from '.'
import { evaluatePattern } from './Pattern'
import { EMPTY, UNINITIALIZED, TYPE_RETURN } from '../constants'
import { getLeftHandPatternIdentifiers } from '../lib/bound-identifiers'

// https://tc39.es/ecma262/#sec-try-statement
export function* evaluateTryStatement(
  node: TryStatement,
  scope: Scope,
  context: Context,
): EvaluateGenerator {
  let result: EvaluatedNode

  const { block, handler, finalizer } = node
  block.parent = node
  if (handler) handler.parent = node
  if (finalizer) finalizer.parent = node

  try {
    result = yield* evaluateNode(block, scope, context)
  } catch (error) {
    if (handler) {
      const catchScope: BlockScope = {
        kind: 'block',
        parent: scope,
        bindings: new Map(),
        name: 'Catch',
      }

      if (handler.param) {
        const ids = getLeftHandPatternIdentifiers(handler.param)
        ids.forEach((id) => {
          catchScope.bindings.set(id.name, {
            value: UNINITIALIZED,
            kind: 'let',
          })
        })

        handler.param.parent = handler
        yield* evaluatePattern(handler.param, error, catchScope, context, { init: true })
      }

      handler.body.parent = handler
      result = yield* evaluateNode(handler.body, catchScope, context)
    } else {
      throw error
    }
  } finally {
    if (finalizer) {
      const finalizerResult = yield* evaluateNode(finalizer, scope, context)
      if (finalizerResult.type === TYPE_RETURN) {
        result = finalizerResult
      }
    }
  }

  if (result.value === EMPTY) {
    result.value = undefined
  }

  return result
}
