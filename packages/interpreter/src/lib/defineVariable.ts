import { UNINITIALIZED } from '../constants'
import { Context, Scope } from '../types'
import { InternalError } from './InternalError'
import { PossibleSideEffectError } from './PossibleSideEffectError'
import { syncContext } from './syncContext'

const defineProperty = Object.defineProperty
const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor

const UNSET = Symbol()

export function defineVariable(
  kind: 'var' | 'let' | 'const',
  name: string,
  scope: Scope | null,
  context: Context,
  initialValue: unknown = UNSET,
): void {
  if (kind === 'var' && scope?.kind !== 'module') {
    if (scope) {
      if (scope.kind !== 'function') {
        throw new InternalError('var declarations must be in a function scope or global object')
      }

      // NOTE: acorn checks this itself.
      if (scope.bindings.has(name) && scope.bindings.get(name)!.kind !== 'var') {
        throw new context.metadata.globals.SyntaxError(
          `Identifier '${name}' has already been declared`,
        )
      }

      if (!scope.bindings.has(name) || initialValue !== UNSET) {
        const value = initialValue === UNSET ? undefined : initialValue
        scope.bindings.set(name, { value, kind: kind })
      }
    } else {
      if (!(name in context.globalObject) || initialValue !== UNSET) {
        if (syncContext?.throwOnSideEffect) {
          throw new PossibleSideEffectError()
        }

        const value = initialValue === UNSET ? undefined : initialValue
        // NOTE: `eval('var x = 1'); Object.getOwnPropertyDescriptor(window, 'x')` // { ..., configurable: true (!) }
        // https://github.com/tc39/proposal-redeclarable-global-eval-vars
        defineProperty(context.globalObject, name, {
          value,
          writable: true,
          enumerable: true,
          configurable: false,
        })
      }
    }
  } else {
    if (!scope) {
      throw new InternalError('let/const declarations must not be in a global object')
    }

    // NOTE: acorn checks this itself.
    if (scope.bindings.has(name)) {
      throw new context.metadata.globals.SyntaxError(
        `Identifier '${name}' has already been declared`,
      )
    }

    if (
      scope.kind === 'global' &&
      getOwnPropertyDescriptor(context.globalObject, name)?.configurable === false
    ) {
      throw new context.metadata.globals.SyntaxError(
        `Identifier '${name}' has already been declared`,
      )
    }

    if (syncContext?.throwOnSideEffect && (scope.kind === 'global' || scope.kind === 'module')) {
      throw new PossibleSideEffectError()
    }

    const value = initialValue === UNSET ? UNINITIALIZED : initialValue
    if (scope.kind === 'module' || scope.kind === 'function') {
      scope.bindings.set(name, { value, kind: kind })
    } else {
      if (kind === 'var') {
        throw new InternalError(`var declarations must not be in a ${scope.kind} scope`)
      }

      scope.bindings.set(name, { value, kind: kind })
    }
  }
}
