import { MemberExpression } from 'acorn'
import { evaluateNode } from '.'
import { InternalError } from '../lib/InternalError'
import { assertPropertyReadSideEffectFree } from '../lib/assertPropertyReadSideEffectFree'
import { isPropertyKey, toObject, toPropertyKey } from '../lib/evaluation-utils'
import { syncContext } from '../lib/syncContext'
import {
  CallStack,
  Context,
  EvaluatedNode,
  EvaluateGenerator,
  PrivateName,
  PropertyReference,
  Scope,
} from '../types'
import {
  TYPE_ERROR_CANNOT_ACCESS_PRIVATE_NAME,
  TYPE_ERROR_CANNOT_READ_PROPERTIES,
  TYPE_ERROR_CANNOT_READ_PROPERTY,
  TYPE_ERROR_PRIVATE_MEMBER_HAS_NO_GETTER,
  TYPE_ERROR_PRIVATE_MEMBER_NOT_DECLARED,
} from '../lib/errorDefinitions'

// https://tc39.es/ecma262/#sec-property-accessors-runtime-semantics-evaluation
// https://tc39.es/ecma262/#sec-getvalue
// https://tc39.es/ecma262/#sec-optional-chains
export function* evaluateMemberExpression(
  node: MemberExpression,
  scope: Scope,
  callStack: CallStack,
  context: Context,
  propertyReference?: PropertyReference,
): EvaluateGenerator {
  // NOTE:
  // In Chrome:
  //   - null['a'] // TypeError: Cannot read properties of null (reading 'a')
  //   - null[{ toString: 1 }] // TypeError: Cannot read properties of null
  //   - null?.[{ toString: 1 }] // undefined
  //   - Math[{ toString: 1 }] // TypeError: Cannot convert object to primitive value
  //   - null.#a // TypeError: Cannot access private name #a from null

  // eslint-disable-next-line prefer-const
  let { object, propertyName, thisValue } =
    propertyReference ?? (yield* evaluatePropertyReference(node, scope, callStack, context))
  const base = object

  if (object == null) {
    if (node.optional) {
      return { value: undefined, base, thisValue }
    }

    if (isPropertyKey(propertyName)) {
      throw TYPE_ERROR_CANNOT_READ_PROPERTY(object, propertyName)
    } else if (propertyName instanceof PrivateName) {
      throw TYPE_ERROR_CANNOT_ACCESS_PRIVATE_NAME(object, propertyName)
    } else {
      throw TYPE_ERROR_CANNOT_READ_PROPERTIES(object)
    }
  }

  object = toObject(object, context)

  // https://tc39.es/ecma262/#sec-privateget
  if (propertyName instanceof PrivateName) {
    const privateElement = context.metadata.privateElements.get(object)?.[propertyName.name]
    if (!privateElement) {
      throw TYPE_ERROR_PRIVATE_MEMBER_NOT_DECLARED(object, propertyName)
    }

    if (privateElement.kind === 'field' || privateElement.kind === 'method') {
      return { value: privateElement.value, base, thisValue }
    }

    if (!privateElement.get) {
      throw TYPE_ERROR_PRIVATE_MEMBER_HAS_NO_GETTER(propertyName)
    }

    return Reflect.apply(privateElement.get, object, [])
  }

  const propertyKey = isPropertyKey(propertyName)
    ? propertyName
    : toPropertyKey(propertyName, context)

  if (syncContext?.throwOnSideEffect) {
    assertPropertyReadSideEffectFree(object, propertyKey, context)
  }

  const receiver = thisValue !== undefined ? thisValue : object
  const value = Reflect.get(object, propertyKey, receiver)
  return { value, base, thisValue }
}

export function* evaluatePropertyReference(
  node: MemberExpression,
  scope: Scope,
  callStack: CallStack,
  context: Context,
): Generator<EvaluatedNode, PropertyReference, EvaluatedNode> {
  node.object.parent = node
  const { value: object, thisValue } = yield* evaluateNode(node.object, scope, callStack, context)

  let propertyName: PropertyKey | PrivateName | unknown

  if (node.property.type === 'PrivateIdentifier') {
    propertyName = new PrivateName(node.property.name)
  } else if (!node.computed) {
    if (node.property.type === 'Identifier') {
      propertyName = node.property.name
    } else {
      throw new InternalError('Unexpected property type: ' + node.property.type)
    }
  } else {
    node.property.parent = node
    const evaluated = yield* evaluateNode(node.property, scope, callStack, context)
    propertyName = evaluated.value
  }

  return {
    object,
    propertyName,
    thisValue,
  }
}
