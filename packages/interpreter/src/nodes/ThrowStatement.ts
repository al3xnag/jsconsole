import { ThrowStatement } from 'acorn'
import { Context, EvaluateGenerator, Scope } from '../types'
import { evaluateNode } from '.'
import { logEvaluating } from '../lib/log'

export function* evaluateThrowStatement(
  node: ThrowStatement,
  scope: Scope,
  context: Context,
): EvaluateGenerator {
  DEV: logEvaluating(node, context)

  node.argument.parent = node
  const { value } = yield* evaluateNode(node.argument, scope, context)

  throw yield value
}
