import { UpdateExpression } from 'acorn'
import { CallStack, Context, EvaluatedNode, EvaluateGenerator, Scope } from '../types'
import { assertNever } from '../lib/assert'
import { setVariableValue } from '../lib/setVariableValue'
import { getVariableValue } from '../lib/getVariableValue'
import { evaluateMemberExpression, evaluatePropertyReference } from './MemberExpression'
import { setPropertyValue } from '../lib/setPropertyValue'
import { SYNTAX_ERROR_INVALID_LEFT_HAND_SIDE } from '../lib/errorDefinitions'

export function* evaluateUpdateExpression(
  node: UpdateExpression,
  scope: Scope,
  callStack: CallStack,
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
    const ref = yield* evaluatePropertyReference(argument, scope, callStack, context)
    getValue = function* () {
      const { value } = yield* evaluateMemberExpression(argument, scope, callStack, context, ref)
      return value
    }
    setValue = (value: unknown) => {
      setPropertyValue(ref.object, ref.propertyName, ref.thisValue, value, context)
    }
  } else {
    // Acorn should not allow this.
    throw SYNTAX_ERROR_INVALID_LEFT_HAND_SIDE()
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
