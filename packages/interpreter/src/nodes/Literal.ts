import { Literal } from 'acorn'
import { Context, EvaluateGenerator, Scope } from '../types'

export function* evaluateLiteral(
  node: Literal,
  _scope: Scope,
  _context: Context,
): EvaluateGenerator {
  return { value: node.value }
}
