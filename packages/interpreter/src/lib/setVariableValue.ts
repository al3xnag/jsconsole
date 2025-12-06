import { UNINITIALIZED } from '../constants'
import { Context, Scope } from '../types'
import { assertNever } from './assert'
import {
  REFERENCE_ERROR_VAR_IS_NOT_DEFINED,
  REFERENCE_ERROR_VAR_IS_UNINITIALIZED,
  TYPE_ERROR_VAR_ASSIGNMENT_TO_CONST,
} from './errorDefinitions'
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
        throw TYPE_ERROR_VAR_ASSIGNMENT_TO_CONST()
      }

      // `a = 1; let a;` // ReferenceError: Cannot access 'a' before initialization
      if (identifier.kind === 'let' && identifier.value === UNINITIALIZED) {
        throw REFERENCE_ERROR_VAR_IS_UNINITIALIZED(name)
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
        throw REFERENCE_ERROR_VAR_IS_NOT_DEFINED(name)
      }
    }

    setPropertyValue(context.globalObject, name, undefined, value, context)
  } else if (context.type === 'module') {
    throw REFERENCE_ERROR_VAR_IS_NOT_DEFINED(name)
  } else {
    assertNever(context.type, 'Unexpected context type')
  }
}
