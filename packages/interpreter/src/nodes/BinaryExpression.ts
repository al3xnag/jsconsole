import { BinaryExpression, BinaryOperator } from 'acorn'
import { evaluateNode } from '.'
import { Context, EvaluatedNode, EvaluateGenerator, Scope } from '../types'
import { UnsupportedOperationError } from '../lib/UnsupportedOperationError'
import { instanceofOperator, isObject, toPropertyKey } from '../lib/evaluation-utils'
import { toShortStringTag } from '../lib/toShortStringTag'

// https://tc39.es/ecma262/#prod-RelationalExpression
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
        throw new context.metadata.globals.TypeError(
          `Cannot use 'in' operator to search for '${toShortStringTag(left)}' in ${toShortStringTag(right)}`,
        )
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
