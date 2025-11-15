import { ClassExpression } from 'acorn'
import { Context, EvaluateGenerator, Scope } from '../types'
import { createClass } from '../lib/createClass'

export function* evaluateClassExpression(
  node: ClassExpression,
  scope: Scope,
  context: Context,
): EvaluateGenerator {
  const klass = yield* createClass(node, scope, context)
  return { value: klass }
}
