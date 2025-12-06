import { UnaryExpression } from 'acorn'
import { evaluateNode } from '.'
import { assertNever } from '../lib/assert'
import {
  SYNTAX_ERROR_DELETE_IDENTIFIER_IN_STRICT_MODE,
  TYPE_ERROR_CANNOT_DELETE_PROPERTY,
} from '../lib/errorDefinitions'
import { isPropertyKey, toPropertyKey } from '../lib/evaluation-utils'
import { getIdentifier } from '../lib/getIdentifier'
import { getVariableValue } from '../lib/getVariableValue'
import { PossibleSideEffectError } from '../lib/PossibleSideEffectError'
import { syncContext } from '../lib/syncContext'
import { CallStack, Context, EvaluatedNode, EvaluateGenerator, Scope } from '../types'
import { evaluatePropertyReference } from './MemberExpression'

export function* evaluateUnaryExpression(
  node: UnaryExpression,
  scope: Scope,
  callStack: CallStack,
  context: Context,
): EvaluateGenerator {
  const value = yield* _evaluateUnaryExpression(node, scope, callStack, context)
  return { value }
}

export function* _evaluateUnaryExpression(
  node: UnaryExpression,
  scope: Scope,
  callStack: CallStack,
  context: Context,
): Generator<EvaluatedNode, unknown, EvaluatedNode> {
  const { argument: arg, operator } = node
  switch (operator) {
    case '+': {
      const { value } = yield* evaluateNode(arg, scope, callStack, context)
      return +value
    }
    case '-': {
      const { value } = yield* evaluateNode(arg, scope, callStack, context)
      return -value
    }
    case '!': {
      const { value } = yield* evaluateNode(arg, scope, callStack, context)
      return !value
    }
    case '~': {
      const { value } = yield* evaluateNode(arg, scope, callStack, context)
      return ~value
    }
    case 'void': {
      const { value } = yield* evaluateNode(arg, scope, callStack, context)
      return void value
    }
    case 'typeof': {
      if (arg.type === 'Identifier') {
        const value = getVariableValue(arg.name, scope, context, { throwOnUndefined: false })
        return typeof value
      } else {
        const { value } = yield* evaluateNode(arg, scope, callStack, context)
        return typeof value
      }
    }
    case 'delete': {
      if (arg.type === 'Identifier') {
        if (context.strict) {
          // acorn checks this itself, and throws `new SyntaxError('Deleting local variable in strict mode')`.
          throw SYNTAX_ERROR_DELETE_IDENTIFIER_IN_STRICT_MODE()
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
        const { object, propertyName } = yield* evaluatePropertyReference(
          arg,
          scope,
          callStack,
          context,
        )

        if (syncContext?.throwOnSideEffect) {
          throw new PossibleSideEffectError()
        }

        // NOTE: "delete MemberExpression . PrivateIdentifier" is an early SyntaxError during Static Semantics.
        const propertyKey = isPropertyKey(propertyName)
          ? propertyName
          : toPropertyKey(propertyName, context)

        if (context.strict) {
          const value = Reflect.deleteProperty(object, propertyKey)
          if (!value) {
            throw TYPE_ERROR_CANNOT_DELETE_PROPERTY(object, propertyKey)
          }

          return value
        } else {
          const value = Reflect.deleteProperty(object, propertyKey)
          return value
        }
      } else {
        yield* evaluateNode(arg, scope, callStack, context)
        return true
      }
    }
    default: {
      assertNever(operator, `Unknown unary operator: ${operator}`)
    }
  }
}
