import { MemberExpression } from 'acorn'
import { evaluateNode } from '.'
import { UnsupportedOperationError } from '../lib/UnsupportedOperationError'
import { Context, EvaluatedNode, EvaluateGenerator, Scope } from '../types'
import { assertPropertyReadSideEffectFree } from '../lib/assertPropertyReadSideEffectFree'
import { syncContext } from '../lib/syncContext'
import { InternalError } from '../lib/InternalError'
import { toObject } from '../lib/evaluation-utils'
import { requireGlobal } from '../lib/Metadata'

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
  const { object, propertyKey } =
    preEvaluatedParts ?? (yield* evaluateMemberExpressionParts(node, scope, context))

  if (syncContext?.throwOnSideEffect) {
    assertPropertyReadSideEffectFree(object, propertyKey, context)
  }

  if (object == null && !node.optional) {
    const TypeError = requireGlobal(context.metadata.globals.TypeError, 'TypeError')
    throw new TypeError(`Cannot read properties of ${object} (reading '${propertyKey.toString()}')`)
  }

  const value =
    object == null && node.optional ? undefined : (toObject(object, context) as any)[propertyKey]

  return {
    value,
    base: object,
  }
}

export function* evaluateMemberExpressionParts(
  node: MemberExpression,
  scope: Scope,
  context: Context,
): Generator<EvaluatedNode, MemberExpressionParts, EvaluatedNode> {
  if (node.object.type === 'Super') {
    throw new UnsupportedOperationError('Super is not supported')
  }

  node.object.parent = node
  const { value: object } = yield* evaluateNode(node.object, scope, context)

  if (node.property.type === 'PrivateIdentifier') {
    throw new UnsupportedOperationError('PrivateIdentifier is not supported')
  }

  let propertyKey: PropertyKey
  if (!node.computed) {
    if (node.property.type === 'Identifier') {
      propertyKey = node.property.name
    } else {
      throw new InternalError('Unexpected property type: ' + node.property.type)
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
