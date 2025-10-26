import { ThrowStatement } from 'acorn'
import { Context, EvaluateGenerator, Scope } from '../types'
import { evaluateNode } from '.'

export function* evaluateThrowStatement(
  node: ThrowStatement,
  scope: Scope,
  context: Context,
): EvaluateGenerator {
  node.argument.parent = node
  const { value } = yield* evaluateNode(node.argument, scope, context)

  throw value
}
