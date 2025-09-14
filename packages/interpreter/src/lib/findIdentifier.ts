import { Scope } from '../types'
import { iterateScopes } from './scopes'

export function findIdentifier(name: string, scope: Scope) {
  const scopes = iterateScopes(scope)
  for (scope of scopes) {
    const identifier = scope.bindings.get(name)
    if (identifier) {
      return { identifier, scope }
    }
  }

  return {}
}
