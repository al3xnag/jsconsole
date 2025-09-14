import { UnaryExpression } from 'acorn'
import { Context, EvaluatedNode, EvaluateGenerator, Scope } from '../types'
import { evaluateNode } from '.'
import { assertNever } from '../lib/assert'
import { getVariableValue } from '../lib/getVariableValue'
import { getIdentifier } from '../lib/getIdentifier'
import { evaluateMemberExpressionParts } from './MemberExpression'
import { PossibleSideEffectError } from '../lib/PossibleSideEffectError'
import { syncContext } from '../lib/syncContext'
import { logEvaluated, logEvaluating } from '../lib/log'

export function* evaluateUnaryExpression(
  node: UnaryExpression,
  scope: Scope,
  context: Context,
): EvaluateGenerator {
  DEV: logEvaluating(node, context)

  const value = yield* _evaluateUnaryExpression(node, scope, context)

  const evaluated: EvaluatedNode = { value }
  DEV: logEvaluated(evaluated, node, context)
  return yield evaluated
}

export function* _evaluateUnaryExpression(
  node: UnaryExpression,
  scope: Scope,
  context: Context,
): Generator<EvaluatedNode, unknown, EvaluatedNode> {
  const { argument: arg, operator } = node
  switch (operator) {
    case '+': {
      const { value } = yield* evaluateNode(arg, scope, context)
      return +value
    }
    case '-': {
      const { value } = yield* evaluateNode(arg, scope, context)
      return -value
    }
    case '!': {
      const { value } = yield* evaluateNode(arg, scope, context)
      return !value
    }
    case '~': {
      const { value } = yield* evaluateNode(arg, scope, context)
      return ~value
    }
    case 'void': {
      const { value } = yield* evaluateNode(arg, scope, context)
      return void value
    }
    case 'typeof': {
      if (arg.type === 'Identifier') {
        const value = getVariableValue(arg.name, scope, context, { throwOnUndefined: false })
        return typeof value
      } else {
        const { value } = yield* evaluateNode(arg, scope, context)
        return typeof value
      }
    }
    case 'delete': {
      if (arg.type === 'Identifier') {
        if (context.strict) {
          // acorn checks this itself, and throws `new SyntaxError('Deleting local variable in strict mode')`.
          throw new SyntaxError('Delete of an unqualified identifier in strict mode.')
        } else {
          const identifier = getIdentifier(arg.name, scope)
          if (identifier) {
            return false
          }

          if (syncContext?.throwOnSideEffect) {
            throw new PossibleSideEffectError()
          }

          const value = Reflect.deleteProperty(context.globalObject, arg.name)
          return value
        }
      } else if (arg.type === 'MemberExpression') {
        const { object, propertyKey } = yield* evaluateMemberExpressionParts(arg, scope, context)

        if (syncContext?.throwOnSideEffect) {
          throw new PossibleSideEffectError()
        }

        if (context.strict) {
          const value = delete object[propertyKey]
          return value
        } else {
          const value = Reflect.deleteProperty(object, propertyKey)
          return value
        }
      } else {
        yield* evaluateNode(arg, scope, context)
        return true
      }
    }
    default: {
      assertNever(operator, `Unknown unary operator: ${operator}`)
    }
  }
}
