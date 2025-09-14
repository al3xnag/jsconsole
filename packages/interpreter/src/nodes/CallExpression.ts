import { CallExpression } from 'acorn'
import { evaluateNode } from '.'
import { assertFunctionCallSideEffectFree } from '../lib/assertFunctionCallSideEffectFree'
import { getNodeText } from '../lib/getNodeText'
import { logEvaluated, logEvaluating } from '../lib/log'
import { getOrCreateSharedWeakRef, getSharedWeakRef } from '../lib/sharedWeakRefMap'
import { syncContext } from '../lib/syncContext'
import { unbindFunctionCall } from '../lib/unbindFunctionCall'
import { Context, EvaluatedNode, EvaluateGenerator, Scope } from '../types'

const FunctionPrototypeToString = Function.prototype.toString
const FunctionPrototypeBind = Function.prototype.bind
const WeakMapPrototypeSet = WeakMap.prototype.set
const WeakMapPrototypeDelete = WeakMap.prototype.delete
const WeakSetPrototypeAdd = WeakSet.prototype.add
const WeakSetPrototypeDelete = WeakSet.prototype.delete

const FunctionPrototypeCall = Function.prototype.call
const FunctionPrototypeApply = Function.prototype.apply

export function* evaluateCallExpression(
  node: CallExpression,
  scope: Scope,
  context: Context,
): EvaluateGenerator {
  DEV: logEvaluating(node, context)

  node.callee.parent = node
  const { value: func, base: thisArg } = yield* evaluateNode(node.callee, scope, context)

  if (node.optional && func == null) {
    const evaluated: EvaluatedNode = { value: undefined }
    DEV: logEvaluated(evaluated, node, context)
    return yield evaluated
  }

  if (typeof func !== 'function') {
    const calleeStr = getNodeText(node.callee, context.code)
    throw new TypeError(`${calleeStr} is not a function`)
  }

  const argValues: unknown[] = []
  for (const arg of node.arguments) {
    arg.parent = node
    const { value } = yield* evaluateNode(arg, scope, context)

    if (arg.type === 'SpreadElement') {
      const items = value as unknown[]
      argValues.push(...items)
    } else {
      argValues.push(value)
    }
  }

  if (syncContext?.throwOnSideEffect) {
    assertFunctionCallSideEffectFree(func, thisArg, argValues, context)
  }

  const result = Reflect.apply(func, thisArg, argValues)
  const resultRef = { value: result }

  try {
    const hookFunctionCall = buildFunctionCallHook(func, thisArg, argValues, resultRef, context)
    hookFunctionCall(FunctionPrototypeBind, functionPrototypeBindHookHandler)
    hookFunctionCall(FunctionPrototypeToString, functionPrototypeToStringHookHandler)
    hookFunctionCall(WeakMapPrototypeSet, weakMapPrototypeSetHookHandler)
    hookFunctionCall(WeakMapPrototypeDelete, weakMapPrototypeDeleteHookHandler)
    hookFunctionCall(WeakSetPrototypeAdd, weakSetPrototypeAddHookHandler)
    hookFunctionCall(WeakSetPrototypeDelete, weakSetPrototypeDeleteHookHandler)
  } catch (error) {
    console.warn('Failed to hook function call', error)
  }

  const evaluated: EvaluatedNode = { value: resultRef.value }

  DEV: logEvaluated(evaluated, node, context)

  return yield evaluated
}

// TODO: Reflect.apply(WeakMap.prototype.set/delete, weakMap, args)
// TODO: Proxy stuff like `new Proxy(WeakMap.prototype.set, {}).call(new WeakMap(), {}, {})`, including `apply/call` can be catched by proxy.
function buildFunctionCallHook(
  fn: Function,
  fnThis: unknown,
  fnArgs: unknown[],
  resultRef: { value: unknown },
  context: Context,
) {
  let [unboundFn, unboundFnThis, unboundFnArgs] = unbindFunctionCall(fn, fnThis, fnArgs, context)

  // WeakMap.prototype.set.call(weakMap, key, value)
  // WeakMap.prototype.set.apply(weakMap, [key, value])
  if (
    (unboundFn === FunctionPrototypeCall || unboundFn === FunctionPrototypeApply) &&
    typeof unboundFnThis === 'function' /* set | apply */
  ) {
    fn = unboundFnThis
    if (unboundFn === FunctionPrototypeCall) {
      ;[fnThis, ...fnArgs] = unboundFnArgs as [unknown, ...unknown[]] // [weakMap, key, value]
    } else if (unboundFn === FunctionPrototypeApply) {
      ;[fnThis, fnArgs] = unboundFnArgs as [unknown, unknown[]] // [weakMap, [key, value]]
    } else {
      throw new Error('Invalid value')
    }

    ;[unboundFn, unboundFnThis, unboundFnArgs] = unbindFunctionCall(fn, fnThis, fnArgs, context)
  }

  return (
    targetFn: Function | unknown,
    callback: (
      resolvedFn: Function,
      resolvedFnThis: unknown,
      resolvedFnArgs: unknown[],
      resultRef: { value: unknown },
      context: Context,
    ) => void,
  ) => {
    if (typeof targetFn !== 'function') {
      return
    }

    // weakMap.set(key, value)
    if (unboundFn === targetFn /* set */) {
      callback(
        unboundFn /* set */,
        unboundFnThis /* weakMap */,
        unboundFnArgs /* [key, value] */,
        resultRef,
        context,
      )
    }
  }
}

