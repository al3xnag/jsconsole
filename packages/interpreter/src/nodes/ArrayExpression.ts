import { ArrayExpression } from 'acorn'
import { evaluateNode } from '.'
import { Context, EvaluateGenerator, Scope } from '../types'
import { syncContext } from '../lib/syncContext'
import { requireGlobal } from '../lib/Metadata'

const create = Object.create
const defineProperties = Object.defineProperties

export function* evaluateArrayExpression(
  node: ArrayExpression,
  scope: Scope,
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
    const { value } = yield* evaluateNode(element, scope, context)

    if (element.type === 'SpreadElement') {
      const items = [...(value as unknown[])]
      for (let j = 0; j < items.length; j++) {
        props[length++] = { value: items[j], enumerable: true, configurable: true, writable: true }
      }
    } else {
      props[length++] = { value, enumerable: true, configurable: true, writable: true }
    }
  }

  const Array = requireGlobal(context.metadata.globals.Array, 'Array')

  const array: unknown[] = Array(length)
  defineProperties(array, props)

  syncContext?.tmpRefs.add(array)
  return { value: array }
}
