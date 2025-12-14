import { CallExpression } from 'acorn'
import { CallStack, Context } from '../types'
import { errorHookHandler } from './hookConstruct'
import { InternalError } from './InternalError'
import { getOrCreateSharedWeakRef, getSharedWeakRef } from './sharedWeakRefMap'
import { unbindFunctionCall } from './unbindFunctionCall'
import { captureStackTrace, Location } from './errorStack'

export function hookCallAfter(
  node: CallExpression,
  fn: Function,
  fnThis: unknown,
  fnArgs: unknown[],
  result: unknown,
  callStack: CallStack,
  context: Context,
): unknown {
  const [resolvedFn, resolvedFnThis, resolvedFnArgs] = resolveCallee(fn, fnThis, fnArgs, context)
  const resultRef = { value: result }

  functionPrototypeBindHookHandler(resolvedFn, resolvedFnThis, resolvedFnArgs, result, context)
  functionPrototypeToStringHookHandler(resolvedFn, resolvedFnThis, resultRef, context)
  weakMapPrototypeSetHookHandler(resolvedFn, resolvedFnThis, resolvedFnArgs, context)
  weakMapPrototypeDeleteHookHandler(resolvedFn, resolvedFnThis, resolvedFnArgs, context)
  weakSetPrototypeAddHookHandler(resolvedFn, resolvedFnThis, resolvedFnArgs, context)
  weakSetPrototypeDeleteHookHandler(resolvedFn, resolvedFnThis, resolvedFnArgs, context)
  errorHookHandler(resolvedFn, result, node, callStack, context)
  errorCaptureStackTraceHookHandler(resolvedFn, resolvedFnArgs, node, callStack, context)
  promiseHandledHookHandler(resolvedFn, resolvedFnThis, context)

  return resultRef.value
}

// TODO: Reflect.apply(WeakMap.prototype.set/delete, weakMap, args)
// TODO: Proxy stuff like `new Proxy(WeakMap.prototype.set, {}).call(new WeakMap(), {}, {})`, including `apply/call` can be catched by proxy.
function resolveCallee(
  fn: Function,
  fnThis: unknown,
  fnArgs: unknown[],
  context: Context,
): [resolvedFn: Function, resolvedFnThis: unknown, resolvedFnArgs: unknown[]] {
  let [unboundFn, unboundFnThis, unboundFnArgs] = unbindFunctionCall(fn, fnThis, fnArgs, context)

  const FunctionPrototypeCall = context.metadata.globals.FunctionPrototypeCall
  const FunctionPrototypeApply = context.metadata.globals.FunctionPrototypeApply

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
      throw new InternalError('Invalid value')
    }

    // [set, weakMap, [key, value]]
    ;[unboundFn, unboundFnThis, unboundFnArgs] = unbindFunctionCall(fn, fnThis, fnArgs, context)
  }

  return [unboundFn, unboundFnThis, unboundFnArgs]
}

// myFn.bind(thisArg, arg1, arg2)
function functionPrototypeBindHookHandler(
  fn: Function /* bind */,
  fnThis: unknown /* myFn */,
  fnArgs: unknown[] /* [thisArg, arg1, arg2] */,
  result: unknown,
  context: Context,
) {
  if (
    fn !== context.metadata.globals.FunctionPrototypeBind ||
    typeof result !== 'function' ||
    typeof fnThis !== 'function'
  ) {
    return
  }

  const targetFunction = fnThis
  const targetFunctionMetadata = context.metadata.functions.get(targetFunction)

  const [boundThis, ...boundArgs] = fnArgs as [unknown, ...unknown[]]
  context.metadata.functions.set(result, {
    ...targetFunctionMetadata,
    bound: true,
    boundThis,
    boundArgs,
    targetFunction,
  })
}

