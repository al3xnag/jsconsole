import { Literal } from 'acorn'
import { Context, EvaluatedNode, EvaluateGenerator, Scope } from '../types'
import { logEvaluated, logEvaluating } from '../lib/log'

export function* evaluateLiteral(
  node: Literal,
  _scope: Scope,
  context: Context,
): EvaluateGenerator {
  DEV: logEvaluating(node, context)
  const evaluated: EvaluatedNode = { value: node.value }
  DEV: logEvaluated(evaluated, node, context)
  return yield evaluated
}
