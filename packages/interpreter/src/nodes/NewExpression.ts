import { NewExpression } from 'acorn'
import { evaluateNode } from '.'
import { type WeakMapMetadata, type WeakSetMetadata } from '../lib/Metadata'
import { isConstructor } from '../lib/evaluation-utils'
import { getNodeText } from '../lib/getNodeText'
import { getOrCreateSharedWeakRef } from '../lib/sharedWeakRefMap'
import { syncContext } from '../lib/syncContext'
import { unbindFunctionCall } from '../lib/unbindFunctionCall'
import { Context, EvaluateGenerator, Scope } from '../types'
import { SIDE_EFFECT_CONSTRUCT_FREE } from '../lib/SideEffectInfo'
import { assertFunctionConstructSideEffectFree } from '../lib/assertFunctionConstructSideEffectFree'
import { hasFlag } from '../lib/bitwiseFlags'

// https://tc39.es/ecma262/#sec-new-operator
export function* evaluateNewExpression(
  node: NewExpression,
  scope: Scope,
  context: Context,
): EvaluateGenerator {
  const { value: callee } = yield* evaluateNode(node.callee, scope, context)

  const args: unknown[] = []
  for (const arg of node.arguments) {
    arg.parent = node
    const { value } = yield* evaluateNode(arg, scope, context)

    if (arg.type === 'SpreadElement') {
      let items: unknown[]
      try {
        items = [...(value as unknown[])]
      } catch (error) {
        if (error instanceof TypeError) {
          throw new context.metadata.globals.TypeError(
            `${getNodeText(arg.argument, context.code)} is not iterable`,
          )
        }

        throw error
      }

      args.push(...items)
    } else {
      args.push(value)
    }
  }

  if (!isConstructor(callee, context)) {
    const calleeStr = getNodeText(node.callee, context.code)
    throw new context.metadata.globals.TypeError(`${calleeStr} is not a constructor`)
  }

  if (syncContext?.throwOnSideEffect) {
    assertFunctionConstructSideEffectFree(callee, args, context)
  }

  // NOTE: instance is always an object, even if constructor returns primitive value.
  // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/new#description for details.
  const instance: object = new callee(...args)
  const instanceRef = { value: instance }

  try {
    const hookConstructor = buildConstructorHook(callee, args, instanceRef, context)
    hookConstructor(context.metadata.globals.WeakMap, weakMapHookHandler)
    hookConstructor(context.metadata.globals.WeakSet, weakSetHookHandler)
    hookConstructor(context.metadata.globals.Proxy, proxyHookHandler)
  } catch (error) {
    console.warn('Failed to hook constructor call', error)
  }

  // NOTE: In constructor we can return any existing object: class A { constructor() { return Number } }
  if (!context.metadata.functions.has(callee)) {
    const sideEffectFlags = context.sideEffectInfo.functions.get(callee)
    if (sideEffectFlags !== undefined && hasFlag(sideEffectFlags, SIDE_EFFECT_CONSTRUCT_FREE)) {
      syncContext?.tmpRefs.add(instanceRef.value)
    }
  }

  return { value: instanceRef.value }
}

// TODO: Reflect.construct(WeakMap, args)
// TODO: ? new new Proxy(WeakMap, {})
function buildConstructorHook(
  ctor: Function,
  ctorArgs: unknown[],
  instanceRef: { value: object },
  context: Context,
) {
  const [unboundCtor, _unboundCtorThis, unboundCtorArgs] = unbindFunctionCall(
    ctor,
    undefined,
    ctorArgs,
    context,
  )

  return (
    targetCtor: Function | unknown,
    callback: (
      resolvedCtor: Function,
      resolvedCtorArgs: unknown[],
      instanceRef: { value: object },
      context: Context,
    ) => void,
  ) => {
    if (typeof targetCtor !== 'function') {
      return
    }

    if (
      unboundCtor !== targetCtor &&
      !Object.prototype.isPrototypeOf.call(targetCtor, unboundCtor)
    ) {
      return
    }

    callback(unboundCtor, unboundCtorArgs, instanceRef, context)
  }
}

function weakMapHookHandler(
  ctor: Function /* WeakMap */,
  ctorArgs: unknown[] /* [entries?] */,
  instanceRef: { value: object },
  context: Context,
) {
  if (!(instanceRef.value instanceof ctor)) {
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

  context.metadata.weakMaps.set(instanceRef.value as WeakMap<WeakKey, unknown>, metadata)
}

function weakSetHookHandler(
  ctor: Function /* WeakSet */,
  ctorArgs: unknown[] /* [values?] */,
  instanceRef: { value: object },
  context: Context,
) {
  if (!(instanceRef.value instanceof ctor)) {
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

  context.metadata.weakSets.set(instanceRef.value as WeakSet<WeakKey>, metadata)
}

function proxyHookHandler(
  _ctor: Function /* Proxy */,
  ctorArgs: unknown[] /* [target, handler] */,
  instanceRef: { value: object },
  context: Context,
) {
  const [target, handler] = ctorArgs as [object, ProxyHandler<object>]
  context.metadata.proxies.set(instanceRef.value, {
    target,
    handler,
  })
}
