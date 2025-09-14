import { Identifier } from 'acorn'
import { Context, EvaluatedNode, EvaluateGenerator, Scope } from '../types'
import { getVariableValue } from '../lib/getVariableValue'
import { logEvaluated, logEvaluating } from '../lib/log'

export function* evaluateIdentifier(
  node: Identifier,
  scope: Scope,
  context: Context,
): EvaluateGenerator {
  DEV: logEvaluating(node, context)

  const value = getVariableValue(node.name, scope, context, { throwOnUndefined: true })

  const evaluated: EvaluatedNode = { value }
  DEV: logEvaluated(evaluated, node, context)
  return yield evaluated
}
