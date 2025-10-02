import { NewExpression } from 'acorn'
import { evaluateNode } from '.'
import { Context, EvaluatedNode, EvaluateGenerator, Scope } from '../types'
import { getOrCreateSharedWeakRef } from '../lib/sharedWeakRefMap'
import { unbindFunctionCall } from '../lib/unbindFunctionCall'
import { WeakMapMetadata, WeakSetMetadata } from '../lib/Metadata'
import { assertFunctionSideEffectFree } from '../lib/assertFunctionSideEffectFree'
import { syncContext } from '../lib/syncContext'
import { logEvaluated, logEvaluating } from '../lib/log'
import { getNodeText } from '../lib/getNodeText'

const WeakMapInitial = WeakMap
const WeakSetInitial = WeakSet
const ProxyInitial = Proxy

// https://tc39.es/ecma262/#sec-new-operator
export function* evaluateNewExpression(
  node: NewExpression,
  scope: Scope,
  context: Context,
): EvaluateGenerator {
  DEV: logEvaluating(node, context)

  const { value: callee } = yield* evaluateNode(node.callee, scope, context)

  const args: unknown[] = []
  for (const arg of node.arguments) {
    arg.parent = node
    const { value } = yield* evaluateNode(arg, scope, context)

    if (arg.type === 'SpreadElement') {
      const items = value as unknown[]
      args.push(...items)
    } else {
      args.push(value)
    }
  }

  if (!isConstructor(callee, context)) {
    const calleeStr = getNodeText(node.callee, context.code)
    throw new TypeError(`${calleeStr} is not a constructor`)
  }

  if (syncContext?.throwOnSideEffect) {
    assertFunctionSideEffectFree(callee, context)
  }

  // NOTE: instance is always an object, even if constructor returns primitive value.
  // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/new#description for details.
  const instance: object = new callee(...args)
  const instanceRef = { value: instance }

  try {
    const hookConstructor = buildConstructorHook(callee, args, instanceRef, context)
    hookConstructor(WeakMapInitial, weakMapHookHandler)
    hookConstructor(WeakSetInitial, weakSetHookHandler)
    hookConstructor(ProxyInitial, proxyHookHandler)
  } catch (error) {
    console.warn('Failed to hook constructor call', error)
  }

  syncContext?.tmpRefs.add(instanceRef.value)

  const evaluated: EvaluatedNode = { value: instanceRef.value }
  DEV: logEvaluated(evaluated, node, context)
  return yield evaluated
}

// https://tc39.es/ecma262/#sec-isconstructor
function isConstructor(callee: unknown, context: Context): callee is Function {
  if (typeof callee !== 'function') {
    return false
  }

  const metadata = context.metadata.functions.get(callee)
  if (metadata && typeof metadata.constructable === 'boolean') {
    return metadata.constructable
  }

  // There is no built-in way to check whether an unknown value is constructable (has [[Construct]] internal method).
  // Since this interpreter is non-sandboxed, and `callee` can be an external value created outside of the interpreter,
  // we use this workaround to check if the value is constructable:
  try {
    // `callee` isn't called here, so it's safe in terms of side effects.
    Reflect.construct(function () {}, [], callee)
  } catch {
    return false
  }

  return true
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
      const keyRef = getOrCreateSharedWeakRef(key)
      const valueRef =
        value !== null && typeof value === 'object' ? getOrCreateSharedWeakRef(value) : value
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
        value !== null && typeof value === 'object' ? getOrCreateSharedWeakRef(value) : value
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
