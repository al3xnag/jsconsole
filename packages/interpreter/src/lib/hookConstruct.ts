import { CallExpression, NewExpression, Super } from 'acorn'
import { CallStack, CallStackLocation, Constructor, Context } from '../types'
import { rewriteErrorStack } from './errorStack'
import { WeakMapMetadata, WeakSetMetadata } from './Metadata'
import { getOrCreateSharedWeakRef } from './sharedWeakRefMap'
import { unbindFunctionCall } from './unbindFunctionCall'

export function hookConstructAfter(
  node: NewExpression | Super,
  ctor: Constructor,
  ctorArgs: unknown[],
  result: object,
  callStack: CallStack,
  context: Context,
): object {
  const [resolvedCtor, resolvedCtorArgs] = resolveCallee(ctor, ctorArgs, context)
  const resultRef = { value: result }

  weakMapHookHandler(resolvedCtor, resolvedCtorArgs, result, context)
  weakSetHookHandler(resolvedCtor, resolvedCtorArgs, result, context)
  proxyHookHandler(resolvedCtor, resolvedCtorArgs, result, context)
  errorHookHandler(resolvedCtor, result, node, callStack, context)

  return resultRef.value
}

// TODO: Reflect.construct(WeakMap, args)
// TODO: ? new new Proxy(WeakMap, {})
function resolveCallee(
  ctor: Constructor,
  ctorArgs: unknown[],
  context: Context,
): [resolvedCtor: Function, resolvedCtorArgs: unknown[]] {
  const [unboundCtor, _unboundCtorThis, unboundCtorArgs] = unbindFunctionCall(
    ctor,
    undefined,
    ctorArgs,
    context,
  )

  return [unboundCtor, unboundCtorArgs]
}

function weakMapHookHandler(
  ctor: Function /* WeakMap */,
  ctorArgs: unknown[] /* [entries?] */,
  result: object,
  context: Context,
) {
  if (
    ctor !== context.metadata.globals.WeakMap &&
    !Object.prototype.isPrototypeOf.call(context.metadata.globals.WeakMap, ctor)
  ) {
    return
  }

  if (!(result instanceof context.metadata.globals.WeakMap)) {
    return
  }

  const metadata: WeakMapMetadata = {
    entries: new Map(),
  }

  const entriesArg = ctorArgs[0]
  if (entriesArg != null && typeof entriesArg === 'object') {
    const entries = entriesArg as [WeakKey, unknown][]
    for (const [key, value] of entries) {
      const keyRef = getOrCreateSharedWeakRef(key, context)
      const valueRef =
        value !== null && typeof value === 'object'
          ? getOrCreateSharedWeakRef(value, context)
          : value
      metadata.entries.set(keyRef, valueRef)
    }
  }

  context.metadata.weakMaps.set(result, metadata)
}

function weakSetHookHandler(
  ctor: Function /* WeakSet */,
  ctorArgs: unknown[] /* [values?] */,
  result: object,
  context: Context,
) {
  if (
    ctor !== context.metadata.globals.WeakSet &&
    !Object.prototype.isPrototypeOf.call(context.metadata.globals.WeakSet, ctor)
  ) {
    return
  }

  if (!(result instanceof context.metadata.globals.WeakSet)) {
    return
  }

  const metadata: WeakSetMetadata = {
    values: new Set(),
  }

  const valuesArg = ctorArgs[0]
  if (valuesArg != null && typeof valuesArg === 'object') {
    const values = valuesArg as WeakKey[]
    for (const value of values) {
      const valueRef =
        value !== null && typeof value === 'object'
          ? getOrCreateSharedWeakRef(value, context)
          : value
      metadata.values.add(valueRef)
    }
  }

  context.metadata.weakSets.set(result, metadata)
}

function proxyHookHandler(
  ctor: Function /* Proxy */,
  ctorArgs: unknown[] /* [target, handler] */,
  result: object,
  context: Context,
) {
  if (ctor !== context.metadata.globals.Proxy) {
    return
  }

  const [target, handler] = ctorArgs as [object, ProxyHandler<object>]
  context.metadata.proxies.set(result, {
    target,
    handler,
  })
}

export function errorHookHandler(
  ctor: Function /* Error */,
  result: unknown,
  node: NewExpression | Super | CallExpression,
  callStack: CallStack,
  context: Context,
) {
  const isNativeErrorCtor =
    ctor === context.metadata.globals.Error ||
    ctor === context.metadata.globals.TypeError ||
    ctor === context.metadata.globals.ReferenceError ||
    ctor === context.metadata.globals.SyntaxError ||
    ctor === context.metadata.globals.RangeError ||
    ctor === context.metadata.globals.EvalError ||
    ctor === context.metadata.globals.URIError

  const isErrorCtor =
    isNativeErrorCtor || Object.prototype.isPrototypeOf.call(context.metadata.globals.Error, ctor)

  const isError = result instanceof context.metadata.globals.Error

  if (!isErrorCtor || !isError) {
    return
  }

  const errorLocation = getErrorLocation(node, context)

  rewriteErrorStack(
    result,
    errorLocation,
    callStack,
    context,
    isNativeErrorCtor ? undefined : 'unsafe',
  )
}

function getErrorLocation(
  node: NewExpression | Super | CallExpression,
  context: Context,
): CallStackLocation {
  const pos =
    node.type === 'CallExpression'
      ? node.callee.type === 'Identifier'
        ? node.callee.loc!.start
        : node.callee.loc!.end
      : node.type === 'Super'
        ? node.loc!.end
        : node.loc!.start
  return { file: context.name, line: pos.line, col: pos.column + 1 }
}
