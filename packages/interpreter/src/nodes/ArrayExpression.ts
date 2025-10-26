import { ArrayExpression } from 'acorn'
import { evaluateNode } from '.'
import { Context, EvaluatedNode, EvaluateGenerator, Scope } from '../types'
import { syncContext } from '../lib/syncContext'

export function* evaluateArrayExpression(
  node: ArrayExpression,
  scope: Scope,
  context: Context,
): EvaluateGenerator {
  const array: unknown[] = []

  for (const element of node.elements) {
    if (element === null) {
      array.length++
      continue
    }

    element.parent = node
    const { value } = yield* evaluateNode(element, scope, context)

    if (element.type === 'SpreadElement') {
      const items = value as unknown[]
      array.push(...items)
    } else {
      array.push(value)
    }
  }

  syncContext?.tmpRefs.add(array)

  const evaluated: EvaluatedNode = { value: array }
  return evaluated
}
