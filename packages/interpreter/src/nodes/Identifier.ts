import { Identifier } from 'acorn'
import { CallStack, Context, EvaluateGenerator, Scope } from '../types'
import { getVariableValue } from '../lib/getVariableValue'

export function* evaluateIdentifier(
  node: Identifier,
  scope: Scope,
  _callStack: CallStack,
  context: Context,
): EvaluateGenerator {
  const value = getVariableValue(node.name, scope, context, { throwOnUndefined: true })
  return { value }
}
