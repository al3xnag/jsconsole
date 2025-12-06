import { ClassExpression } from 'acorn'
import { CallStack, Context, EvaluateGenerator, Scope } from '../types'
import { createClass } from '../lib/createClass'

export function* evaluateClassExpression(
  node: ClassExpression,
  scope: Scope,
  callStack: CallStack,
  context: Context,
): EvaluateGenerator {
  const klass = yield* createClass(node, scope, callStack, context)
  return { value: klass }
}
