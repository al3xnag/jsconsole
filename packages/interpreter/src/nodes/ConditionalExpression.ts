import { ConditionalExpression } from 'acorn'
import { Context, EvaluateGenerator, Scope } from '../types'
import { evaluateNode } from '.'
import { logEvaluated, logEvaluating } from '../lib/log'

// https://tc39.es/ecma262/#sec-conditional-operator
export function* evaluateConditionalExpression(
  node: ConditionalExpression,
  scope: Scope,
  context: Context,
): EvaluateGenerator {
  DEV: logEvaluating(node, context)

  const { test, consequent, alternate } = node
  test.parent = node
  consequent.parent = node
  alternate.parent = node

  const { value: testValue } = yield* evaluateNode(test, scope, context)
  const evaluated = testValue
    ? yield* evaluateNode(consequent, scope, context)
    : yield* evaluateNode(alternate, scope, context)

  DEV: logEvaluated(evaluated, node, context)
  return yield evaluated
}
