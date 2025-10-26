import { IfStatement } from 'acorn'
import { Context, EvaluatedNode, EvaluateGenerator, Scope } from '../types'
import { evaluateNode } from '.'

export function* evaluateIfStatement(
  node: IfStatement,
  scope: Scope,
  context: Context,
): EvaluateGenerator {
  node.test.parent = node
  const { value: condition } = yield* evaluateNode(node.test, scope, context)

  let evaluated: EvaluatedNode

  if (condition) {
    node.consequent.parent = node
    evaluated = yield* evaluateNode(node.consequent, scope, context)
  } else if (node.alternate) {
    node.alternate.parent = node
    evaluated = yield* evaluateNode(node.alternate, scope, context)
  } else {
    evaluated = { value: undefined }
  }

  return evaluated
}
