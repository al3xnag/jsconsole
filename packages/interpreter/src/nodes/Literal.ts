import { Literal } from 'acorn'
import { Context, EvaluateGenerator, Scope } from '../types'

export function* evaluateLiteral(
  node: Literal,
  _scope: Scope,
  context: Context,
): EvaluateGenerator {
  if (node.value instanceof RegExp) {
    return { value: context.metadata.globals.RegExp(node.value) }
  }

  return { value: node.value }
}
