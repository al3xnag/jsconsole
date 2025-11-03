import { UpdateExpression } from 'acorn'
import { Context, EvaluatedNode, EvaluateGenerator, Scope } from '../types'
import { assertNever } from '../lib/assert'
import { setVariableValue } from '../lib/setVariableValue'
import { getVariableValue } from '../lib/getVariableValue'
import { evaluateMemberExpression, evaluateMemberExpressionParts } from './MemberExpression'
import { setPropertyValue } from '../lib/setPropertyValue'

export function* evaluateUpdateExpression(
  node: UpdateExpression,
  scope: Scope,
  context: Context,
): EvaluateGenerator {
  const { argument, operator, prefix } = node
  argument.parent = node

  let getValue: () => Generator<EvaluatedNode, any, EvaluatedNode>
  let setValue: (value: unknown) => void

  if (argument.type === 'Identifier') {
    getValue = function* () {
      return getVariableValue(argument.name, scope, context, { throwOnUndefined: true })
    }
    setValue = (value: unknown) => {
      setVariableValue(argument.name, value, scope, context)
    }
  } else if (argument.type === 'MemberExpression') {
    const parts = yield* evaluateMemberExpressionParts(argument, scope, context)
    getValue = function* () {
      const { value } = yield* evaluateMemberExpression(argument, scope, context, parts)
      return value
    }
    setValue = (value: unknown) => {
      setPropertyValue(parts.object, parts.propertyKey, value, context)
    }
  } else {
    // Acorn should not allow this.
    throw new context.metadata.globals.SyntaxError(
      'Invalid left-hand side expression in postfix operation',
    )
  }

  const oldValue = yield* getValue()

  switch (operator) {
    case '++': {
      // Note: 1n + 1 // TypeError: Cannot mix BigInt and other types, use explicit conversions
      // Note: "a" + 1 // "a1", but var a = "a"; a++ // NaN
      let newValue = oldValue
      newValue++
      setValue(newValue)
      break
    }
    case '--': {
      let newValue = oldValue
      newValue--
      setValue(newValue)
      break
    }
    default: {
      assertNever(operator, 'Unhandled update operator')
    }
  }

  const resultValue = prefix ? yield* getValue() : oldValue
  return { value: resultValue }
}
