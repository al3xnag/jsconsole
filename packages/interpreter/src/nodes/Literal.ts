import { Literal } from 'acorn'
import { CallStack, Context, EvaluateGenerator, Scope } from '../types'

export function* evaluateLiteral(
  node: Literal,
  _scope: Scope,
  _callStack: CallStack,
  context: Context,
): EvaluateGenerator {
  if (node.value instanceof RegExp) {
    return { value: context.metadata.globals.RegExp(node.value) }
  }

  return { value: node.value }
}
