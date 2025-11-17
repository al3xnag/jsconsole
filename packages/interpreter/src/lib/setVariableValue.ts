import { UNINITIALIZED } from '../constants'
import { Context, Scope } from '../types'
import { assertNever } from './assert'
import { findIdentifier } from './findIdentifier'
import { PossibleSideEffectError } from './PossibleSideEffectError'
import { setPropertyValue } from './setPropertyValue'
import { syncContext } from './syncContext'

export function setVariableValue(
  name: string,
  value: unknown,
  outerScope: Scope,
  context: Context,
  { init = false }: { init?: boolean } = {},
) {
  const { identifier, scope } = findIdentifier(name, outerScope)
  if (identifier) {
    if (!init) {
      if (identifier.kind === 'const') {
        throw new context.metadata.globals.TypeError(`Assignment to constant variable.`)
      }

      // `a = 1; let a;` // ReferenceError: Cannot access 'a' before initialization
      if (identifier.kind === 'let' && identifier.value === UNINITIALIZED) {
        throw new context.metadata.globals.ReferenceError(
          `Cannot access '${name}' before initialization`,
        )
      }
    }

    if (
      syncContext?.throwOnSideEffect &&
      (scope.kind === 'global' || scope.kind === 'module' || !syncContext.tmpRefs.has(scope))
    ) {
      throw new PossibleSideEffectError()
    }

    identifier.value = value
    return
  }

  if (context.type === 'script') {
    if (!init) {
      if (context.strict && !(name in context.globalObject)) {
        throw new context.metadata.globals.ReferenceError(`${name} is not defined`)
      }
    }

    setPropertyValue(context.globalObject, name, undefined, value, context)
  } else if (context.type === 'module') {
    throw new context.metadata.globals.ReferenceError(`${name} is not defined`)
  } else {
    assertNever(context.type, 'Unexpected context type')
  }
}
