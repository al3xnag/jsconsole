import { UNINITIALIZED } from '../constants'
import { Context, Scope } from '../types'
import { assertNever } from './assert'
import { findIdentifier } from './findIdentifier'
import { requireGlobal } from './Metadata'
import { PossibleSideEffectError } from './PossibleSideEffectError'
import { syncContext } from './syncContext'

const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor

export function setVariableValue(
  name: string,
  value: unknown,
  outerScope: Scope,
  context: Context,
  { init = false }: { init?: boolean } = {},
) {
  const ReferenceError = requireGlobal(context.metadata.globals.ReferenceError, 'ReferenceError')
  const TypeError = requireGlobal(context.metadata.globals.TypeError, 'TypeError')

  const { identifier, scope } = findIdentifier(name, outerScope)
  if (identifier) {
    if (!init) {
      if (identifier.kind === 'const') {
        throw new TypeError(`Assignment to constant variable.`)
      }

      if (identifier.kind === 'let' && identifier.value === UNINITIALIZED) {
        throw new ReferenceError(`Cannot access '${name}' before initialization`)
      }
    }

    if (syncContext?.throwOnSideEffect && (scope.kind === 'global' || scope.kind === 'module')) {
      throw new PossibleSideEffectError()
    }

    identifier.value = value
    return
  }

  if (context.type === 'script') {
    if (!init) {
      if (context.strict && !(name in context.globalObject)) {
        throw new ReferenceError(`${name} is not defined`)
      }
    }

    if (!context.strict) {
      const descriptor = getOwnPropertyDescriptor(context.globalObject, name)
      if (descriptor && !descriptor.writable && !descriptor.set) {
        return
      }
    }

    if (syncContext?.throwOnSideEffect) {
      throw new PossibleSideEffectError()
    }

    context.globalObject[name] = value
  } else if (context.type === 'module') {
    throw new ReferenceError(`${name} is not defined`)
  } else {
    assertNever(context.type, 'Unexpected context type')
  }
}
