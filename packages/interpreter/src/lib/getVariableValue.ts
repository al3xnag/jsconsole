import { UNINITIALIZED } from '../constants'
import { Context, Scope } from '../types'
import { assertPropertyReadSideEffectFree } from './assertPropertyReadSideEffectFree'
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
      throw new context.metadata.globals.ReferenceError(
        `Cannot access '${name}' before initialization`,
      )
    }

    return value
  }

  if (!(name in context.globalObject)) {
    if (throwOnUndefined) {
      throw new context.metadata.globals.ReferenceError(`${name} is not defined`)
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
