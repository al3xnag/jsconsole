import { MemberExpression } from 'acorn'
import { evaluateNode } from '.'
import {
  Context,
  EvaluatedNode,
  EvaluateGenerator,
  PrivateName,
  PropertyReference,
  Scope,
} from '../types'
import { assertPropertyReadSideEffectFree } from '../lib/assertPropertyReadSideEffectFree'
import { syncContext } from '../lib/syncContext'
import { InternalError } from '../lib/InternalError'
import { isPropertyKey, toObject, toPropertyKey } from '../lib/evaluation-utils'
import { toShortStringTag } from '../lib/toShortStringTag'

// https://tc39.es/ecma262/#sec-property-accessors-runtime-semantics-evaluation
// https://tc39.es/ecma262/#sec-getvalue
// https://tc39.es/ecma262/#sec-optional-chains
export function* evaluateMemberExpression(
  node: MemberExpression,
  scope: Scope,
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
    propertyReference ?? (yield* evaluatePropertyReference(node, scope, context))
  const base = object

  if (object == null) {
    if (node.optional) {
      return { value: undefined, base, thisValue }
    }

    if (isPropertyKey(propertyName)) {
      throw new context.metadata.globals.TypeError(
        `Cannot read properties of ${object} (reading '${propertyName.toString()}')`,
      )
    } else if (propertyName instanceof PrivateName) {
      throw new context.metadata.globals.TypeError(
        `Cannot access private name #${propertyName.name} from ${object}`,
      )
    } else {
      throw new context.metadata.globals.TypeError(`Cannot read properties of ${object}`)
    }
  }

  object = toObject(object, context)

  // https://tc39.es/ecma262/#sec-privateget
  if (propertyName instanceof PrivateName) {
    const privateElement = context.metadata.privateElements.get(object)?.[propertyName.name]
    if (!privateElement) {
      throw new context.metadata.globals.TypeError(
        `Private member '#${propertyName.name}' is not declared in ${toShortStringTag(object)}`,
      )
    }

    if (privateElement.kind === 'field' || privateElement.kind === 'method') {
      return { value: privateElement.value, base, thisValue }
    }

    if (!privateElement.get) {
      throw new context.metadata.globals.TypeError(
        `'#${propertyName.name}' was defined without a getter`,
      )
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
  context: Context,
): Generator<EvaluatedNode, PropertyReference, EvaluatedNode> {
  node.object.parent = node
  const { value: object, thisValue } = yield* evaluateNode(node.object, scope, context)

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
    const evaluated = yield* evaluateNode(node.property, scope, context)
    propertyName = evaluated.value
  }

  return {
    object,
    propertyName,
    thisValue,
  }
}
