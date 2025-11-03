import { ThisExpression } from 'acorn'
import { Context, EvaluateGenerator, Scope } from '../types'
import { findScope } from '../lib/scopes'
import { UNINITIALIZED } from '../constants'

// https://tc39.es/ecma262/multipage/ecmascript-language-expressions.html#sec-this-keyword
export function* evaluateThisExpression(
  _node: ThisExpression,
  scope: Scope,
  context: Context,
): EvaluateGenerator {
  // Global scope always has this binding.
  const { thisValue } = findScope(scope, (scope) => !!scope.hasThisBinding)!
  if (thisValue === UNINITIALIZED) {
    throw new context.metadata.globals.ReferenceError(
      "Must call super constructor in derived class before accessing 'this' or returning from derived constructor",
    )
  }

  return { value: thisValue }
}
