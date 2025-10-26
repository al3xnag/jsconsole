import { MetaProperty } from 'acorn'
import { Context, EvaluatedNode, EvaluateGenerator, Scope } from '../types'
import { findScope } from '../lib/scopes'
import { UnsupportedOperationError } from '../lib/UnsupportedOperationError'
import { logEvaluated, logEvaluating } from '../lib/log'

export function* evaluateMetaProperty(
  node: MetaProperty,
  scope: Scope,
  context: Context,
): EvaluateGenerator {
  DEV: logEvaluating(node, context)

  if (node.meta.name === 'new' && node.property.name === 'target') {
    const thisScope = findScope(scope, (scope) => !!scope.hasThisBinding)
    if (!thisScope || thisScope.kind !== 'function') {
      // Acorn catches this, so it shouldn't happen during the evaluation stage.
      throw new SyntaxError('new.target expression is not allowed here')
    }

    const evaluated: EvaluatedNode = { value: thisScope.newTarget }
    DEV: logEvaluated(evaluated, node, context)
    return yield evaluated
  }

  throw new UnsupportedOperationError('MetaProperty is not supported')
}
