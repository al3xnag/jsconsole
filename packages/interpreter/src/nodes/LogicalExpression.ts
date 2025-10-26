import { LogicalExpression, LogicalOperator } from 'acorn'
import { Context, EvaluatedNode, EvaluateGenerator, Scope } from '../types'
import { evaluateNode } from '.'
import { UnsupportedOperationError } from '../lib/UnsupportedOperationError'

export function* evaluateLogicalExpression(
  node: LogicalExpression,
  scope: Scope,
  context: Context,
): EvaluateGenerator {
  node.left.parent = node
  node.right.parent = node

  const { value: left } = yield* evaluateNode(node.left, scope, context)

  function* evaluateRight() {
    const { value } = yield* evaluateNode(node.right, scope, context)
    return value
  }

  const evaluated: EvaluatedNode = {
    value: yield* evaluateLogical(node.operator, left, evaluateRight),
  }

  return evaluated
}

function* evaluateLogical(
  operator: LogicalOperator,
  left: unknown,
  right: () => Generator<EvaluatedNode, any, EvaluatedNode>,
) {
  switch (operator) {
    case '&&':
      return left && (yield* right())
    case '||':
      return left || (yield* right())
    case '??':
      return left ?? (yield* right())
    default:
      throw new UnsupportedOperationError(`Unsupported logical operator: ${operator}`)
  }
}
