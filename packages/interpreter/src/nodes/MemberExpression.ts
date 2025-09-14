import { MemberExpression } from 'acorn'
import { evaluateNode } from '.'
import { UnsupportedOperationError } from '../lib/UnsupportedOperationError'
import { Context, EvaluatedNode, EvaluateGenerator, Scope } from '../types'
import { assertPropertyReadSideEffectFree } from '../lib/assertPropertyReadSideEffectFree'
import { syncContext } from '../lib/syncContext'
import { logEvaluated, logEvaluating } from '../lib/log'

type MemberExpressionParts = {
  object: any
  propertyKey: PropertyKey
}

export function* evaluateMemberExpression(
  node: MemberExpression,
  scope: Scope,
  context: Context,
  preEvaluatedParts?: MemberExpressionParts,
): EvaluateGenerator {
  DEV: logEvaluating(node, context)

  const { object, propertyKey } =
    preEvaluatedParts ?? (yield* evaluateMemberExpressionParts(node, scope, context))

  if (syncContext?.throwOnSideEffect) {
    assertPropertyReadSideEffectFree(object, propertyKey, context)
  }

  const value = node.optional ? object?.[propertyKey] : object[propertyKey]

  const evaluated: EvaluatedNode = {
    value,
    base: object,
  }

  DEV: logEvaluated(evaluated, node, context)
  return yield evaluated
}

export function* evaluateMemberExpressionParts(
  node: MemberExpression,
  scope: Scope,
  context: Context,
): Generator<EvaluatedNode, MemberExpressionParts, EvaluatedNode> {
  if (node.object.type === 'Super') {
    throw new UnsupportedOperationError()
  }

  node.object.parent = node
  const { value: object } = yield* evaluateNode(node.object, scope, context)

  if (node.property.type === 'PrivateIdentifier') {
    throw new UnsupportedOperationError()
  }

  let propertyKey: PropertyKey
  if (!node.computed) {
    if (node.property.type === 'Identifier') {
      propertyKey = node.property.name
    } else {
      throw new UnsupportedOperationError()
    }
  } else {
    node.property.parent = node
    const evaluated = yield* evaluateNode(node.property, scope, context)
    propertyKey = evaluated.value
  }

  return {
    object,
    propertyKey,
  }
}