// myFn.bind(thisArg, arg1, arg2)
function functionPrototypeBindHookHandler(
  _fn: Function /* bind */,
  fnThis: unknown /* myFn */,
  fnArgs: unknown[] /* [thisArg, arg1, arg2] */,
  resultRef: { value: unknown },
  context: Context,
) {
  if (typeof resultRef.value !== 'function' || typeof fnThis !== 'function') {
    return
  }

  const [boundThis, ...boundArgs] = fnArgs as [unknown, ...unknown[]]
  context.metadata.functions.set(resultRef.value, {
    bound: true,
    boundThis,
    boundArgs,
    targetFunction: fnThis,
  })
}

// myFn.toString()
function functionPrototypeToStringHookHandler(
  _fn: Function /* toString */,
  fnThis: unknown /* myFn */,
  _fnArgs: unknown[] /* [] */,
  resultRef: { value: unknown },
  context: Context,
): string | undefined {
  if (typeof fnThis !== 'function') {
    return
  }

  const fnMetadata = context.metadata.functions.get(fnThis)
  if (!fnMetadata) {
    return
  }

  if (fnMetadata.sourceCode !== undefined) {
    resultRef.value = fnMetadata.sourceCode satisfies string
  }
}

// weakMap.set(key, value)
function weakMapPrototypeSetHookHandler(
  _fn: Function /* set */,
  fnThis: unknown /* weakMap */,
  fnArgs: unknown[] /* [key, value] */,
  _resultRef: { value: unknown },
  context: Context,
) {
  const callerMetadata = context.metadata.weakMaps.get(fnThis as WeakMap<WeakKey, unknown>)
  if (!callerMetadata) {
    return
  }

  const [key, value] = fnArgs as [WeakKey, unknown]
  const keyRef = getOrCreateSharedWeakRef(key)
  const valueRef =
    value !== null && typeof value === 'object' ? getOrCreateSharedWeakRef(value) : value
  callerMetadata.entries.set(keyRef, valueRef)
}

// weakMap.delete(key)
function weakMapPrototypeDeleteHookHandler(
  _fn: Function /* delete */,
  fnThis: unknown /* weakMap */,
  fnArgs: unknown[] /* [key] */,
  _resultRef: { value: unknown },
  context: Context,
) {
  const callerMetadata = context.metadata.weakMaps.get(fnThis as WeakMap<WeakKey, unknown>)
  if (!callerMetadata) {
    return
  }

  const [key] = fnArgs as [WeakKey]
  const keyRef = getSharedWeakRef(key)
  if (keyRef) {
    callerMetadata.entries.delete(keyRef)
  }
}

// weakSet.add(value)
function weakSetPrototypeAddHookHandler(
  _fn: Function /* add */,
  fnThis: unknown /* weakSet */,
  fnArgs: unknown[] /* [value] */,
  _resultRef: { value: unknown },
  context: Context,
) {
  const callerMetadata = context.metadata.weakSets.get(fnThis as WeakSet<WeakKey>)
  if (!callerMetadata) {
    return
  }

  const [value] = fnArgs as [WeakKey]
  const valueRef = getOrCreateSharedWeakRef(value)
  callerMetadata.values.add(valueRef)
}

// weakSet.delete(value)
function weakSetPrototypeDeleteHookHandler(
  _fn: Function /* delete */,
  fnThis: unknown /* weakSet */,
  fnArgs: unknown[] /* [value] */,
  _resultRef: { value: unknown },
  context: Context,
) {
  const callerMetadata = context.metadata.weakSets.get(fnThis as WeakSet<WeakKey>)
  if (!callerMetadata) {
    return
  }

  const [value] = fnArgs as [WeakKey]
  const valueRef = getSharedWeakRef(value)
  if (valueRef) {
    callerMetadata.values.delete(valueRef)
  }
}
