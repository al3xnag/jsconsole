import { MetaProperty } from 'acorn'
import { CallStack, Context, EvaluateGenerator, Scope } from '../types'
import { findScope } from '../lib/scopes'
import { UnsupportedOperationError } from '../lib/UnsupportedOperationError'
import { SYNTAX_ERROR_ILLEGAL_NEW_TARGET } from '../lib/errorDefinitions'

export function* evaluateMetaProperty(
  node: MetaProperty,
  scope: Scope,
  _callStack: CallStack,
  _context: Context,
): EvaluateGenerator {
  if (node.meta.name === 'new' && node.property.name === 'target') {
    const thisScope = findScope(scope, (scope) => !!scope.hasThisBinding)
    if (!thisScope || thisScope.kind !== 'function') {
      // Acorn catches this, so it shouldn't happen during the evaluation stage.
      throw SYNTAX_ERROR_ILLEGAL_NEW_TARGET()
    }

    return { value: thisScope.newTarget }
  }

  throw new UnsupportedOperationError('MetaProperty is not supported')
}
