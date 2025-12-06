import { ThrowStatement } from 'acorn'
import { CallStack, Context, EvaluateGenerator, Scope } from '../types'
import { evaluateNode } from '.'

export function* evaluateThrowStatement(
  node: ThrowStatement,
  scope: Scope,
  callStack: CallStack,
  context: Context,
): EvaluateGenerator {
  node.argument.parent = node
  const { value } = yield* evaluateNode(node.argument, scope, callStack, context)

  throw value
}
