import { Super } from 'acorn'
import { Context, EvaluateGenerator, FunctionScope, Scope } from '../types'
import { InternalError } from '../lib/InternalError'
import { findScope } from '../lib/scopes'
import { initializeInstanceElements, isConstructor } from '../lib/evaluation-utils'
import { toShortStringTag } from '../lib/toShortStringTag'
import { UNINITIALIZED } from '../constants'
import { syncContext } from '../lib/syncContext'
import { assertFunctionConstructSideEffectFree } from '../lib/assertFunctionConstructSideEffectFree'

export function* evaluateSuper(node: Super, scope: Scope, context: Context): EvaluateGenerator {
  const parent = node.parent!
  if (parent.type === 'MemberExpression') {
    return yield* evaluateSuperProperty(node, scope, context)
  } else {
    throw new InternalError('Unexpected super evaluation, parent: ' + parent.type)
  }
}

export function* evaluateSuperCall(_node: Super, scope: Scope, context: Context, args: unknown[]) {
  const thisScope = findScope(
    scope,
    (scope) => scope.kind === 'function' && !!scope.hasThisBinding,
  ) as FunctionScope

  const func = Object.getPrototypeOf(thisScope.functionObject)

  if (!isConstructor(func, context)) {
    throw new context.metadata.globals.TypeError(`${toShortStringTag(func)} is not a constructor`)
  }

  if (syncContext?.throwOnSideEffect) {
    assertFunctionConstructSideEffectFree(func, args, context)
  }

  const result = Reflect.construct(func, args, thisScope.newTarget ?? func)

  if (thisScope.thisValue !== UNINITIALIZED) {
    throw new context.metadata.globals.ReferenceError('Super constructor may only be called once')
  }

  thisScope.thisValue = result

  yield* initializeInstanceElements(result, thisScope.functionObject, context)

  return result
}

export function* evaluateSuperProperty(
  _node: Super,
  scope: Scope,
  context: Context,
): EvaluateGenerator {
  const { thisValue, functionObject } = findScope(
    scope,
    (scope) => scope.kind === 'function' && !!scope.hasThisBinding,
  ) as FunctionScope

  if (thisValue === UNINITIALIZED) {
    throw new context.metadata.globals.ReferenceError(
      "Must call super constructor in derived class before accessing 'this' or returning from derived constructor",
    )
  }

  const homeObject = context.metadata.functions.get(functionObject)?.homeObject
  const value = homeObject !== undefined ? Object.getPrototypeOf(homeObject) : undefined
  return { value, thisValue }
}
