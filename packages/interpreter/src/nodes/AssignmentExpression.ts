import { AssignmentExpression, AssignmentOperator } from 'acorn'
import { evaluateNode } from '.'
import { setPropertyValue } from '../lib/setPropertyValue'
import { setVariableValue } from '../lib/setVariableValue'
import { Context, EvaluatedNode, EvaluateGenerator, Scope } from '../types'
import { evaluateMemberExpression, evaluateMemberExpressionParts } from './MemberExpression'
import { evaluatePattern } from './Pattern'
import { assertNever } from '../lib/assert'
import { InternalError } from '../lib/InternalError'
import { logEvaluated, logEvaluating } from '../lib/log'

export function* evaluateAssignmentExpression(
  node: AssignmentExpression,
  scope: Scope,
  context: Context,
): EvaluateGenerator {
  DEV: logEvaluating(node, context)

  const { left, right, operator } = node
  left.parent = node
  right.parent = node

  let evaluated: EvaluatedNode

  function* evaluateRight() {
    const { value } = yield* evaluateNode(right, scope, context)
    return value
  }

  if (left.type === 'Identifier') {
    const leftValue =
      operator === '=' ? undefined /* unused */ : (yield* evaluateNode(left, scope, context)).value
    const value = yield* evaluateAssignmentValue(leftValue, operator, evaluateRight)
    setVariableValue(left.name, value, scope, context)
    evaluated = { value }
  } else if (left.type === 'MemberExpression') {
    const parts = yield* evaluateMemberExpressionParts(left, scope, context)
    const leftValue =
      operator === '='
        ? undefined /* unused */
        : (yield* evaluateMemberExpression(left, scope, context, parts)).value
    const value = yield* evaluateAssignmentValue(leftValue, operator, evaluateRight)
    setPropertyValue(parts.object, parts.propertyKey, value, context)
    evaluated = { value }
  } else {
    if (operator !== '=') {
      throw new InternalError(`Unexpected assignment operator ${operator} for ${left.type}`)
    }

    const rightValue = yield* evaluateRight()
    yield* evaluatePattern(left, rightValue, scope, context)
    evaluated = { value: rightValue }
  }

  DEV: logEvaluated(evaluated, node, context)
  return yield evaluated
}

function* evaluateAssignmentValue(
  left: any,
  operator: AssignmentOperator,
  right: () => Generator<EvaluatedNode, any, EvaluatedNode>,
) {
  switch (operator) {
    case '=':
      return yield* right()
    case '+=':
      return left + (yield* right())
    case '-=':
      return left - (yield* right())
    case '*=':
      return left * (yield* right())
    case '/=':
      return left / (yield* right())
    case '%=':
      return left % (yield* right())
    case '**=':
      return left ** (yield* right())
    case '<<=':
      return left << (yield* right())
    case '>>=':
      return left >> (yield* right())
    case '>>>=':
      return left >>> (yield* right())
    case '&=':
      return left & (yield* right())
    case '|=':
      return left | (yield* right())
    case '^=':
      return left ^ (yield* right())
    case '??=':
      return left ?? (yield* right())
    case '&&=':
      return left && (yield* right())
    case '||=':
      return left || (yield* right())
    default: {
      assertNever(operator, 'Invalid assignment operator')
    }
  }
}
