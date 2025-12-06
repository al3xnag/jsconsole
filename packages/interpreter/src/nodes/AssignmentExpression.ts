import { AssignmentExpression, AssignmentOperator } from 'acorn'
import { evaluateNode } from '.'
import { setPropertyValue } from '../lib/setPropertyValue'
import { setVariableValue } from '../lib/setVariableValue'
import { CallStack, Context, EvaluatedNode, EvaluateGenerator, Scope } from '../types'
import { evaluateMemberExpression, evaluatePropertyReference } from './MemberExpression'
import { evaluatePattern } from './Pattern'
import { assertNever } from '../lib/assert'
import { InternalError } from '../lib/InternalError'

export function* evaluateAssignmentExpression(
  node: AssignmentExpression,
  scope: Scope,
  callStack: CallStack,
  context: Context,
): EvaluateGenerator {
  const { left, right, operator } = node
  left.parent = node
  right.parent = node

  let evaluated: EvaluatedNode

  function* evaluateRight() {
    const { value } = yield* evaluateNode(right, scope, callStack, context)
    return value
  }

  if (left.type === 'Identifier') {
    const leftValue =
      operator === '='
        ? undefined /* unused */
        : (yield* evaluateNode(left, scope, callStack, context)).value
    const value = yield* evaluateAssignmentValue(leftValue, operator, evaluateRight)
    setVariableValue(left.name, value, scope, context)
    evaluated = { value }
  } else if (left.type === 'MemberExpression') {
    const ref = yield* evaluatePropertyReference(left, scope, callStack, context)
    const leftValue =
      operator === '='
        ? undefined /* unused */
        : (yield* evaluateMemberExpression(left, scope, callStack, context, ref)).value
    const value = yield* evaluateAssignmentValue(leftValue, operator, evaluateRight)
    // https://tc39.es/ecma262/#sec-evaluate-property-access-with-expression-key
    // > NOTE: In most cases, ToPropertyKey will be performed on propertyNameValue immediately after this step.
    // > However, in the case of a[b] = c, it will not be performed until after evaluation of c.
    setPropertyValue(ref.object, ref.propertyName, ref.thisValue, value, context)
    evaluated = { value }
  } else {
    if (operator !== '=') {
      throw new InternalError(`Unexpected assignment operator ${operator} for ${left.type}`)
    }

    const rightValue = yield* evaluateRight()
    yield* evaluatePattern(left, rightValue, scope, callStack, context)
    evaluated = { value: rightValue }
  }

  return evaluated
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
