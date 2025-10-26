import { BinaryExpression, BinaryOperator } from 'acorn'
import { evaluateNode } from '.'
import { Context, EvaluatedNode, EvaluateGenerator, Scope } from '../types'
import { UnsupportedOperationError } from '../lib/UnsupportedOperationError'

export function* evaluateBinaryExpression(
  node: BinaryExpression,
  scope: Scope,
  context: Context,
): EvaluateGenerator {
  node.left.parent = node
  const { value: left } = yield* evaluateNode(node.left, scope, context)

  node.right.parent = node
  const { value: right } = yield* evaluateNode(node.right, scope, context)

  const evaluated: EvaluatedNode = {
    value: evaluateBinary(node.operator, left, right),
  }

  return evaluated
}

function evaluateBinary(operator: BinaryOperator, left: any, right: any) {
  switch (operator) {
    case '+':
      return left + right
    case '-':
      return left - right
    case '*':
      return left * right
    case '/':
      return left / right
    case '%':
      return left % right
    case '**':
      return left ** right
    case '==':
      return left == right
    case '===':
      return left === right
    case '!=':
      return left != right
    case '!==':
      return left !== right
    case '<':
      return left < right
    case '<=':
      return left <= right
    case '>':
      return left > right
    case '>=':
      return left >= right
    case '&':
      return left & right
    case '|':
      return left | right
    case '^':
      return left ^ right
    case '<<':
      return left << right
    case '>>':
      return left >> right
    case '>>>':
      return left >>> right
    case 'in':
      return left in right
    case 'instanceof':
      return left instanceof right
    default:
      throw new UnsupportedOperationError(`Unsupported binary operator: ${operator}`)
  }
}
