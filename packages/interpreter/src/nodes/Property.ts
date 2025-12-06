import { AssignmentProperty, Property } from 'acorn'
import { evaluateNode } from '.'
import { CallStack, Context, EvaluatedNode, Scope } from '../types'
import { InternalError } from '../lib/InternalError'

export type PropertyValue = {
  key: unknown
  value: unknown
}

// ({ x }); – `x` is a Property node.
// ({ x: 1 }); – `x: 1` is a Property node.
// var { prop } = obj; – `prop` is an AssignmentProperty node.
// { prop = 1 } = obj; – `prop = 1` is an AssignmentProperty node.
export function* evaluateProperty(
  node: Property | AssignmentProperty,
  scope: Scope,
  callStack: CallStack,
  context: Context,
): Generator<EvaluatedNode, PropertyValue, EvaluatedNode> {
  const key = yield* evaluatePropertyKey(node, scope, callStack, context)

  node.value.parent = node
  const { value } = yield* evaluateNode(node.value, scope, callStack, context)

  const propertyValue: PropertyValue = { key, value }
  return propertyValue
}

export function* evaluatePropertyKey(
  node: Property | AssignmentProperty,
  scope: Scope,
  callStack: CallStack,
  context: Context,
): Generator<EvaluatedNode, unknown, EvaluatedNode> {
  if (node.computed) {
    node.key.parent = node
    const { value } = yield* evaluateNode(node.key, scope, callStack, context)
    return value
  }

  if (node.key.type === 'Identifier') {
    return node.key.name
  }

  if (node.key.type === 'Literal') {
    return node.key.value
  }

  throw new InternalError(`Unsupported non-computed property key type: ${node.key.type}`)
}
