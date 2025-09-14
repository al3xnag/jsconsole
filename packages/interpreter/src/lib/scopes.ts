import { Scope } from '../types'

export function* iterateScopes(from: Scope) {
  while (true) {
    yield from
    if (from.parent) {
      from = from.parent
    } else {
      return
    }
  }
}

export function closestScope<T extends Scope['kind']>(
  from: Scope,
  kind: T,
): Extract<Scope, { kind: T }> | null {
  for (const scope of iterateScopes(from)) {
    if (scope.kind === kind) {
      return scope as Extract<Scope, { kind: T }>
    }
  }

  return null
}

export function findScope(from: Scope, predicate: (scope: Scope) => boolean): Scope | null {
  for (const scope of iterateScopes(from)) {
    if (predicate(scope)) {
      return scope
    }
  }

  return null
}
