import { Identifier } from 'acorn'
import { Context, EvaluateGenerator, Scope } from '../types'
import { getVariableValue } from '../lib/getVariableValue'

export function* evaluateIdentifier(
  node: Identifier,
  scope: Scope,
  context: Context,
): EvaluateGenerator {
  const value = getVariableValue(node.name, scope, context, { throwOnUndefined: true })
  return { value }
}
