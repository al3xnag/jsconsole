import { IfStatement } from 'acorn'
import { CallStack, Context, EvaluatedNode, EvaluateGenerator, Scope } from '../types'
import { evaluateNode } from '.'

export function* evaluateIfStatement(
  node: IfStatement,
  scope: Scope,
  callStack: CallStack,
  context: Context,
): EvaluateGenerator {
  node.test.parent = node
  const { value: condition } = yield* evaluateNode(node.test, scope, callStack, context)

  let evaluated: EvaluatedNode

  if (condition) {
    node.consequent.parent = node
    evaluated = yield* evaluateNode(node.consequent, scope, callStack, context)
  } else if (node.alternate) {
    node.alternate.parent = node
    evaluated = yield* evaluateNode(node.alternate, scope, callStack, context)
  } else {
    evaluated = { value: undefined }
  }

  return evaluated
}
