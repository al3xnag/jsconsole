import { ConditionalExpression } from 'acorn'
import { CallStack, Context, EvaluateGenerator, Scope } from '../types'
import { evaluateNode } from '.'

// https://tc39.es/ecma262/#sec-conditional-operator
export function* evaluateConditionalExpression(
  node: ConditionalExpression,
  scope: Scope,
  callStack: CallStack,
  context: Context,
): EvaluateGenerator {
  const { test, consequent, alternate } = node
  test.parent = node
  consequent.parent = node
  alternate.parent = node

  const { value: testValue } = yield* evaluateNode(test, scope, callStack, context)
  const evaluated = testValue
    ? yield* evaluateNode(consequent, scope, callStack, context)
    : yield* evaluateNode(alternate, scope, callStack, context)

  return evaluated
}
