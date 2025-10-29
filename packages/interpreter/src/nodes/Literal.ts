import { Literal } from 'acorn'
import { Context, EvaluateGenerator, Scope } from '../types'
import { requireGlobal } from '../lib/Metadata'

export function* evaluateLiteral(
  node: Literal,
  _scope: Scope,
  context: Context,
): EvaluateGenerator {
  if (node.value instanceof RegExp) {
    const _RegExp = requireGlobal(context.metadata.globals.RegExp, 'RegExp')
    return { value: _RegExp(node.value) }
  }

  return { value: node.value }
}
