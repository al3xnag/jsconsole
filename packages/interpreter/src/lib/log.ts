import { AnyNode } from 'acorn'
import { Context, EvaluatedNode } from '../types'
import { getNodeText } from './getNodeText'
import { EMPTY } from '../constants'

export function logEvaluating(node: AnyNode, context: Context) {
  if (!context.debug) {
    return
  }

  const nodeText = getNodeText(node, context.code)
  context.debug(`-> Evaluating: \`${nodeText}\` (${node.type})`)
}

export function logEvaluated(evaluated: EvaluatedNode | null, node: AnyNode, context: Context) {
  if (!context.debug) {
    return
  }

  const value = evaluated && evaluated.value !== EMPTY ? evaluated.value : '(no value)'
  return logEvaluatedValue(value, node, context)
}

export function logEvaluatedValue(value: unknown, node: AnyNode, context: Context) {
  if (!context.debug) {
    return
  }

  const nodeText = getNodeText(node, context.code)
  context.debug(`<- Evaluated: \`${nodeText}\` (${node.type}) ->`, value)
}
