import { BinaryExpression, BinaryOperator } from 'acorn'
import { evaluateNode } from '.'
import { CallStack, Context, EvaluatedNode, EvaluateGenerator, Scope } from '../types'
import { UnsupportedOperationError } from '../lib/UnsupportedOperationError'
import { instanceofOperator, isObject, toPropertyKey } from '../lib/evaluation-utils'
import { TYPE_ERROR_CANNOT_USE_IN_IN_NON_OBJECT } from '../lib/errorDefinitions'

// https://tc39.es/ecma262/#prod-RelationalExpression
export function* evaluateBinaryExpression(
  node: BinaryExpression,
  scope: Scope,
  callStack: CallStack,
  context: Context,
): EvaluateGenerator {
  node.left.parent = node
  const { value: left } = yield* evaluateNode(node.left, scope, callStack, context)

  node.right.parent = node
  const { value: right } = yield* evaluateNode(node.right, scope, callStack, context)

  const evaluated: EvaluatedNode = {
    value: evaluateBinary(node.operator, left, right, context),
  }

  return evaluated
}

function evaluateBinary(operator: BinaryOperator, left: any, right: any, context: Context) {
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
    case 'in': {
      if (!isObject(right)) {
        throw TYPE_ERROR_CANNOT_USE_IN_IN_NON_OBJECT(left, right)
      }

      const propertyKey = toPropertyKey(left, context)
      return propertyKey in right
    }
    case 'instanceof':
      return instanceofOperator(left, right, context)
    default:
      throw new UnsupportedOperationError(`Unsupported binary operator: ${operator}`)
  }
}
