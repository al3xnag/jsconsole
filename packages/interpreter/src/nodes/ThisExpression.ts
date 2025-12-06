import { ThisExpression } from 'acorn'
import { CallStack, Context, EvaluateGenerator, Scope } from '../types'
import { findScope } from '../lib/scopes'
import { UNINITIALIZED } from '../constants'
import { REFERENCE_ERROR_CLASS_CTOR_MUST_CALL_SUPER } from '../lib/errorDefinitions'

// https://tc39.es/ecma262/multipage/ecmascript-language-expressions.html#sec-this-keyword
export function* evaluateThisExpression(
  _node: ThisExpression,
  scope: Scope,
  _callStack: CallStack,
  _context: Context,
): EvaluateGenerator {
  // Global scope always has this binding.
  const { thisValue } = findScope(scope, (scope) => !!scope.hasThisBinding)!
  if (thisValue === UNINITIALIZED) {
    throw REFERENCE_ERROR_CLASS_CTOR_MUST_CALL_SUPER()
  }

  return { value: thisValue }
}
