import { ArrayExpression } from 'acorn'
import { evaluateNode } from '.'
import { CallStack, Context, EvaluateGenerator, Scope } from '../types'
import { syncContext } from '../lib/syncContext'
import { TYPE_ERROR_EXPR_IS_NOT_ITERABLE } from '../lib/errorDefinitions'

const create = Object.create
const defineProperties = Object.defineProperties

export function* evaluateArrayExpression(
  node: ArrayExpression,
  scope: Scope,
  callStack: CallStack,
  context: Context,
): EvaluateGenerator {
  let length = 0
  const props = create(null) as PropertyDescriptorMap

  for (let i = 0; i < node.elements.length; i++) {
    const element = node.elements[i]
    if (element === null) {
      length++
      continue
    }

    element.parent = node
    const { value } = yield* evaluateNode(element, scope, callStack, context)

    if (element.type === 'SpreadElement') {
      let items: unknown[]
      try {
        items = [...(value as unknown[])]
      } catch (error) {
        if (error instanceof TypeError) {
          throw TYPE_ERROR_EXPR_IS_NOT_ITERABLE(element.argument, context)
        }

        throw error
      }

      for (let j = 0; j < items.length; j++) {
        props[length++] = { value: items[j], enumerable: true, configurable: true, writable: true }
      }
    } else {
      props[length++] = { value, enumerable: true, configurable: true, writable: true }
    }
  }

  const array: unknown[] = context.metadata.globals.Array(length)
  defineProperties(array, props)

  syncContext?.tmpRefs.add(array)
  return { value: array }
}
