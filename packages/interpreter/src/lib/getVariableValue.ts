import { UNINITIALIZED } from '../constants'
import { Context, Scope } from '../types'
import { assertPropertyReadSideEffectFree } from './assertPropertyReadSideEffectFree'
import {
  REFERENCE_ERROR_VAR_IS_UNINITIALIZED,
  REFERENCE_ERROR_VAR_IS_NOT_DEFINED,
} from './errorDefinitions'
import { getIdentifier } from './getIdentifier'
import { syncContext } from './syncContext'

export function getVariableValue(
  name: string,
  scope: Scope,
  context: Context,
  { throwOnUndefined = true }: { throwOnUndefined: boolean },
) {
  const identifier = getIdentifier(name, scope)
  if (identifier) {
    const value = identifier.value
    if (value === UNINITIALIZED) {
      throw REFERENCE_ERROR_VAR_IS_UNINITIALIZED(name)
    }

    return value
  }

  if (!(name in context.globalObject)) {
    if (throwOnUndefined) {
      throw REFERENCE_ERROR_VAR_IS_NOT_DEFINED(name)
    } else {
      return undefined
    }
  }

  if (syncContext?.throwOnSideEffect) {
    assertPropertyReadSideEffectFree(context.globalObject, name, context)
  }

  const value = context.globalObject[name]
  return value
}
