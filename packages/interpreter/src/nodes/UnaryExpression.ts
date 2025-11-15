import { UnaryExpression } from 'acorn'
import { Context, EvaluatedNode, EvaluateGenerator, Scope } from '../types'
import { evaluateNode } from '.'
import { assertNever } from '../lib/assert'
import { getVariableValue } from '../lib/getVariableValue'
import { getIdentifier } from '../lib/getIdentifier'
import { evaluatePropertyReference } from './MemberExpression'
import { PossibleSideEffectError } from '../lib/PossibleSideEffectError'
import { syncContext } from '../lib/syncContext'
import { toShortStringTag } from '../lib/toShortStringTag'
import { isPropertyKey, toPropertyKey } from '../lib/evaluation-utils'

export function* evaluateUnaryExpression(
  node: UnaryExpression,
  scope: Scope,
  context: Context,
): EvaluateGenerator {
  const value = yield* _evaluateUnaryExpression(node, scope, context)
  return { value }
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
          throw new context.metadata.globals.SyntaxError(
            'Delete of an unqualified identifier in strict mode.',
          )
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
        const { object, propertyName } = yield* evaluatePropertyReference(arg, scope, context)

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
            throw new context.metadata.globals.TypeError(
              `Cannot delete property '${propertyKey.toString()}' of ${toShortStringTag(object)}`,
            )
          }

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