// myFn.toString()
function functionPrototypeToStringHookHandler(
  fn: Function /* toString */,
  fnThis: unknown /* myFn */,
  resultRef: { value: unknown },
  context: Context,
): string | undefined {
  if (fn !== context.metadata.globals.FunctionPrototypeToString || typeof fnThis !== 'function') {
    return
  }

  const fnMetadata = context.metadata.functions.get(fnThis)
  if (!fnMetadata) {
    return
  }

  if (fnMetadata.sourceCode !== undefined && !fnMetadata.bound) {
    resultRef.value = fnMetadata.sourceCode satisfies string
  }
}

// weakMap.set(key, value)
function weakMapPrototypeSetHookHandler(
  fn: Function /* set */,
  fnThis: unknown /* weakMap */,
  fnArgs: unknown[] /* [key, value] */,
  context: Context,
) {
  if (fn !== context.metadata.globals.WeakMapPrototypeSet) {
    return
  }

  const callerMetadata = context.metadata.weakMaps.get(fnThis as WeakMap<WeakKey, unknown>)
  if (!callerMetadata) {
    return
  }

  const [key, value] = fnArgs as [WeakKey, unknown]
  const keyRef = getOrCreateSharedWeakRef(key, context)
  const valueRef =
    value !== null && typeof value === 'object' ? getOrCreateSharedWeakRef(value, context) : value
  callerMetadata.entries.set(keyRef, valueRef)
}

// weakMap.delete(key)
function weakMapPrototypeDeleteHookHandler(
  fn: Function /* delete */,
  fnThis: unknown /* weakMap */,
  fnArgs: unknown[] /* [key] */,
  context: Context,
) {
  if (fn !== context.metadata.globals.WeakMapPrototypeDelete) {
    return
  }

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
  fn: Function /* add */,
  fnThis: unknown /* weakSet */,
  fnArgs: unknown[] /* [value] */,
  context: Context,
) {
  if (fn !== context.metadata.globals.WeakSetPrototypeAdd) {
    return
  }

  const callerMetadata = context.metadata.weakSets.get(fnThis as WeakSet<WeakKey>)
  if (!callerMetadata) {
    return
  }

  const [value] = fnArgs as [WeakKey]
  const valueRef = getOrCreateSharedWeakRef(value, context)
  callerMetadata.values.add(valueRef)
}

// weakSet.delete(value)
function weakSetPrototypeDeleteHookHandler(
  fn: Function /* delete */,
  fnThis: unknown /* weakSet */,
  fnArgs: unknown[] /* [value] */,
  context: Context,
) {
  if (fn !== context.metadata.globals.WeakSetPrototypeDelete) {
    return
  }

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

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/captureStackTrace
function errorCaptureStackTraceHookHandler(
  fn: Function /* captureStackTrace */,
  fnArgs: unknown[] /* [object, constructor?] */,
  node: CallExpression,
  callStack: CallStack,
  context: Context,
) {
  if (fn !== context.metadata.globals.ErrorCaptureStackTrace) {
    return
  }

  const [object, constructor] = fnArgs as [object, Function?]
  let loc: Location =
    node.callee.type === 'MemberExpression' ? node.callee.property.loc : node.callee.loc

  if (typeof constructor === 'function') {
    const constructorIndex = callStack.findIndex(({ fn }) => fn === constructor)
    if (constructorIndex !== -1) {
      loc = callStack[constructorIndex].loc
      callStack = callStack.slice(0, constructorIndex)
    }
  }

  captureStackTrace(object, loc!, callStack, context, 'unsafe')
}

// promise.then/catch/finally(...)
function promiseHandledHookHandler(
  fn: Function /* then, catch, finally */,
  fnThis: unknown /* promise */,
  context: Context,
) {
  if (
    (fn === context.metadata.globals.PromiseThen ||
      fn === context.metadata.globals.PromiseCatch ||
      fn === context.metadata.globals.PromiseFinally) &&
    fnThis instanceof context.metadata.globals.Promise
  ) {
    const metadata = context.metadata.promises.get(fnThis)
    if (metadata) {
      metadata.handled = true
    }
  }
}
