import { MetaProperty } from 'acorn'
import { Context, EvaluateGenerator, Scope } from '../types'
import { findScope } from '../lib/scopes'
import { UnsupportedOperationError } from '../lib/UnsupportedOperationError'

export function* evaluateMetaProperty(
  node: MetaProperty,
  scope: Scope,
  context: Context,
): EvaluateGenerator {
  if (node.meta.name === 'new' && node.property.name === 'target') {
    const thisScope = findScope(scope, (scope) => !!scope.hasThisBinding)
    if (!thisScope || thisScope.kind !== 'function') {
      // Acorn catches this, so it shouldn't happen during the evaluation stage.
      throw new context.metadata.globals.SyntaxError('new.target expression is not allowed here')
    }

    return { value: thisScope.newTarget }
  }

  throw new UnsupportedOperationError('MetaProperty is not supported')
}
