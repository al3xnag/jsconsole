import { LogicalExpression, LogicalOperator } from 'acorn'
import { Context, EvaluatedNode, EvaluateGenerator, Scope } from '../types'
import { evaluateNode } from '.'
import { UnsupportedOperationError } from '../lib/UnsupportedOperationError'
import { logEvaluated, logEvaluating } from '../lib/log'

export function* evaluateLogicalExpression(
  node: LogicalExpression,
  scope: Scope,
  context: Context,
): EvaluateGenerator {
  DEV: logEvaluating(node, context)

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

  DEV: logEvaluated(evaluated, node, context)
  return yield evaluated
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
