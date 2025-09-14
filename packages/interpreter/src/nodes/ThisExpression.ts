import { ThisExpression } from 'acorn'
import { Context, EvaluatedNode, EvaluateGenerator, Scope } from '../types'
import { findScope } from '../lib/scopes'
import { UNINITIALIZED } from '../constants'
import { logEvaluated, logEvaluating } from '../lib/log'

// https://tc39.es/ecma262/multipage/ecmascript-language-expressions.html#sec-this-keyword
export function* evaluateThisExpression(
  node: ThisExpression,
  scope: Scope,
  context: Context,
): EvaluateGenerator {
  DEV: logEvaluating(node, context)

  // Global scope always has this binding.
  const { thisValue } = findScope(scope, (scope) => !!scope.hasThisBinding)!
  if (thisValue === UNINITIALIZED) {
    throw new ReferenceError(
      "Must call super constructor in derived class before accessing 'this' or returning from derived constructor",
    )
  }

  const evaluated: EvaluatedNode = { value: thisValue }
  DEV: logEvaluated(evaluated, node, context)
  return yield evaluated
}
